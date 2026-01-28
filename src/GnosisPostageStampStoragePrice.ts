import { RollingValueProvider, Types } from 'cafe-utility'
import { durableFetch } from './Fetch'
import { MultichainLibrarySettings } from './Settings'

export async function getStoragePriceGnosis(
    settings: MultichainLibrarySettings,
    jsonRpcProvider: RollingValueProvider<string>
): Promise<bigint> {
    const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
            {
                to: '0x47eef336e7fe5bed98499a4696bce8f28c1b0a8b', // price oracle
                data: '0x9d1b464a00000000000000000000000047eef336e7fe5bed98499a4696bce8f28c1b0a8b'
            },
            'latest'
        ]
    }
    const response = await durableFetch(jsonRpcProvider, settings, 'POST', payload)
    const data = await response.json()
    const object = Types.asObject(data)
    const price = Types.asHexString(object.result, { strictPrefix: true, uneven: true })
    return BigInt(price)
}
