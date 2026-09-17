"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  SendHorizonal,
  ArrowLeft,
  Check,
  CheckCheck,
  Circle,
  Sparkles,
  Zap,
  Bot,
} from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import { buildResponse } from "@/lib/chatbot-config"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: number
  status?: "sending" | "sent" | "delivered"
}

const quickPrompts = [
  "How do I send money?",
  "What currencies are supported?",
  "Tell me about blockchain",
  "What are the fees?",
]

// Typing indicator
const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="flex items-start gap-2 mb-2"
  >
    <Avatar className="h-9 w-9 shrink-0 shadow-lg border-2 border-white dark:border-slate-700">
      <AvatarFallback className="bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 text-white text-xs font-bold">
        <Bot className="w-5 h-5" />
      </AvatarFallback>
    </Avatar>
    <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-md">
      <div className="flex items-center gap-1.5">
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
          className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
          className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
          className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-blue-500"
        />
      </div>
    </div>
  </motion.div>
)

// Message Bubble
const MessageBubble = ({ message, showAvatar, showTime }: { message: Message; showAvatar: boolean; showTime: boolean }) => {
  const isUser = message.role === "user"
  const time = new Date(message.timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex items-end gap-2 mb-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {showAvatar && !isUser && (
        <Avatar className="h-9 w-9 shrink-0 shadow-lg border-2 border-white dark:border-slate-700">
          <AvatarFallback className="bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 text-white text-xs font-bold">
            <Bot className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      )}
      {!showAvatar && !isUser && <div className="w-9 shrink-0" />}

      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[80%] sm:max-w-[70%]`}>
        <div
          className={`px-4 py-3 rounded-2xl break-words shadow-lg ${isUser
            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-md"
            : "bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-md border border-slate-200 dark:border-slate-600"
            }`}
        >
          {isUser ? (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className={`text-[15px] leading-relaxed ${isUser ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>
              <ReactMarkdown
                components={{
                  // Structural Elements (PDF-like headers)
                  h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 border-b border-slate-200 pb-1" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-2 mb-1" {...props} />,

                  // Text Formatting
                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                  li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                  em: ({ node, ...props }) => <em className="italic text-slate-600 dark:text-slate-300" {...props} />,
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-2 bg-slate-50 dark:bg-slate-800/50 rounded-r italic text-slate-600 dark:text-slate-300" {...props} />
                  ),

                  // Code Syntax Styling
                  code: ({ node, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || "")
                    const isInline = !match && !className?.includes("language-")
                    return isInline ? (
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-sm text-pink-500 font-medium border border-slate-200 dark:border-slate-700" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className="font-mono text-sm text-slate-100" {...props}>
                        {children}
                      </code>
                    )
                  },
                  pre: ({ node, ...props }) => (
                    <div className="relative my-3 rounded-lg overflow-hidden bg-[#0d1117] border border-slate-700 shadow-sm group">
                      <div className="absolute top-2 right-2 flex gap-1opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Could add copy button here later */}
                      </div>
                      <pre className="p-4 overflow-x-auto text-sm leading-relaxed" {...props} />
                    </div>
                  ),

                  // Links
                  a: ({ node, ...props }) => (
                    <a
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {showTime && (
          <div className={`flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5 px-1`}>
            <span className="font-medium">{time}</span>
            {isUser && message.status && (
              <span className="ml-1">
                {message.status === "sent" && <Check className="w-3.5 h-3.5" />}
                {message.status === "delivered" && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function ChatbotPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const initializedRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (!isLoading && user && !initializedRef.current) {
      const greeting: Message = {
        role: "assistant",
        content: "👋 Hey there! Welcome to RemittancePAY AI! I'm powered by advanced AI and I know EVERYTHING about this platform - blockchain, crypto, money transfers, and more. What would you like to know?",
        timestamp: Date.now(),
        status: "delivered"
      }
      setMessages([greeting])
      initializedRef.current = true
    }
  }, [user, isLoading])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const handlePrompt = useCallback(async (prompt: string) => {
    const trimmed = prompt.trim()
    if (!trimmed || !user) return

    const now = Date.now()
    const userMessage: Message = {
      role: "user",
      content: trimmed,
      timestamp: now,
      status: "sending"
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    // Update status
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.timestamp === now ? { ...msg, status: "sent" } : msg
        )
      )
    }, 300)

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.timestamp === now ? { ...msg, status: "delivered" } : msg
        )
      )
    }, 600)

    setIsTyping(true)

    try {
      // Try GPT API first
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          conversationHistory: messages.slice(-6).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      })

      const data = await response.json()
      let replyContent = data.reply

      // If GPT unavailable, use local NLP
      if (data.fallback) {
        const context = {
          conversationHistory: messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content,
            topic: undefined
          })),
          previousResponses: messages
            .filter(msg => msg.role === "assistant")
            .slice(-5)
            .map(msg => msg.content)
        }

        const localReply = buildResponse(trimmed, context)
        replyContent = localReply.content
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: replyContent,
        timestamp: Date.now(),
        status: "delivered"
      }

      setIsTyping(false)
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)

      // Even on error, try local NLP
      try {
        const context = {
          conversationHistory: messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content,
            topic: undefined
          })),
          previousResponses: messages
            .filter(msg => msg.role === "assistant")
            .slice(-5)
            .map(msg => msg.content)
        }

        const localReply = buildResponse(trimmed, context)
        const assistantMessage: Message = {
          role: "assistant",
          content: localReply.content,
          timestamp: Date.now(),
          status: "delivered"
        }

        setIsTyping(false)
        setMessages((prev) => [...prev, assistantMessage])
      } catch (fallbackError) {
        toast.error("Failed to get response. Please try again.")
        setIsTyping(false)
      }
    }
  }, [user, messages])

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handlePrompt(input)
  }, [handlePrompt, input])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handlePrompt(input)
    }
  }, [handlePrompt, input])

  if (!isMounted || isLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Spinner className="h-12 w-12 text-blue-600" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-purple-500 animate-pulse" />
          </div>
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Starting AI Assistant...</span>
        </div>
      </div>
    )
  }

  const groupedMessages = messages.map((msg, idx) => {
    const prevMsg = messages[idx - 1]
    const nextMsg = messages[idx + 1]
    const showAvatar = !prevMsg || prevMsg.role !== msg.role || (msg.timestamp - prevMsg.timestamp > 60000)
    const showTime = !nextMsg || nextMsg.role !== msg.role || (nextMsg.timestamp - msg.timestamp > 60000)
    return { message: msg, showAvatar, showTime }
  })

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Colorful Gradient Header - Like Dashboard */}
      <div className="shrink-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 shadow-xl">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            <Avatar className="h-11 w-11 shadow-xl border-2 border-white/40">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 text-white font-bold">
                <Bot className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="font-bold text-white text-lg flex items-center gap-2">
                RemittancePay AI
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Groq Powered
                </span>
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-blue-100 font-medium">
                <Circle className="w-2 h-2 fill-green-400 text-green-400 animate-pulse" />
                <span>AI Active • Blockchain Expert</span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="text-xs font-bold text-white">{messages.length} messages</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <AnimatePresence mode="popLayout">
            {groupedMessages.map(({ message, showAvatar, showTime }, idx) => (
              <MessageBubble
                key={message.timestamp}
                message={message}
                showAvatar={showAvatar}
                showTime={showTime}
              />
            ))}
            {isTyping && <TypingIndicator key="typing" />}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          {/* Quick Prompts */}
          {messages.length === 1 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Quick Start
              </p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePrompt(prompt)}
                    className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 rounded-xl hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50 transition-all duration-200 border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2.5 border-2 border-transparent focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-colors shadow-inner">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about RemittancePay, blockchain, crypto..."
                className="w-full resize-none border-0 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 min-h-[28px] max-h-[120px] text-[15px]"
                rows={1}
                disabled={isTyping}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isTyping}
              className="h-12 w-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <SendHorizonal className="w-5 h-5 text-white" />
            </Button>
          </form>

          <p className="text-[11px] text-center text-slate-500 dark:text-slate-500 mt-3 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            Powered by Groq AI (Llama 3.1) • Blockchain Expert • 24/7 Available
          </p>
        </div>
      </div>
    </div>
  )
}
