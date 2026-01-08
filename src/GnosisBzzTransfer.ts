import { Dates, Objects, RollingValueProvider, System } from 'cafe-utility'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { gnosis } from 'viem/chains'
import { Constants } from './Constants'
import { selectGasPrice } from './GasPriceSelector'
import { GnosisBzzABI } from './GnosisBzzAbi'
import { getGnosisTransactionCount } from './GnosisTransactionCount'
import { MultichainLibrarySettings } from './Settings'

export interface TransferGnosisBzzOptions {
    amount: string | bigint
    originPrivateKey: `0x${string}`
    originAddress: `0x${string}`
    to: `0x${string}`
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
                gasPrice: selectGasPrice(i),
                type: 'legacy',
                chain: gnosis,
                nonce: await getGnosisTransactionCount(options.originAddress, settings, jsonRpcProvider)
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
