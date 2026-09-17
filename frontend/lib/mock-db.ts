/**
 * Mock Database Facade V2
 */
export { users, getNextSequentialUserId } from "@/lib/db/users"
export { transactions, generateTransactionId } from "@/lib/db/transactions"
export type { Wallet, User, Transaction } from "@/lib/db/types"
