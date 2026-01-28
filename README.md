# Multichain Library

This repository contains a collection of cross-environment functions that are helpful for building swap and token transfer logic.

# Getting Started

## Installation

```
npm install @upcoming/multichain-library
```

## Usage

Create an instance of the library:

```ts
const library = new MultichainLibrary(settings)
```

`settings` is optional, supporting:

-   `gnosisJsonRpc`
-   `fetchTimeoutMillis`

# Functions

## Nonce helpers

-   `getGnosisTransactionCount(address: string): Promise<number>`

## Balance getters

-   `getGnosisBzzBalance(address: string): Promise<FixedPointNumber>`
-   `getGnosisNativeBalance(address: string): Promise<FixedPointNumber>`

## Price getters

-   `getTokenPrice(tokenAddress: string, chainId: number): Promise<number>`
-   `getGnosisBzzTokenPrice(): Promise<number>`

## Waiters

-   `waitForGnosisBzzBalanceToIncrease(address: string, initialBalance: bigint): Promise<void>`
-   `waitForGnosisNativeBalanceToDecrease(address: string, initialBalance: bigint): Promise<void>`
-   `waitForGnosisNativeBalanceToIncrease(address: string, initialBalance: bigint): Promise<void>`

## SushiSwap helpers

-   `getSushiSwapQuote(amount: string, sender: string, recipient: string): Promise<SushiResponse>`
-   `swapOnGnosisCustom(options: GnosisSwapCustomOptions): Promise<string>`
-   `swapOnGnosisAuto(options: GnosisSwapAutoOptions): Promise<string>`

## Token transfer helpers

-   `transferGnosisBzz(options: GnosisBzzTransferOptions): Promise<string>`
-   `transferGnosisNative(options: GnosisNativeTransferOptions): Promise<string>`

In both cases, `options` is:

```ts
amount: string | bigint
originPrivateKey: `0x${string}`
to: `0x${string}`
nonce?: number
```

## BZZ helpers

-   `approveGnosisBzz(options: ApproveGnosisBzzOptions): Promise<string>`
