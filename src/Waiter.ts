import { Dates, RollingValueProvider, System } from 'cafe-utility'
import { getGnosisBzzBalance } from './GnosisBzzBalance'
import { getGnosisNativeBalance } from './GnosisNativeBalance'
import { getGnosisTransactionReceipt } from './GnosisTransaction'
import { MultichainLibrarySettings } from './Settings'

export async function waitForGnosisTransactionReceipt(
    transactionHash: `0x${string}`,
    settings: MultichainLibrarySettings,
    jsonRpcProvider: RollingValueProvider<string>
): Promise<void> {
    await System.waitFor(
        async () => {
            const result = await getGnosisTransactionReceipt(transactionHash, settings, jsonRpcProvider)
            const status = parseInt(result.status)
            if (status === 0) {
                console.log('Transaction receipt indicates possible failure:', result)
            }
            return status === 1
        },
        { attempts: 10, waitMillis: Dates.seconds(10) }
    )
}

export async function waitForGnosisBzzBalanceToIncrease(
    address: string,
    initialBalance: bigint,
    settings: MultichainLibrarySettings,
    jsonRpcProvider: RollingValueProvider<string>
): Promise<void> {
    await System.waitFor(
        async () => {
            try {
                const balance = await getGnosisBzzBalance(address, settings, jsonRpcProvider)
                return balance.value > initialBalance
            } catch (error) {
                console.error(`Error fetching ${address} wallet BZZ balance:`, error)
                return false
            }
        },
        { attempts: 20, waitMillis: Dates.seconds(15) }
    )
}

export async function waitForGnosisNativeBalanceToDecrease(
    address: `0x${string}`,
    initialBalance: bigint,
    settings: MultichainLibrarySettings,
    jsonRpcProvider: RollingValueProvider<string>
): Promise<void> {
    await System.waitFor(
        async () => {
            try {
                const balance = await getGnosisNativeBalance(address, settings, jsonRpcProvider)
                return balance.value < initialBalance
            } catch (error) {
                console.error(`Error fetching ${address} wallet native balance:`, error)
                return false
            }
        },
        { attempts: 20, waitMillis: Dates.seconds(15) }
    )
}

export async function waitForGnosisNativeBalanceToIncrease(
    address: `0x${string}`,
    initialBalance: bigint,
    settings: MultichainLibrarySettings,
    jsonRpcProvider: RollingValueProvider<string>
): Promise<void> {
    await System.waitFor(
        async () => {
            try {
                const balance = await getGnosisNativeBalance(address, settings, jsonRpcProvider)
                return balance.value > initialBalance
            } catch (error) {
                console.error(`Error fetching ${address} wallet native balance:`, error)
                return false
            }
        },
        { attempts: 20, waitMillis: Dates.seconds(15) }
    )
}
