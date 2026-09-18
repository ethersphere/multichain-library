# node-test

Ad-hoc harness for exercising `@upcoming/multichain-library` from plain Node, without
the widget and without Vite.

## Packaging fix (prerequisite)

Before any of this could run, the library had to become importable from Node. The issue
reports `ERR_MODULE_NOT_FOUND` on `./Constants` when importing `@upcoming/multichain-library@2.0.1`
under plain Node. It has been reproduced fully. It was because `tsconfig.json` had `"moduleResolution": "bundler"` as you have stated in your issues log,
which permits extensionless relative imports. TypeScript deliberately does not rewrite module specifiers, so
`import { Constants } from './Constants'` is emitted verbatim.

Cause: `tsconfig.json` had `"moduleResolution": "bundler"`,  Bundlers resolve it;
Node's ESM resolver requires the full filename. The compiler never flagged it.

Changes on this branch:

- `tsconfig.json`: `"module"` and `"moduleResolution"` to `nodenext`
- `.js` extensions added to all relative imports across `src/`
- `package.json`: added `"type": "module"`
- `package.json`: dropped the `"require"` condition from `exports` (it pointed at an ESM
  file, so it was never functional)
- `package.json`: `"build": "rm -rf dist && tsc"` — the stale `GasPriceSelector` in dist
  came from not cleaning

Verification:

```bash
npm run build
node -e "import('./dist/index.js').then(m => console.log(Object.keys(m).join(', ')))"
# MultichainLibrary, USDC, xBZZ, xDAI
```

If `__esModule`, `default` or `module.exports` appear in that list, tsc emitted CommonJS
and `"type": "module"` is missing.

**The widget build is unaffected.** `pnpm build` in `multichain-widget` still succeeds.
The widget bundles the library through Vite in lib mode with only `react` / `react-dom`
external, so explicit extensions are strictly more compatible than what was there before.

This change is breaking (ESM-only, `require` condition removed).

## Running

```bash
npm run build          # scripts import from ../dist
node --env-file=.env node-test/read-only.js

FUNDED_ADDRESS=0x...    # any address holding xDAI; read-only, no key needed
PRIVATE_KEY=0x...       # throwaway wallet, it is needed for live-swap.js only
TARGET_ADDRESS=0x...    # where swapped xBZZ should land
DRY_RUN=1               # live-swap.js: If you would like to try a DRY_RUN, add it in ENV then delete for the actual prod test
```

## Scripts

### `read-only.js`

No key, no cost. Calls the basic getters, then two probes.

- **Probe 1** — `getGnosisTransactionReceipt` against a random (non-existent) tx hash.
- **Probe 2** — reads `name()` / `symbol()` / `decimals()` from `Constants.usdcGnosisAddress`.

### `probes.js`

No cost. `FUNDED_ADDRESS` required for probe 5 (`estimateGas` needs an address with a
balance; no key needed).

- **Probe 3** — `waitForGnosisTransactionReceipt` against a non-existent tx hash. Runs
  for up to ~100s by design.
- **Probe 4** — compares the library's `getGnosisGasPrice` against a raw `eth_gasPrice`
  via viem.
- **Probe 5** — `getSushiContractQuoteXdai` for 0.01 xDAI.

### `live-swap.js`

**Spends real funds.** Use a throwaway key with ~0.05 xDAI on it. Run with `DRY_RUN=1`
first: it prints the derived origin address and stops before sending.

Performs a 0.01 xDAI → xBZZ swap with `to` set to a different address than the sender,
mirroring the widget's `temporaryAddress` → `targetAddress` split.

- Reads the nonce immediately after sending, while the tx is still in the mempool.
- **Probe 6** — `waitForGnosisTransactionReceipt` on the real, freshly sent tx.
- **Probe 7** — `waitForGnosisBzzBalanceToIncrease` on the target.

## Results

Run on Gnosis mainnet, library at `feat/library-node-test`

| Check | Result |
| --- | --- |
| Import under plain Node | Works after the packaging fix |
| Widget build | Unaffected |
| `getGnosisGasPrice` vs raw `eth_gasPrice` | Both 12 wei — no scaling bug |
| SushiSwap contract quote (0.01 xDAI) | 2433760784710638 xBZZ, min 2421591980787084, gas 148377 |
| Live swap: xBZZ received | 2433760784710638 — exact match with the quote |
| Live swap: gas spent | 1362449 wei |
| `usdcGnosisAddress` identity | `Bridged USDC (Gnosis)` / `USDC.e` / 6 decimals |
| Receipt getter, non-existent tx | Throws `TypeError: Expected object, got: null` |
| Receipt waiter, non-existent tx | Times out after 93.4s |
| Receipt waiter, real tx | Resolves after 10.4s |
| Nonce read while tx in mempool | Unchanged — library reads at `latest` |

