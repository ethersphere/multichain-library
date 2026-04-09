import { FixedPointNumber, RollingValueProvider, Types } from 'cafe-utility'
import { Constants } from './Constants'
import { durableFetch } from './Fetch'
import { MultichainLibrarySettings } from './Settings'

export async function getGnosisUsdcBalance(
    address: string,
    settings: MultichainLibrarySettings,
    jsonRpcProvider: RollingValueProvider<string>
): Promise<FixedPointNumber> {
    address = address.toLowerCase()
    if (address.startsWith('0x')) {
        address = address.slice(2)
    }
    const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
            {
                from: Constants.nullAddress,
                data: `0x70a08231000000000000000000000000${address}`,
                to: Constants.usdcGnosisAddress
            },
            'latest'
        ]
    }
    const response = await durableFetch(jsonRpcProvider, settings, 'POST', payload)
    const data = await response.json()
    const object = Types.asObject(data)
    const balance = Types.asHexString(object.result, { strictPrefix: true, uneven: true })
    return new FixedPointNumber(BigInt(balance), 16)
}
