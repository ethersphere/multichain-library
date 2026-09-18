import { RollingValueProvider, Types } from 'cafe-utility'
import { durableFetch } from './Fetch.js'
import { MultichainLibrarySettings } from './Settings.js'

export async function getGnosisTransactionCount(
    address: string,
    settings: MultichainLibrarySettings,
    jsonRpcProvider: RollingValueProvider<string>
): Promise<number> {
    address = address.toLowerCase()
    if (address.startsWith('0x')) {
        address = address.slice(2)
    }
    const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionCount',
        params: [`0x${address}`, 'latest']
    }
    const response = await durableFetch(jsonRpcProvider, settings, 'POST', payload)
    const data = await response.json()
    const object = Types.asObject(data)
    const count = Types.asHexString(object.result, { strictPrefix: true, uneven: true })
    return parseInt(count, 16)
}
