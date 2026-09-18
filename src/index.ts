import { FixedPointNumber, Objects, RollingValueProvider } from 'cafe-utility'
import { Constants } from './Constants.js'
import { approveGnosisBzz, ApproveGnosisBzzOptions } from './GnosisBzzApprove.js'
import { getGnosisBzzBalance } from './GnosisBzzBalance.js'
import { transferGnosisBzz, TransferGnosisBzzOptions } from './GnosisBzzTransfer.js'
import { getGnosisGasPrice } from './GnosisGasPrice.js'
import { getGnosisNativeBalance } from './GnosisNativeBalance.js'
import { transferGnosisNative, TransferGnosisNativeOptions } from './GnosisNativeTransfer.js'
import { createBatchGnosis, CreateBatchGnosisOptions, CreateBatchResult } from './GnosisPostageStampCreateBatch.js'
import { getStoragePriceGnosis } from './GnosisPostageStampStoragePrice.js'
import { GnosisSwapAutoOptions, GnosisSwapCustomOptions, swapOnGnosisAuto, swapOnGnosisCustom } from './GnosisSwap.js'
import {
    getGnosisTransaction,
    getGnosisTransactionReceipt,
    GnosisTransaction,
    GnosisTransactionReceipt
} from './GnosisTransaction.js'
import { getGnosisTransactionCount } from './GnosisTransactionCount.js'
import { getGnosisUsdcBalance } from './GnosisUsdcBalance.js'
import {
    multiTransferGnosisNative,
    MultiTransferGnosisNativeOptions,
    MultiTransferGnosisNativeResult
} from './MultiGnosisNativeTransfer.js'
import { getDefaultMultichainLibrarySettings, MultichainLibrarySettings } from './Settings.js'
import { ContractSwapQuote, getSushiContractQuoteXdai, getSushiSwapQuote, SushiResponse } from './SushiSwap.js'
import { getGnosisBzzTokenPrice, getTokenPrice } from './TokenPrice.js'
import {
    waitForGnosisBzzBalanceToIncrease,
    waitForGnosisNativeBalanceToDecrease,
    waitForGnosisNativeBalanceToIncrease,
    waitForGnosisTransactionReceipt,
    waitForGnosisUsdcBalanceToDecrease,
    waitForGnosisUsdcBalanceToIncrease
} from './Waiter.js'

export { MultichainLibrarySettings } from './Settings.js'
export { ContractSwapQuote, SushiResponse } from './SushiSwap.js'
export { USDC } from './USDC.js'
export { xBZZ } from './xBZZ.js'
export { xDAI } from './xDAI.js'

export class MultichainLibrary {
    settings: MultichainLibrarySettings
    jsonRpcProvider: RollingValueProvider<string>
    constants: typeof Constants = Constants

    constructor(settings?: Partial<MultichainLibrarySettings>) {
        this.settings = Objects.deepMerge2(getDefaultMultichainLibrarySettings(), settings || {})
        this.jsonRpcProvider = new RollingValueProvider(this.settings.gnosisJsonRpcProviders)
    }

    updateSettings(settings: Partial<MultichainLibrarySettings>) {
        this.settings = Objects.deepMerge2(getDefaultMultichainLibrarySettings(), settings || {})
        this.jsonRpcProvider = new RollingValueProvider(this.settings.gnosisJsonRpcProviders)
    }

    getGnosisTransaction(transactionHash: `0x${string}`): Promise<GnosisTransaction> {
        return getGnosisTransaction(transactionHash, this.settings, this.jsonRpcProvider)
    }

    getGnosisTransactionReceipt(transactionHash: `0x${string}`): Promise<GnosisTransactionReceipt> {
        return getGnosisTransactionReceipt(transactionHash, this.settings, this.jsonRpcProvider)
    }

    getGnosisBzzBalance(address: string): Promise<FixedPointNumber> {
        return getGnosisBzzBalance(address, this.settings, this.jsonRpcProvider)
    }

    getGnosisNativeBalance(address: `0x${string}`): Promise<FixedPointNumber> {
        return getGnosisNativeBalance(address, this.settings, this.jsonRpcProvider)
    }

    getGnosisUsdcBalance(address: `0x${string}`): Promise<FixedPointNumber> {
        return getGnosisUsdcBalance(address, this.settings, this.jsonRpcProvider)
    }

