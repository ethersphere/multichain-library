import { randomBytes } from 'crypto'
import { createPublicClient, http, parseAbi } from 'viem'
import { gnosis } from 'viem/chains'
import { MultichainLibrary } from '../dist/index.js'

// Any address that HOLDS xDAI. No private key needed, we only read.
const FUNDED = process.env.FUNDED_ADDRESS

const library = new MultichainLibrary()
const C = library.constants

const show = v => {
    try { return `${v.toString()} (${v.toFloat()})` } catch { return String(v) }
}

async function check(name, fn) {
    process.stdout.write(`${name.padEnd(34)} `)
    try {
        console.log('OK  ', await fn())
    } catch (error) {
        console.log('FAIL', error.message)
    }
}

console.log('RPC:', library.settings.gnosisJsonRpcProviders.join(', '))
console.log()

// --- basic reads ---
await check('getGnosisGasPrice', async () => show(await library.getGnosisGasPrice()))
await check('getGnosisBzzTokenPrice', () => library.getGnosisBzzTokenPrice())
await check('getTokenPrice(BZZ, 100)', () => library.getTokenPrice(C.bzzGnosisAddress, 100))
await check('getStoragePriceGnosis', async () => (await library.getStoragePriceGnosis()).toString())

if (FUNDED) {
    await check('getGnosisNativeBalance', async () => show(await library.getGnosisNativeBalance(FUNDED)))
    await check('getGnosisBzzBalance', async () => show(await library.getGnosisBzzBalance(FUNDED)))
    await check('getGnosisUsdcBalance', async () => show(await library.getGnosisUsdcBalance(FUNDED)))
    await check('getGnosisTransactionCount', () => library.getGnosisTransactionCount(FUNDED))
}

console.log()
console.log('--- probe 1: receipt of a non-existent transaction ---')
const fakeHash = `0x${randomBytes(32).toString('hex')}`
try {
    const receipt = await library.getGnosisTransactionReceipt(fakeHash)
    console.log('DID NOT THROW. Returned value:', receipt)
    console.log('parseInt(status) =', parseInt(receipt?.status))
} catch (error) {
    console.log('THREW:', error.constructor.name, '-', error.message)
}

console.log()
console.log('--- probe 2: what is behind usdcGnosisAddress? ---')
const publicClient = createPublicClient({
    chain: gnosis,
    transport: http(library.jsonRpcProvider.current())
})
const erc20 = parseAbi([
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)'
])
for (const fn of ['name', 'symbol', 'decimals']) {
    try {
        const value = await publicClient.readContract({ address: C.usdcGnosisAddress, abi: erc20, functionName: fn })
        console.log(`${fn}:`, value)
    } catch (error) {
        console.log(`${fn}: FAIL -`, error.shortMessage || error.message)
    }
}
console.log('address:', C.usdcGnosisAddress)