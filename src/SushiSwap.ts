import { Types } from 'cafe-utility'
import { createPublicClient, encodeFunctionData, http, parseAbi } from 'viem'
import { gnosis } from 'viem/chains'
import { Constants } from './Constants'
import { MultichainLibrarySettings } from './Settings'

// ============================================================
// OLD: API-based quote (kept during migration, remove later)
// ============================================================

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

// This can be deleted now, not using the API, leaving here for now

export async function getSushiSwapQuote(
    inputToken: 'xDAI' | 'USDC',
    amount: string,
    sender: string,
    recipient: string,
    settings: MultichainLibrarySettings
) {
    const tokenIn = inputToken === 'xDAI' ? Constants.sushiSwapGnosisDaiAddress : Constants.usdcGnosisAddress
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

// NEW: direct contract quote via SushiSwap V3 (Gnosis)

const quoterAbi = parseAbi([
    'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
])

const routerAbi = parseAbi([
    'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)',
])

export interface ContractSwapQuote {
    amountIn: bigint
    expectedAmountOut: bigint
    amountOutMinimum: bigint
    tx: { to: `0x${string}`; value: bigint; data: `0x${string}`; gas: bigint }
}

export async function getSushiContractQuoteXdai(
    amount: bigint,
    sender: `0x${string}`,
    recipient: `0x${string}`,
    jsonRpcUrl: string
): Promise<ContractSwapQuote> {
    const publicClient = createPublicClient({ chain: gnosis, transport: http(jsonRpcUrl) })

    const { result } = await publicClient.simulateContract({
        address: Constants.sushiV3QuoterGnosisAddress,
        abi: quoterAbi,
        functionName: 'quoteExactInputSingle',
        args: [{
            tokenIn: Constants.wxdaiGnosisAddress,
            tokenOut: Constants.bzzGnosisAddress,
            amountIn: amount,
            fee: Constants.sushiV3BzzPoolFee,
            sqrtPriceLimitX96: 0n,
        }],
    })
    const expectedAmountOut = result[0]

    const amountOutMinimum = (expectedAmountOut * 995n) / 1000n
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600)

    const data = encodeFunctionData({
        abi: routerAbi,
        functionName: 'exactInputSingle',
        args: [{
            tokenIn: Constants.wxdaiGnosisAddress,
            tokenOut: Constants.bzzGnosisAddress,
            fee: Constants.sushiV3BzzPoolFee,
            recipient,
            deadline,
            amountIn: amount,
            amountOutMinimum,
            sqrtPriceLimitX96: 0n,
        }],
    })

    const gas = await publicClient.estimateGas({
        account: sender,
        to: Constants.sushiV3RouterGnosisAddress,
        value: amount,
        data,
    })

    return {
        amountIn: amount,
        expectedAmountOut,
        amountOutMinimum,
        tx: { to: Constants.sushiV3RouterGnosisAddress, value: amount, data, gas },
    }
}