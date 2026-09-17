export interface Wallet {
    id: string
    name: string
    address: string
    network: string
    chainId: number
    status: 'active' | 'inactive'
    connectedAt: number
    lastActiveAt: number
    deviceId?: string
}

export interface User {
    id: string
    email: string
    fullName: string
    username: string
    password: string
    walletAddress?: string
    nid?: string
    phone?: string
    address?: string
    dateOfBirth?: string
    profilePhoto?: string
    isVerified?: boolean
    balances: {
        USD: number
        BDT: number
        BTC: number
        ETH: number
        USDT: number
        EUR: number
        GBP: number
    }
    realEthBalance?: number
    walletSecurityPassword?: string
    wallets: Wallet[]
}

export interface Transaction {
    id: string
    fromUserId: string
    toAddress: string
    amount: number
    gasFee: number
    currency: string
    description: string
    status: "pending" | "completed" | "failed"
    timestamp: number
    txHash: string
    executionTime?: number
    metadata?: {
        details?: string
        [key: string]: unknown
    }
}