    getTokenPrice(tokenAddress: `0x${string}`, chainId: number): Promise<number> {
        return getTokenPrice(tokenAddress, chainId, this.settings)
    }

    getGnosisBzzTokenPrice(): Promise<number> {
        return getGnosisBzzTokenPrice(this.settings)
    }

    transferGnosisNative(options: TransferGnosisNativeOptions): Promise<`0x${string}`> {
        return transferGnosisNative(options, this.settings, this.jsonRpcProvider)
    }

    multiTransferGnosisNative(options: MultiTransferGnosisNativeOptions): Promise<MultiTransferGnosisNativeResult> {
        return multiTransferGnosisNative(options, this.settings, this.jsonRpcProvider)
    }

    transferGnosisBzz(options: TransferGnosisBzzOptions): Promise<`0x${string}`> {
        return transferGnosisBzz(options, this.settings, this.jsonRpcProvider)
    }

    approveGnosisBzz(options: ApproveGnosisBzzOptions): Promise<`0x${string}`> {
        return approveGnosisBzz(options, this.settings, this.jsonRpcProvider)
    }

    createBatchGnosis(options: CreateBatchGnosisOptions): Promise<CreateBatchResult> {
        return createBatchGnosis(options, this.settings, this.jsonRpcProvider)
    }

    getStoragePriceGnosis(): Promise<bigint> {
        return getStoragePriceGnosis(this.settings, this.jsonRpcProvider)
    }

    getGnosisGasPrice(): Promise<FixedPointNumber> {
        return getGnosisGasPrice(this.settings, this.jsonRpcProvider)
    }

    waitForGnosisBzzBalanceToIncrease(address: string, initialBalance: bigint): Promise<void> {
        return waitForGnosisBzzBalanceToIncrease(address, initialBalance, this.settings, this.jsonRpcProvider)
    }

    waitForGnosisNativeBalanceToDecrease(address: `0x${string}`, initialBalance: bigint): Promise<void> {
        return waitForGnosisNativeBalanceToDecrease(address, initialBalance, this.settings, this.jsonRpcProvider)
    }

    waitForGnosisNativeBalanceToIncrease(address: `0x${string}`, initialBalance: bigint): Promise<void> {
        return waitForGnosisNativeBalanceToIncrease(address, initialBalance, this.settings, this.jsonRpcProvider)
    }

    waitForGnosisUsdcBalanceToDecrease(address: `0x${string}`, initialBalance: bigint): Promise<void> {
        return waitForGnosisUsdcBalanceToDecrease(address, initialBalance, this.settings, this.jsonRpcProvider)
    }

    waitForGnosisUsdcBalanceToIncrease(address: `0x${string}`, initialBalance: bigint): Promise<void> {
        return waitForGnosisUsdcBalanceToIncrease(address, initialBalance, this.settings, this.jsonRpcProvider)
    }

    waitForGnosisTransactionReceipt(txHash: `0x${string}`): Promise<void> {
        return waitForGnosisTransactionReceipt(txHash, this.settings, this.jsonRpcProvider)
    }

    swapOnGnosisAuto(options: GnosisSwapAutoOptions): Promise<`0x${string}`> {
        return swapOnGnosisAuto(options, this.settings, this.jsonRpcProvider)
    }

    swapOnGnosisCustom(options: GnosisSwapCustomOptions): Promise<`0x${string}`> {
        return swapOnGnosisCustom(options, this.settings, this.jsonRpcProvider)
    }

    getGnosisTransactionCount(address: `0x${string}`): Promise<number> {
        return getGnosisTransactionCount(address, this.settings, this.jsonRpcProvider)
    }

    getSushiSwapQuote(
        inputToken: 'xDAI' | 'USDC',
        amount: string,
        sender: string,
        recipient: string
    ): Promise<SushiResponse> {
        return getSushiSwapQuote(inputToken, amount, sender, recipient, this.settings)
    }

    getSushiContractQuoteXdai(
        amount: bigint,
        sender: `0x${string}`,
        recipient: `0x${string}`
    ): Promise<ContractSwapQuote> {
        return getSushiContractQuoteXdai(amount, sender, recipient, this.jsonRpcProvider.current())
    }
}
