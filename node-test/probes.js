import { randomBytes } from 'crypto'
import { createPublicClient, http } from 'viem'
import { gnosis } from 'viem/chains'
import { MultichainLibrary } from '../dist/index.js'

const FUNDED = "0x4ae7156826FaB9dE8f7c2a3b9Bb37A98712E7b4e"
const library = new MultichainLibrary()

console.log('--- probe 3: does waitForGnosisTransactionReceipt throw or keep polling? ---')
console.log('(fast throw = ~1s, swallowed error = ~100s of polling)')
const fakeHash = `0x${randomBytes(32).toString('hex')}`
const startedAt = Date.now()
try {
    await library.waitForGnosisTransactionReceipt(fakeHash)
    console.log(`resolved after ${((Date.now() - startedAt) / 1000).toFixed(1)}s`)
} catch (error) {
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1)
    console.log(`threw after ${elapsed}s:`, error.constructor.name, '-', error.message)
}

console.log()
console.log('--- probe 4: gas price sanity ---')
const publicClient = createPublicClient({ chain: gnosis, transport: http(library.jsonRpcProvider.current()) })
const raw = await publicClient.getGasPrice()
const fromLibrary = await library.getGnosisGasPrice()
console.log('raw eth_gasPrice (wei):', raw.toString(), `= ${Number(raw) / 1e9} gwei`)
console.log('library .value       :', fromLibrary.value.toString())
console.log('library .toString()  :', fromLibrary.toString())

if (!FUNDED) {
    console.log()
    console.log('FUNDED_ADDRESS not set, skipping quote')
    process.exit(0)
}

console.log()
console.log('--- probe 5: SushiSwap contract quote (read-only, no funds spent) ---')
const amount = 10_000_000_000_000_000n // 0.01 xDAI
const quote = await library.getSushiContractQuoteXdai(amount, FUNDED, FUNDED)
console.log('amountIn          :', quote.amountIn.toString())
console.log('expectedAmountOut :', quote.expectedAmountOut.toString(), `= ${Number(quote.expectedAmountOut) / 1e16} xBZZ`)
console.log('amountOutMinimum  :', quote.amountOutMinimum.toString())
console.log('gas estimate      :', quote.tx.gas.toString())
console.log('router            :', quote.tx.to)