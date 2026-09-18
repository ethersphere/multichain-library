import { Dates, Objects, RollingValueProvider, System } from 'cafe-utility'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { gnosis } from 'viem/chains'
import { Constants } from './Constants.js'
import { GnosisBzzABI } from './GnosisBzzAbi.js'
import { getGnosisGasPrice } from './GnosisGasPrice.js'
import { getGnosisTransactionCount } from './GnosisTransactionCount.js'
import { MultichainLibrarySettings } from './Settings.js'

export interface TransferGnosisBzzOptions {
    amount: string | bigint
    originPrivateKey: `0x${string}`
    to: `0x${string}`
    nonce?: number
}

export async function transferGnosisBzz(
    options: TransferGnosisBzzOptions,
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
            const hash = await client.writeContract({
                account,
                abi: GnosisBzzABI,
                address: Constants.bzzGnosisAddress,
                functionName: 'transfer',
                args: [options.to, BigInt(options.amount)],
                gas: 100000n,
                gasPrice: (await getGnosisGasPrice(settings, jsonRpcProvider)).value,
                type: 'legacy',
                chain: gnosis,
                nonce: options.nonce ?? (await getGnosisTransactionCount(account.address, settings, jsonRpcProvider))
            })
            return hash
        } catch (error) {
            if (Objects.errorMatches(error, 'FeeTooLow')) {
                await System.sleepMillis(Dates.seconds(2))
            } else {
                throw error
            }
        }
    }
    throw Error('Failed to write contract after multiple attempts due to low fees.')
}
