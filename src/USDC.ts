import { FixedPointNumber } from 'cafe-utility'

export class USDC extends FixedPointNumber {
    static DECIMALS = 6

    static fromDecimalString(decimalString: string): FixedPointNumber {
        return FixedPointNumber.fromDecimalString(decimalString, USDC.DECIMALS)
    }

    static fromFloat(value: number): FixedPointNumber {
        return FixedPointNumber.fromFloat(value, USDC.DECIMALS)
    }

    constructor(value: bigint | number | string) {
        super(value, USDC.DECIMALS)
    }
}
