import { FixedPointNumber, RollingValueProvider, Types } from 'cafe-utility'
import { durableFetch } from './Fetch.js'
import { MultichainLibrarySettings } from './Settings.js'

export async function getGnosisNativeBalance(
    address: `0x${string}`,
    settings: MultichainLibrarySettings,
    jsonRpcProvider: RollingValueProvider<string>
): Promise<FixedPointNumber> {
    const payload = { jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] }
    const response = await durableFetch(jsonRpcProvider, settings, 'POST', payload)
    const data = await response.json()
    const object = Types.asObject(data)
    const price = Types.asHexString(object.result, { strictPrefix: true, uneven: true })
    return new FixedPointNumber(BigInt(price), 18)
}
