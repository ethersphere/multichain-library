import { Dates, Objects, RollingValueProvider, System, Types } from 'cafe-utility'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { gnosis } from 'viem/chains'
import { Constants } from './Constants'
import { durableFetch } from './Fetch'
import { selectGasPrice } from './GasPriceSelector'
import { GnosisPostageStampABI } from './GnosisPostageStampAbi'
import { getGnosisTransactionCount } from './GnosisTransactionCount'
import { MultichainLibrarySettings } from './Settings'

export interface CreateBatchGnosisOptions {
    originPrivateKey: `0x${string}`
    owner: `0x${string}`
    depth: number
    amount: string | bigint
    bucketDepth: 16
    batchNonce: string
    immutable: boolean
    nonce?: number
}

export interface CreateBatchResult {
    transactionHash: `0x${string}`
    batchId: `0x${string}`
}

export async function createBatchGnosis(
    options: CreateBatchGnosisOptions,
    settings: MultichainLibrarySettings,
    jsonRpcProvider: RollingValueProvider<string>
): Promise<CreateBatchResult> {
    const account = privateKeyToAccount(options.originPrivateKey)
    const client = createWalletClient({
        chain: gnosis,
        transport: http(jsonRpcProvider.current())
    })
    for (let i = 0; i < 4; i++) {
        try {
            const transactionHash = await client.writeContract({
                account,
                abi: GnosisPostageStampABI,
                address: Constants.postageStampGnosisAddress,
                functionName: 'createBatch',
                args: [
                    options.owner,
                    BigInt(options.amount),
                    options.depth,
                    options.bucketDepth,
                    options.batchNonce,
                    options.immutable
                ],
                gas: 1000000n,
                gasPrice: selectGasPrice(i),
                type: 'legacy',
                chain: gnosis,
                nonce: options.nonce ?? (await getGnosisTransactionCount(account.address, settings, jsonRpcProvider))
            })
            const payload = { jsonrpc: '2.0', id: 1, method: 'eth_getTransactionReceipt', params: [transactionHash] }
            for (let j = 0; j < 4; j++) {
                try {
                    await System.sleepMillis(Dates.seconds(5))
                    const response = await durableFetch(jsonRpcProvider, settings, 'POST', payload)
                    const data = await response.json()
                    const object = Types.asObject(data)
                    if (object.result !== null) {
                        const result = Types.asObject(object.result)
                        const logs = Types.asArray(result.logs).map(x => Types.asObject(x))
                        const event = logs.find(
                            x =>
                                Types.asString(x.address).toLowerCase() ===
                                Constants.postageStampGnosisAddress.toLowerCase()
                        )
                        if (event) {
                            const topics = Types.asArray(event.topics)
                            if (topics[1]) {
                                return {
                                    transactionHash,
                                    batchId: Types.asHexString(topics[1])
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error(error)
                }
            }
            throw Error('Failed to fetch transaction receipt after multiple attempts.')
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
