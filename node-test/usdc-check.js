import { createPublicClient, http, parseAbi } from 'viem'
import { gnosis } from 'viem/chains'
import { MultichainLibrary } from '../dist/index.js'

const library = new MultichainLibrary()
const client = createPublicClient({ chain: gnosis, transport: http(library.jsonRpcProvider.current()) })

const CANDIDATES = {
    'current (Constants.usdcGnosisAddress)': library.constants.usdcGnosisAddress,
    'proposed in swarm-id#696': '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83'
}

const erc20 = parseAbi([
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)'
])

const factoryAbi = parseAbi([
    'function getPool(address, address, uint24) view returns (address)'
])
const SUSHI_V3_FACTORY = '0xf78031CBCA409F2FB6876BDFDBc1b2df24cF9bEf'
const FEES = [100, 500, 3000, 10000]

for (const [label, address] of Object.entries(CANDIDATES)) {
    console.log(`\n=== ${label} ===`)
    console.log('address:', address)
    for (const fn of ['name', 'symbol', 'decimals', 'totalSupply']) {
        try {
            const value = await client.readContract({ address, abi: erc20, functionName: fn })
            console.log(`  ${fn}:`, value.toString())
        } catch (error) {
            console.log(`  ${fn}: FAIL -`, error.shortMessage || error.message)
        }
    }
    console.log('  SushiSwap V3 pools against BZZ:')
    let found = false
    for (const fee of FEES) {
        try {
            const pool = await client.readContract({
                address: SUSHI_V3_FACTORY,
                abi: factoryAbi,
                functionName: 'getPool',
                args: [address, library.constants.bzzGnosisAddress, fee]
            })
            if (pool !== library.constants.nullAddress) {
                console.log(`    fee ${fee}: ${pool}`)
                found = true
            }
        } catch (error) {
            console.log(`    fee ${fee}: FAIL -`, error.shortMessage || error.message)
        }
    }
    if (!found) console.log('    none')
}