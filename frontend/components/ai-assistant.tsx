"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { Bot, MessageCircle, SendHorizonal, Sparkles, X, Minimize2, Maximize2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buildResponse, defaultGreeting } from "@/lib/chatbot-config"
import type { ChatMessageRole } from "@/lib/chatbot-config"

interface Message {
  role: ChatMessageRole
  content: string
  timestamp: number
}

export function AiAssistant() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: defaultGreeting,
      timestamp: Date.now(),
    },
  ])

  const personalization = useMemo(() => {
    if (!user) return ""
    return `Hi ${user.fullName.split(" ")[0]}, how can I support your remittance workflow today?`
  }, [user])

  // Ref for auto-scrolling to latest message
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    }

    const reply = buildResponse(input)
    const assistantReply: Message = {
      role: "assistant",
      content: reply.content,
      timestamp: Date.now() + 1,
    }

    setMessages((prev) => [...prev, userMessage, assistantReply])
    setInput("")
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end max-h-[calc(100vh-3rem)]"
      aria-live="polite"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 backdrop-blur-xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden mb-4 flex flex-col ${isMaximized
              ? "w-[90vw] max-w-7xl max-h-[calc(100vh-120px)]"
              : "w-[400px] sm:w-[450px] max-h-[calc(100vh-120px)]"
              }`}
          >
            {/* Header - Dashboard Style */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/30 shadow-lg">
                    <Bot className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold">RemittancePay AI Assistant</span>
                    <span className="text-xs text-blue-100">Ask me anything about your transactions</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition border border-white/20"
                    aria-label={isMaximized ? "Minimize" : "Maximize"}
                  >
                    {isMaximized ? (
                      <Minimize2 className="w-4 h-4" strokeWidth={2.5} />
                    ) : (
                      <Maximize2 className="w-4 h-4" strokeWidth={2.5} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition border border-white/20"
                    aria-label="Close assistant"
                  >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area - Dashboard Card Style */}
            <div className={`p-4 sm:p-6 flex-1 overflow-hidden ${isMaximized ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : ""}`}>
              {/* Chat Messages Card */}
              <Card className={`border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col ${isMaximized ? "lg:col-span-2" : ""
                }`}>
                <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4 flex-shrink-0">
                  <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 font-bold text-base">
                    <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Chat Messages
                  </CardTitle>
                  {personalization && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-2 flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
                      {personalization}
                    </motion.div>
                  )}
                </CardHeader>
                <CardContent className="pt-4 flex-1 overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2" style={{
                    maxHeight: isMaximized ? "calc(100vh - 480px)" : "320px"
                  }}>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.timestamp + index}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm backdrop-blur transition ${message.role === "user"
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                            }`}
                        >
                          {message.content}
                        </div>
                      </motion.div>
                    ))}
                    {/* Scroll target for auto-scroll */}
                    <div ref={messagesEndRef} />
                  </div>
                </CardContent>
              </Card>

              {/* Side Panel - Help & Info (Only shown when maximized) */}
              {isMaximized && (
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 font-bold text-base">
                      <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Quick Help
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Send Money</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Ask how to send money to recipients</p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Transactions</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">View your transaction history</p>
                    </div>
                    <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                      <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">Wallet</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Connect your crypto wallet</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                      <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">Exchange</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Convert between currencies</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Input Area - Dashboard Card Style */}
            <div className="border-t-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about exchanges, OTPs, analytics…"
                  className="flex-1 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 text-sm h-12 px-4 rounded-xl"
                />
                <Button
                  size="icon"
                  variant="default"
                  onClick={handleSend}
                  className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all"
                  aria-label="Send message"
                >
                  <SendHorizonal className="w-5 h-5" strokeWidth={2.5} />
                </Button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-3 font-medium">
                Founder: Md. Minhajul Islam · RemittancePay knowledge base
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <Button
        onClick={() => setOpen((prev) => !prev)}
        size="icon"
        className="w-14 h-14 rounded-full shadow-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:scale-110 transition-transform"
        aria-label="Toggle AI assistant"
      >
        <MessageCircle className="w-6 h-6" strokeWidth={2.5} />
      </Button>
    </div>
  )
}


