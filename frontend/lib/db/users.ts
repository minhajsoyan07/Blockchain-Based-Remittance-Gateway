import { User } from "./types"
import { StorageAdapter } from "./adapter"
import { transactions } from "./transactions" // Circular dependency note: handled by loose coupling or careful imports

const USER_ID_PREFIX = "RPAY"
const USER_ID_PAD_LENGTH = 3
const USER_ID_REGEX = /^RPAY(\d{3})$/

const defaultUsers: Record<string, User> = {}

const adapter = new StorageAdapter<Record<string, User>>("users.json", "remittance_users", defaultUsers)

const formatSequentialUserId = (value: number) =>
    `${USER_ID_PREFIX}${value.toString().padStart(USER_ID_PAD_LENGTH, "0")}`

const extractSequentialUserId = (id: string): number | null => {
    const match = USER_ID_REGEX.exec(id)
    return match ? Number.parseInt(match[1], 10) : null
}

const normalizeUserRecords = (records: Record<string, User>) => {
    let updated = false
    const normalized: Record<string, User> = {}
    const idMapping = new Map<string, string>()

    let currentMax = Object.values(records).reduce((max, user) => {
        const sequence = extractSequentialUserId(user.id)
        return sequence !== null && sequence > max ? sequence : max
    }, 0)

    for (const [key, user] of Object.entries(records)) {
        let targetId = user.id
        const existingSequence = extractSequentialUserId(targetId)

        if (existingSequence === null) {
            currentMax += 1
            targetId = formatSequentialUserId(currentMax)
            idMapping.set(user.id, targetId)
        } else {
            currentMax = Math.max(currentMax, existingSequence)
        }

        if (key !== targetId || user.id !== targetId) {
            updated = true
        }

        normalized[targetId] = { ...user, id: targetId }
    }

    return { normalized, idMapping, updated }
}

export const getUsers = (): Record<string, User> => {
    const rawUsers = adapter.read()

    // Normalize and clean data
    const { normalized, idMapping, updated } = normalizeUserRecords(rawUsers)

    // Safety: remove any blacklisted wallet addresses
    const BLACKLISTED_ADDRESSES = [
        '0x88667894ab98adb121505531e0aef71a3b889fd0',
    ].map(a => a.toLowerCase())

    let removed = false
    for (const [uid, u] of Object.entries(normalized)) {
        if (u && typeof u === 'object' && u.walletAddress) {
            const wa = String(u.walletAddress).toLowerCase()
            if (BLACKLISTED_ADDRESSES.includes(wa)) {
                delete (normalized as any)[uid].walletAddress
                removed = true
            }
        }
    }

    if (updated || removed) {
        adapter.write(normalized)
        // We need to update transactions if IDs changed. 
        // Since we can't easily import transactions.save here without circular deps,
        // we'll rely on the transactions module to handle its own integrity or expose a specific method.
        // For now, we'll assume the transaction ID mapping logic needs to be moved or shared.
        // In the original code, it called applyUserIdMappingToTransactions.
        // We will re-implement that logic here by importing the transaction updater.
        import("./transactions").then(mod => {
            mod.applyUserIdMappingToTransactions(idMapping)
        })
    }

    return normalized
}

export const saveUsers = (users: Record<string, User>) => {
    adapter.write(users)
}

export const getNextSequentialUserId = (records: Record<string, User>) => {
    const maxSequence = Object.values(records).reduce((max, user) => {
        const sequence = extractSequentialUserId(user.id)
        return sequence !== null && sequence > max ? sequence : max
    }, 0)

    return formatSequentialUserId(maxSequence + 1)
}

export const users = {
    get: getUsers,
    save: saveUsers,
}
