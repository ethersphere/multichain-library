import { FixedPointNumber } from 'cafe-utility'

export class xBZZ extends FixedPointNumber {
    static DECIMALS = 16

    static fromDecimalString(decimalString: string): FixedPointNumber {
        return FixedPointNumber.fromDecimalString(decimalString, xBZZ.DECIMALS)
    }

    static fromFloat(value: number): FixedPointNumber {
        return FixedPointNumber.fromFloat(value, xBZZ.DECIMALS)
    }

    constructor(value: bigint | number | string) {
        super(value, xBZZ.DECIMALS)
    }
}
