"use client"

import { useState, useEffect } from "react"
import { getRawEthereumProvider } from "@/lib/metamask-utils"
import { ethers } from "ethers"

export function DebugWallet() {
    const [debugInfo, setDebugInfo] = useState<any>({})
    const [error, setError] = useState<string>("")
    const [visible, setVisible] = useState(true)

    const checkWallet = async () => {
        try {
            const info: any = {
                timestamp: new Date().toISOString(),
                windowEthereum: typeof (window as any).ethereum !== "undefined",
                isMetaMask: (window as any).ethereum?.isMetaMask,
                providersLength: (window as any).ethereum?.providers?.length || 0,
                chainId: null,
                selectedAddress: null,
                balance: null,
                rawBalance: null
            }

            if (typeof window !== "undefined") {
                const rawProvider = getRawEthereumProvider()
                info.rawProviderFound = !!rawProvider

                if (rawProvider) {
                    try {
                        info.chainId = await rawProvider.request({ method: 'eth_chainId' })
                        const accounts = await rawProvider.request({ method: 'eth_accounts' })
                        info.selectedAddress = accounts[0] || "None"

                        if (accounts[0]) {
                            try {
                                const rawBal = await rawProvider.request({
                                    method: 'eth_getBalance',
                                    params: [accounts[0], "latest"]
                                })
                                info.rawBalance = rawBal
                                info.balance = ethers.formatEther(rawBal)
                            } catch (balErr: any) {
                                info.balanceError = balErr.message
                            }
                        }
                    } catch (reqErr: any) {
                        info.requestError = reqErr.message
                    }
                }
            }
            setDebugInfo(info)
        } catch (err: any) {
            setError(err.message)
        }
    }

    useEffect(() => {
        checkWallet()
        const interval = setInterval(checkWallet, 2000)
        return () => clearInterval(interval)
    }, [])

    if (!visible) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-black/90 text-green-400 font-mono text-xs rounded-lg shadow-xl border border-green-800 max-w-md overflow-auto max-h-96">
            <div className="flex justify-between items-center mb-2 border-b border-green-800 pb-1">
                <h3 className="font-bold">Wallet Debugger</h3>
                <button onClick={() => setVisible(false)} className="text-red-500 font-bold px-2">X</button>
            </div>

            {error && <div className="text-red-500 mb-2">Global Error: {error}</div>}

            <div className="space-y-1">
                <div>Window.Ethereum: {debugInfo.windowEthereum ? "YES" : "NO"}</div>
                <div>IsMetaMask: {String(debugInfo.isMetaMask)}</div>
                <div>Providers Array: {debugInfo.providersLength}</div>
                <div>Raw Provider Found: {String(debugInfo.rawProviderFound)}</div>
                <div className="h-px bg-green-900 my-1"></div>
                <div>Chain ID: {debugInfo.chainId}</div>
                <div>Address: {debugInfo.selectedAddress}</div>
                <div>Raw Balance: {debugInfo.rawBalance}</div>
                <div className="text-yellow-300 font-bold">Formatted Balance: {debugInfo.balance} ETH</div>

                {debugInfo.balanceError && (
                    <div className="text-red-400 mt-1">Balance Error: {debugInfo.balanceError}</div>
                )}
                {debugInfo.requestError && (
                    <div className="text-red-400 mt-1">Request Error: {debugInfo.requestError}</div>
                )}
            </div>

            <div className="mt-2 text-gray-500 text-[10px]">
                {debugInfo.timestamp}
            </div>
        </div>
    )
}
