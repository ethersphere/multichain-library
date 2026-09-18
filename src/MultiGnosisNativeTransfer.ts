import { RollingValueProvider } from 'cafe-utility'
import { privateKeyToAccount } from 'viem/accounts'
import { transferGnosisNative } from './GnosisNativeTransfer.js'
import { getGnosisTransactionCount } from './GnosisTransactionCount.js'
import { MultichainLibrarySettings } from './Settings.js'

export interface MultiTransferGnosisNativeOptions {
    amount: string | bigint
    originPrivateKey: `0x${string}`
    to: `0x${string}`[]
    nonce?: number
}

export interface AddressfulTransaction {
    address: `0x${string}`
    transaction: `0x${string}`
}

export interface AddressfulError {
    address: `0x${string}`
    error: Error
}

export interface MultiTransferGnosisNativeResult {
    transactions: AddressfulTransaction[]
    errors: AddressfulError[]
}

export async function multiTransferGnosisNative(
    options: MultiTransferGnosisNativeOptions,
    settings: MultichainLibrarySettings,
    jsonRpcProvider: RollingValueProvider<string>
): Promise<MultiTransferGnosisNativeResult> {
    const account = privateKeyToAccount(options.originPrivateKey)
    const transactions: AddressfulTransaction[] = []
    const errors: AddressfulError[] = []
    let nonce = options.nonce ?? (await getGnosisTransactionCount(account.address, settings, jsonRpcProvider))
    for (const address of options.to) {
        try {
            const transaction = await transferGnosisNative(
                {
                    amount: options.amount,
                    originPrivateKey: options.originPrivateKey,
                    to: address,
                    nonce: nonce++
                },
                settings,
                jsonRpcProvider
            )
            transactions.push({ address, transaction })
        } catch (error) {
            errors.push({ address, error: error as Error })
        }
    }
    return { transactions, errors }
}