### What these mean for swarm-id#696

**The USDC bug report is confirmed, including the pool claim.**
`0x2a22f9c3b484c3629090feed35f17ff8f88f76f0` is `USDC.e` (Bridged USDC (Gnosis)),
6 decimals, and has **no SushiSwap V3 pool against BZZ** at any fee tier (100 / 500 /
3000 / 10000). The address proposed in the issue,
`0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83`, is `USDC` (`USD//C on xDai`), 6 decimals,
with pools at fee 3000 (`0x6f30B7CF40CB423c1D23478a9855701Ecf43931E`) and fee 10000
(`0x6631fed52a7d12E62ca317Ad0bA67D479b5ab262`).

This is ours to fix and is independent of the consolidation question. It has become more
consequential since the review was written — `getGnosisUsdcBalance`, the USDC waiters and
the USDC branch of `getSushiSwapQuote` have all been added since, and all of them
currently read the wrong token.

**The receipt-getter description in the issue is not accurate.** It states that a pending
receipt is cast into a mangled object. In practice `Types.asObject(null)` throws. The
error is then swallowed by `System.waitFor`, which is why the waiter polls rather than
failing — the net behaviour matches what the issue describes, but the mechanism is
different, and it matters for how the fix should be written.

**The receipt waiter does not distinguish "not mined yet" from "no such transaction".**
93.4s vs 10.4s is only a difference in how long the same polling loop runs. Making the
getter report "not mined yet" explicitly is the right fix; note that
`waitForGnosisTransactionReceipt` has no try/catch, while all five balance waiters do. Gonna fix that. 

**The nonce is read at `latest`, and this currently prevents a duplication-send issue.**
The widget's `SushiStep` catches waiter errors and retries on the first attempt, while
`swapOnGnosisCustom` accepts no nonce and always fetches its own. Today a retry lands on
the same nonce — a replacement. If the nonce moves to `pending` while the receipt waiter
also starts surfacing errors to the caller, a retry sends a *second* swap alongside the
first one still in the mempool.

The transport, receipt and nonce changes should therefore land together, in one release,
and should carry a try/catch in `waitForGnosisTransactionReceipt` plus an explicit
`nonce` field on `GnosisSwapCustomOptions`.

**`library.constants` is load-bearing for the widget, which means it must stay public.** 14 call sites read it directly
(`nullAddress`, `gnosisChainId`, `bzzGnosisAddress`, `postageStampGnosisAddress`,
`daiDustAmount`). `daiDustAmount` is a `FixedPointNumber` the widget does arithmetic
with, not an address.

**SushiSwap: a scheduling conflict, not a review error.** swarm-id#696 was written
against `005448b`, which is current `origin/main` — their baseline is correct. However,
our unmerged `feat/smart-contract-integration` branch replaces the API-based quote with
direct V3 quoter/router calls (`getSushiContractQuoteXdai`) and reworks the Relay
integration. Upstreaming exact-output quotes and USDC routing would collide with that
branch. Worth raising before anyone writes the PR.

## Coverage

Exercised: `getGnosisGasPrice`, `getGnosisBzzTokenPrice`, `getTokenPrice`,
`getStoragePriceGnosis`, `getGnosisNativeBalance`, `getGnosisBzzBalance`,
`getGnosisUsdcBalance`, `getGnosisTransactionCount`, `getGnosisTransactionReceipt`,
`getSushiContractQuoteXdai`, `swapOnGnosisAuto`, `swapOnGnosisCustom`,
`waitForGnosisTransactionReceipt`, `waitForGnosisBzzBalanceToIncrease`.

Not exercised: Relay (widget-only, out of scope), `approveGnosisBzz`,
`createBatchGnosis`, `transferGnosisNative`, `multiTransferGnosisNative`,
`transferGnosisBzz`, the USDC swap path (throws by design — *"USDC swaps not yet
migrated to direct contract calls"*). We had to skip these because this only lives on the widget yet, need more time to test these. 

## Notes

- `package.json` reads `1.1.0` while the package is published as `2.0.1`. Unrelated to
  the above, but worth reconciling.
- The repo carries both `package-lock.json` and `pnpm-lock.yaml`.
- `swapOnGnosisCustom` passes `chain: Constants.gnosisChainId` (a number) where viem
  expects a `Chain` object. `chainId` is passed separately, so it appears to work.
- `getSushiContractQuoteXdai` builds its own viem client from
  `jsonRpcProvider.current()`, bypassing `durableFetch` and therefore the RPC rotation.
  A dead RPC fails the quote with no failover. Relevant to swarm-id#555.