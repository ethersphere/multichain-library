import { privateKeyToAccount } from 'viem/accounts'
import { MultichainLibrary } from '../dist/index.js'

const PRIVATE_KEY = process.env.PRIVATE_KEY          // 0x-prefixed throwaway key
const TARGET = process.env.TARGET_ADDRESS            // where xBZZ should land
const DRY_RUN = process.env.DRY_RUN === '1'
const AMOUNT = 10_000_000_000_000_000n               // 0.01 xDAI

if (!PRIVATE_KEY) {
    console.error('PRIVATE_KEY is required')
    process.exit(1)
}

const library = new MultichainLibrary()
const account = privateKeyToAccount(PRIVATE_KEY)
const origin = account.address

console.log('origin (temporary wallet):', origin)
console.log('target (xBZZ recipient)  :', TARGET || '(not set)')
console.log()

const daiBefore = await library.getGnosisNativeBalance(origin)
console.log('origin xDAI balance:', daiBefore.toString(), `(${daiBefore.toFloat()})`)

if (daiBefore.value < AMOUNT * 2n) {
    console.error(`\nNot enough xDAI. Send at least 0.05 xDAI to ${origin} and rerun.`)
    process.exit(1)
}

if (!TARGET) {
    console.error('TARGET_ADDRESS is required for the swap')
    process.exit(1)
}

const bzzBefore = await library.getGnosisBzzBalance(TARGET)
console.log('target xBZZ balance:', bzzBefore.toString(), `(${bzzBefore.toFloat()})`)

const quote = await library.getSushiContractQuoteXdai(AMOUNT, origin, TARGET)
console.log()
console.log('quote: expect', quote.expectedAmountOut.toString(), 'xBZZ, min', quote.amountOutMinimum.toString())
console.log('gas estimate:', quote.tx.gas.toString())

if (DRY_RUN) {
    console.log('\nDRY_RUN=1, stopping before sending.')
    process.exit(0)
}

console.log()
console.log('--- sending swap ---')
const nonceBefore = await library.getGnosisTransactionCount(origin)
console.log('nonce before send:', nonceBefore)

const sentAt = Date.now()
const tx = await library.swapOnGnosisAuto({
    inputToken: 'xDAI',
    amount: AMOUNT.toString(),
    originPrivateKey: PRIVATE_KEY,
    to: TARGET
})
console.log('tx hash:', tx)
console.log('explorer: https://gnosisscan.io/tx/' + tx)

// Immediately after sending, before the tx is mined: does the nonce differ
// depending on how it is read? This is the core of the pending/latest question.
const nonceAfter = await library.getGnosisTransactionCount(origin)
console.log('nonce right after send (library, reads at "latest"):', nonceAfter)
console.log('  -> if unchanged, a retry would REPLACE the tx')
console.log('  -> if incremented, a retry would send a SECOND swap')

console.log()
console.log('--- probe 6: waitForGnosisTransactionReceipt on a real, freshly sent tx ---')
const waitStartedAt = Date.now()
try {
    await library.waitForGnosisTransactionReceipt(tx)
    console.log(`resolved after ${((Date.now() - waitStartedAt) / 1000).toFixed(1)}s`)
} catch (error) {
    console.log(`threw after ${((Date.now() - waitStartedAt) / 1000).toFixed(1)}s:`, error.message)
}
console.log('total time from send:', ((Date.now() - sentAt) / 1000).toFixed(1) + 's')

console.log()
console.log('--- probe 7: waitForGnosisBzzBalanceToIncrease on target ---')
const balanceWaitStartedAt = Date.now()
try {
    await library.waitForGnosisBzzBalanceToIncrease(TARGET, bzzBefore.value)
    console.log(`resolved after ${((Date.now() - balanceWaitStartedAt) / 1000).toFixed(1)}s`)
} catch (error) {
    console.log(`threw after ${((Date.now() - balanceWaitStartedAt) / 1000).toFixed(1)}s:`, error.message)
}

console.log()
const daiAfter = await library.getGnosisNativeBalance(origin)
const bzzAfter = await library.getGnosisBzzBalance(TARGET)
console.log('origin xDAI:', daiBefore.toString(), '->', daiAfter.toString())
console.log('target xBZZ:', bzzBefore.toString(), '->', bzzAfter.toString())
console.log('xBZZ received:', (bzzAfter.value - bzzBefore.value).toString())
console.log('expected     :', quote.expectedAmountOut.toString())