import { RollingValueProvider } from 'cafe-utility'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { gnosis } from 'viem/chains'
import { Constants } from './Constants'
import { getGnosisTransactionCount } from './GnosisTransactionCount'
import { MultichainLibrarySettings } from './Settings'
import { getSushiSwapQuote } from './SushiSwap'

export interface GnosisSwapAutoOptions {
    amount: string | bigint
    originPrivateKey: `0x${string}`
    to: `0x${string}`
}

export async function swapOnGnosisAuto(
    options: GnosisSwapAutoOptions,
    settings: MultichainLibrarySettings,
    jsonRpcProvider: RollingValueProvider<string>
) {
    const account = privateKeyToAccount(options.originPrivateKey)
    const quote = await getSushiSwapQuote(options.amount.toString(), account.address, options.to, settings)
    return swapOnGnosisCustom(
        {
            originPrivateKey: options.originPrivateKey,
            gas: (BigInt(quote.tx.gas) * 5n) / 4n, // add 25% buffer
            gasPrice: BigInt(quote.tx.gasPrice),
            to: quote.tx.to,
            value: BigInt(quote.tx.value),
            data: quote.tx.data
        },
        settings,
        jsonRpcProvider
    )
}

export interface GnosisSwapCustomOptions {
    originPrivateKey: `0x${string}`
    gas: bigint | string | number
    gasPrice: bigint | string | number
    to: `0x${string}`
    value: bigint | string | number
    data: `0x${string}`
}

export async function swapOnGnosisCustom(
    options: GnosisSwapCustomOptions,
    settings: MultichainLibrarySettings,
    jsonRpcProvider: RollingValueProvider<string>
) {
    const account = privateKeyToAccount(options.originPrivateKey)
    const client = createWalletClient({ chain: gnosis, transport: http(jsonRpcProvider.current()) })
    return account
        .signTransaction({
            chain: Constants.gnosisChainId,
            chainId: Constants.gnosisChainId,
            account: account.address,
            gas: (BigInt(options.gas) * 5n) / 4n, // add 25% buffer
            gasPrice: BigInt(options.gasPrice),
            type: 'legacy',
            to: options.to,
            value: BigInt(options.value),
            data: options.data,
            nonce: await getGnosisTransactionCount(account.address, settings, jsonRpcProvider)
        })
        .then(signedTx => client.sendRawTransaction({ serializedTransaction: signedTx }))
}
