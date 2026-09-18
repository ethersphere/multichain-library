import { Constants } from './Constants.js'
import { MultichainLibrarySettings } from './Settings.js'

interface TokenPriceResponse {
    price: number
}

export async function getTokenPrice(
    tokenAddress: `0x${string}`,
    chainId: number,
    settings: MultichainLibrarySettings
): Promise<number> {
    const response = await fetch(
        `https://api.relay.link/currencies/token/price?address=${tokenAddress}&chainId=${chainId}`,
        { signal: AbortSignal.timeout(settings.fetchTimeoutMillis) }
    )
    const data = (await response.json()) as TokenPriceResponse
    return data.price
}

export async function getGnosisBzzTokenPrice(settings: MultichainLibrarySettings): Promise<number> {
    return getTokenPrice(Constants.bzzGnosisAddress, Constants.gnosisChainId, settings)
}
