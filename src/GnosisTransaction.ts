import { RollingValueProvider, Types } from 'cafe-utility'
import { durableFetch } from './Fetch'
import { MultichainLibrarySettings } from './Settings'

export interface GnosisTransaction {
    blockHash: `0x${string}`
    blockNumber: `0x${string}`
    hash: `0x${string}`
    from: `0x${string}`
    to: `0x${string}`
    nonce: `0x${string}`
    value: `0x${string}`
    gas: `0x${string}`
    gasPrice: `0x${string}`
}

export async function getGnosisTransaction(
    transactionHash: `0x${string}`,
    settings: MultichainLibrarySettings,
    jsonRpcProvider: RollingValueProvider<string>
): Promise<GnosisTransaction> {
    const payload = { jsonrpc: '2.0', id: 1, method: 'eth_getTransactionByHash', params: [transactionHash] }
    const response = await durableFetch(jsonRpcProvider, settings, 'POST', payload)
    const data = await response.json()
    const object = Types.asObject(data)
    return object as unknown as GnosisTransaction
}
