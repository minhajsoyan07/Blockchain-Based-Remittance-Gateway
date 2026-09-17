import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"

export class StorageAdapter<T> {
    private filePath: string
    private storageKey: string
    private defaultValue: T

    constructor(fileName: string, storageKey: string, defaultValue: T) {
        this.filePath = join(process.cwd(), "data", fileName)
        this.storageKey = storageKey
        this.defaultValue = defaultValue
    }

    private ensureDataDir() {
        const dataDir = join(process.cwd(), "data")
        if (!existsSync(dataDir)) {
            mkdirSync(dataDir, { recursive: true })
        }
    }

    read(): T {
        if (typeof window === "undefined") {
            // Server-side
            this.ensureDataDir()
            if (!existsSync(this.filePath)) {
                this.write(this.defaultValue)
                return this.defaultValue
            }

            try {
                const data = readFileSync(this.filePath, "utf-8")
                if (!data || data.trim().length === 0) {
                    this.write(this.defaultValue)
                    return this.defaultValue
                }
                return JSON.parse(data)
            } catch (error) {
                console.error(`Error reading ${this.filePath}:`, error)
                return this.defaultValue
            }
        } else {
            // Client-side
            try {
                const stored = localStorage.getItem(this.storageKey)
                if (!stored) {
                    localStorage.setItem(this.storageKey, JSON.stringify(this.defaultValue))
                    return this.defaultValue
                }
                return JSON.parse(stored)
            } catch (error) {
                console.error(`Error reading from localStorage (${this.storageKey}):`, error)
                return this.defaultValue
            }
        }
    }

    write(data: T): void {
        if (typeof window === "undefined") {
            // Server-side
            this.ensureDataDir()
            try {
                writeFileSync(this.filePath, JSON.stringify(data, null, 2))
            } catch (error) {
                console.error(`Error writing ${this.filePath}:`, error)
                throw error
            }
        } else {
            // Client-side
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(data))
            } catch (error) {
                console.error(`Error writing to localStorage (${this.storageKey}):`, error)
                throw error
            }
        }
    }
}
