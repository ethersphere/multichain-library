import { FixedPointNumber } from 'cafe-utility'

export class xDAI extends FixedPointNumber {
    static DECIMALS = 18

    static fromDecimalString(decimalString: string): FixedPointNumber {
        return FixedPointNumber.fromDecimalString(decimalString, xDAI.DECIMALS)
    }

    static fromFloat(value: number): FixedPointNumber {
        return FixedPointNumber.fromFloat(value, xDAI.DECIMALS)
    }

    constructor(value: bigint | number | string) {
        super(value, xDAI.DECIMALS)
    }
}
