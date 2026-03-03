import { Dates, Objects, RollingValueProvider, System } from 'cafe-utility'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { gnosis } from 'viem/chains'
import { Constants } from './Constants'
import { getGnosisGasPrice } from './GnosisGasPrice'
import { getGnosisTransactionCount } from './GnosisTransactionCount'
import { MultichainLibrarySettings } from './Settings'

export interface TransferGnosisNativeOptions {
    amount: string | bigint
    originPrivateKey: `0x${string}`
    to: `0x${string}`
    nonce?: number
}

export async function transferGnosisNative(
    options: TransferGnosisNativeOptions,
    settings: MultichainLibrarySettings,
    jsonRpcProvider: RollingValueProvider<string>
): Promise<`0x${string}`> {
    const account = privateKeyToAccount(options.originPrivateKey)
    const client = createWalletClient({
        chain: gnosis,
        transport: http(jsonRpcProvider.current())
    })
    for (let i = 0; i < 4; i++) {
        try {
            const serializedTransaction = await account.signTransaction({
                chain: Constants.gnosisChainId,
                chainId: Constants.gnosisChainId,
                account: account.address,
                gas: 21000n,
                gasPrice: (await getGnosisGasPrice(settings, jsonRpcProvider)).value,
                type: 'legacy',
                to: options.to,
                value: BigInt(options.amount),
                nonce: options.nonce ?? (await getGnosisTransactionCount(account.address, settings, jsonRpcProvider))
            })
            const hash = await client.sendRawTransaction({ serializedTransaction })
            return hash
        } catch (error) {
            if (Objects.errorMatches(error, 'FeeTooLow')) {
                await System.sleepMillis(Dates.seconds(2))
            } else {
                throw error
            }
        }
    }
    throw Error('Failed to send transaction after multiple attempts due to low fees.')
}
