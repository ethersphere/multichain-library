import { RollingValueProvider } from 'cafe-utility'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { gnosis } from 'viem/chains'
import { Constants } from './Constants'
import { getGnosisTransactionCount } from './GnosisTransactionCount'
import { MultichainLibrarySettings } from './Settings'
import { getSushiContractQuoteXdai } from './SushiSwap'
import {getGnosisGasPrice} from './GnosisGasPrice'

export interface GnosisSwapAutoOptions {
    inputToken: 'xDAI' | 'USDC'
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
    if (options.inputToken === 'USDC') {
        throw Error('USDC swaps not yet migrated to direct contract calls')
    }

    const quote = await getSushiContractQuoteXdai(
        BigInt(options.amount),
        account.address,
        options.to,
        jsonRpcProvider.current()
    )

    const gasPrice = await getGnosisGasPrice(settings, jsonRpcProvider)

    return swapOnGnosisCustom(
        {
            originPrivateKey: options.originPrivateKey,
            gas: quote.tx.gas,           // buffer removed here — swapOnGnosisCustom already adds 25%
            gasPrice: gasPrice.value,          // ← see note below
            to: quote.tx.to,
            value: quote.tx.value,
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
