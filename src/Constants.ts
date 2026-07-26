import { FixedPointNumber } from 'cafe-utility'

export const Constants = {
    nullAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    bzzGnosisAddress: '0xdbf3ea6f5bee45c02255b2c26a16f300502f68da' as `0x${string}`,
    postageStampGnosisAddress: '0x45a1502382541Cd610CC9068e88727426b696293' as `0x${string}`,
    usdcGnosisAddress: '0x2a22f9c3b484c3629090feed35f17ff8f88f76f0' as `0x${string}`,
    sushiSwapGnosisDaiAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as `0x${string}`,
    wxdaiGnosisAddress: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d' as `0x${string}`,
    sushiV3QuoterGnosisAddress: '0xb1E835Dc2785b52265711e17fCCb0fd018226a6e' as `0x${string}`,
    sushiV3RouterGnosisAddress: '0x4F54dd2F4f30347d841b7783aD08c050d8410a9d' as `0x${string}`,
    sushiV3BzzPoolFee: 3000,
    ethereumChainId: 1,
    gnosisChainId: 100,
    daiDustAmount: FixedPointNumber.fromDecimalString('0.01', 18)
}
