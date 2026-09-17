"use client"

import { memo } from "react"
import { TransactionBlock } from "@/components/transaction-block"
import type { ExchangeRates } from "@/lib/currency-utils"

interface Transaction {
    id: string
    fromUserId: string
    fromAddress?: string
    toAddress: string
    amount: number
    gasFee: number
    currency: string
    status: "pending" | "completed" | "failed"
    timestamp: number
    txHash?: string
    description?: string
    executionTime?: number
    type?: string
    recipient?: string
    metadata?: {
        details?: string
        [key: string]: unknown
    }
}

interface UserInfo {
    id: string
    fullName: string
    email: string
}

interface TransactionListProps {
    transactions: Transaction[]
    userInfoMap: Record<string, UserInfo>
    rates: ExchangeRates
    currentUserAddress?: string
}

function TransactionListComponent({ transactions, userInfoMap, rates, currentUserAddress }: TransactionListProps) {
    return (
        <div className="space-y-4">
            {transactions.map((tx, index) => {
                const senderInfo = userInfoMap[tx.fromUserId]
                return (
                    <TransactionBlock
                        key={tx.id}
                        serialNumber={index + 1}
                        id={tx.id}
                        txHash={tx.txHash || ""}
                        fromUserId={tx.fromUserId}
                        fromAddress={tx.fromAddress}
                        toAddress={tx.toAddress}
                        amount={tx.amount}
                        gasFee={tx.gasFee}
                        currency={tx.currency}
                        status={tx.status}
                        timestamp={tx.timestamp}
                        executionTime={tx.executionTime}
                        rates={rates}
                        senderName={senderInfo?.fullName}
                        senderEmail={senderInfo?.email}
                        description={tx.description}
                        currentUserAddress={currentUserAddress}
                    />
                )
            })}
        </div>
    )
}

export const TransactionList = memo(TransactionListComponent)
