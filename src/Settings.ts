import { Dates } from 'cafe-utility'

export interface MultichainLibrarySettings {
    gnosisJsonRpcProviders: string[]
    fetchTimeoutMillis: number
}

export function getDefaultMultichainLibrarySettings() {
    return {
        gnosisJsonRpcProviders: ['https://rpc.gnosischain.com', 'https://xdai.fairdatasociety.org'],
        fetchTimeoutMillis: Dates.seconds(15)
    }
}
