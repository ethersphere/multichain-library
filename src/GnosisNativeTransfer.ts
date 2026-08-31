import { Dates, Objects, RollingValueProvider, System } from 'cafe-utility'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { gnosis } from 'viem/chains'
import { Constants } from './Constants'
import { estimateGnosisGas } from './GnosisGasEstimate'
import { getGnosisGasPrice } from './GnosisGasPrice'
import { getGnosisTransactionCount } from './GnosisTransactionCount'
import { MultichainLibrarySettings } from './Settings'

// A value transfer only costs the intrinsic 21000 gas when the recipient is a plain
// EOA. Contract wallets and EIP-7702 delegated EOAs run code on receive, so the gas
// has to be estimated instead of assumed.
const intrinsicTransferGas = 21_000n
const fallbackTransferGas = 100_000n

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
    const gas = await getTransferGas(account.address, options, settings, jsonRpcProvider)
    for (let i = 0; i < 4; i++) {
        try {
            const serializedTransaction = await account.signTransaction({
                chain: Constants.gnosisChainId,
                chainId: Constants.gnosisChainId,
                account: account.address,
                gas,
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

async function getTransferGas(
    from: `0x${string}`,
    options: TransferGnosisNativeOptions,
    settings: MultichainLibrarySettings,
    jsonRpcProvider: RollingValueProvider<string>
): Promise<bigint> {
    try {
        const estimate = await estimateGnosisGas(
            { from, to: options.to, value: BigInt(options.amount) },
            settings,
            jsonRpcProvider
        )
        // 25% buffer, matching the swap step, so that a recipient whose receive
        // function reads changing state does not end up just short.
        const buffered = (estimate * 5n) / 4n
        return buffered > intrinsicTransferGas ? buffered : intrinsicTransferGas
    } catch (error) {
        console.error('Failed to estimate gas for native transfer, falling back to a generous limit:', error)
        return fallbackTransferGas
    }
}
