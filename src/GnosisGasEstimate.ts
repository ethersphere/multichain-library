import { RollingValueProvider, Types } from 'cafe-utility'
import { durableFetch } from './Fetch'
import { MultichainLibrarySettings } from './Settings'

export interface GnosisGasEstimateOptions {
    from: `0x${string}`
    to: `0x${string}`
    value?: bigint
    data?: `0x${string}`
}

export async function estimateGnosisGas(
    options: GnosisGasEstimateOptions,
    settings: MultichainLibrarySettings,
    jsonRpcProvider: RollingValueProvider<string>
): Promise<bigint> {
    const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_estimateGas',
        params: [
            {
                from: options.from,
                to: options.to,
                ...(options.value === undefined ? {} : { value: `0x${options.value.toString(16)}` }),
                ...(options.data === undefined ? {} : { data: options.data })
            }
        ]
    }
    const response = await durableFetch(jsonRpcProvider, settings, 'POST', payload)
    const data = await response.json()
    const object = Types.asObject(data)
    const gas = Types.asHexString(object.result, { strictPrefix: true, uneven: true })
    return BigInt(gas)
}
