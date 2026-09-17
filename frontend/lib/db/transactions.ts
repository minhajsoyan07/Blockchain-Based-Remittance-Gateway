import { Transaction } from "./types"
import { StorageAdapter } from "./adapter"

const TRANSACTION_ID_PREFIX = "TX11RPAY"
const TRANSACTION_SEQUENCE_REGEX = /^TX11RPAY(\d{2})$/

const defaultTransactions: Transaction[] = []

const adapter = new StorageAdapter<Transaction[]>("transactions.json", "remittance_transactions", defaultTransactions)

let transactionSequence = 0

const extractTransactionSequence = (id: string): number | null => {
    const match = TRANSACTION_SEQUENCE_REGEX.exec(id)
    return match ? Number.parseInt(match[1], 10) : null
}

const refreshTransactionSequence = (list: Transaction[]) => {
    const maxSequence = list.reduce((max, tx) => {
        const value = extractTransactionSequence(tx.id)
        return value !== null && value > max ? value : max
    }, 0)
    transactionSequence = Math.max(transactionSequence, maxSequence)
}

export const getTransactions = (): Transaction[] => {
    const list = adapter.read()
    if (!Array.isArray(list)) {
        // Recovery if data is corrupted
        adapter.write(defaultTransactions)
        refreshTransactionSequence(defaultTransactions)
        return defaultTransactions
    }
    refreshTransactionSequence(list)
    return list
}

export const saveTransactions = (transactions: Transaction[]) => {
    adapter.write(transactions)
    refreshTransactionSequence(transactions)
}

export const generateTransactionId = () => {
    transactionSequence += 1
    return `${TRANSACTION_ID_PREFIX}${transactionSequence.toString().padStart(2, "0")}`
}

export const seedTransactionsForUser = (userId: string) => {
    const currentTransactions = getTransactions()

    // Check if user already has transactions
    if (currentTransactions.some((tx) => tx.fromUserId === userId)) {
        return
    }

    // Create sample transactions for the new user
    const sampleTransactions: Transaction[] = [
        {
            id: generateTransactionId(),
            fromUserId: userId,
            toAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
            amount: 0.5,
            gasFee: 0.01,
            currency: "ETH",
            description: "Payment to John",
            status: "completed",
            timestamp: Date.now() - 86400000,
            txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            executionTime: 4.2,
        },
        {
            id: generateTransactionId(),
            fromUserId: userId,
            toAddress: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
            amount: 0.25,
            gasFee: 0.005,
            currency: "ETH",
            description: "Payment to Sarah",
            status: "completed",
            timestamp: Date.now() - 172800000,
            txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            executionTime: 3.6,
        },
    ]

    saveTransactions([...currentTransactions, ...sampleTransactions])
}

export const applyUserIdMappingToTransactions = (mapping: Map<string, string>) => {
    if (mapping.size === 0) return

    const currentTransactions = getTransactions()
    let changed = false
    const updatedTransactions = currentTransactions.map((tx) => {
        const replacement = mapping.get(tx.fromUserId)
        if (replacement) {
            changed = true
            return { ...tx, fromUserId: replacement }
        }
        return tx
    })

    if (changed) {
        saveTransactions(updatedTransactions)
    }
}

// Initialize sequence
try {
    refreshTransactionSequence(getTransactions())
} catch (e) {
    console.error("Failed to init transaction sequence", e)
}

export const transactions = {
    get: getTransactions,
    save: saveTransactions,
    seedForUser: seedTransactionsForUser,
}
