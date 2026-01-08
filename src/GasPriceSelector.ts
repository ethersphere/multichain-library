import { Numbers } from 'cafe-utility'

export function selectGasPrice(attempt: number): bigint {
    const gasPrices = ['0.1 gwei', '1 gwei', '2 gwei', '5 gwei', '10 gwei']
    if (attempt < 0 || attempt >= gasPrices.length - 1) {
        throw Error('Attempt number out of range for gas price selection.')
    }
    return BigInt(Numbers.make(gasPrices[attempt]))
}
