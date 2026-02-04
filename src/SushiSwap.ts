import { Types } from 'cafe-utility'
import { Constants } from './Constants'
import { MultichainLibrarySettings } from './Settings'

interface SushiToken {
    address: `0x${string}`
    symbol: string
    name: string
    decimals: number
}

interface SushiTx {
    from: `0x${string}`
    to: `0x${string}`
    gas: string
    gasPrice: number
    data: `0x${string}`
    value: string
}

export interface SushiResponse {
    status: 'Success' | string
    tokens: SushiToken[]
    tokenFrom: number
    tokenTo: number
    swapPrice: number
    priceImpact: number
    amountIn: string
    assumedAmountOut: string
    gasSpent: number
    tx: SushiTx
}

export async function getSushiSwapQuote(
    amount: string,
    sender: string,
    recipient: string,
    settings: MultichainLibrarySettings
) {
    const tokenIn = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' // xDAI
    const tokenOut = Constants.bzzGnosisAddress
    const response = await fetch(
        `https://api.sushi.com/swap/v7/100?tokenIn=${tokenIn}&tokenOut=${tokenOut}&amount=${amount}&maxSlippage=0.005&sender=${sender}&recipient=${recipient}&fee=0.0025&feeBy=output&feeReceiver=0xde7259893af7cdbc9fd806c6ba61d22d581d5667&simulate=true`,
        { signal: AbortSignal.timeout(settings.fetchTimeoutMillis) }
    )
    const data = await response.json()
    if (response.status >= 400) {
        const reason = data.detail || data.title
        throw Error(Types.isString(reason) ? reason : `SushiSwap API error: ${response.status}`, { cause: data })
    }
    return data as SushiResponse
}
