export const GnosisPostageStampABI = [
    {
        inputs: [
            {
                internalType: 'address',
                name: '_owner',
                type: 'address'
            },
            {
                internalType: 'uint256',
                name: '_initialBalancePerChunk',
                type: 'uint256'
            },
            {
                internalType: 'uint8',
                name: '_depth',
                type: 'uint8'
            },
            {
                internalType: 'uint8',
                name: '_bucketDepth',
                type: 'uint8'
            },
            {
                internalType: 'bytes32',
                name: '_nonce',
                type: 'bytes32'
            },
            {
                internalType: 'bool',
                name: '_immutable',
                type: 'bool'
            }
        ],
        name: 'createBatch',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    }
]
