"use client"

import { useState, useEffect } from "react"

import { motion } from "framer-motion"
import { ArrowRight, Shield, Clock, DollarSign, Globe } from "lucide-react"
import { Card } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import { OliveHeader } from "@/components/olive-header"
import { DigitalClock } from "@/components/digital-clock"
import { AppMenu } from "@/components/app-menu"

export default function AboutPage() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        <OliveHeader />

        {/* Page Title Section */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 shadow-xl p-6 sm:p-8 text-white mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <h1 className="text-4xl font-bold text-white">
                About RemittancePay
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                A secure and easy platform to send and receive money across borders, powered by blockchain technology.
              </p>
            </div>
            <div className="self-start">
              <BackButton />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-primary" />}
            title="Secure Transfers"
            description="Built on blockchain technology, ensuring every transaction is secure, traceable, and immutable."
          />
          <FeatureCard
            icon={<Clock className="w-8 h-8 text-primary" />}
            title="Fast Processing"
            description="Experience near-instant transfers across borders, eliminating traditional banking delays."
          />
          <FeatureCard
            icon={<DollarSign className="w-8 h-8 text-primary" />}
            title="Low Cost"
            description="Minimize transfer fees with our blockchain-powered infrastructure and smart contracts."
          />
          <FeatureCard
            icon={<Globe className="w-8 h-8 text-primary" />}
            title="Global Reach"
            description="Send money to anyone, anywhere in the world, with just their wallet address."
          />
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-primary/5 rounded-lg p-8"
        >
          <StatCard number="1M+" label="Users Worldwide" />
          <StatCard number="100+" label="Countries Served" />
          <StatCard number="$500M+" label="Transferred Securely" />
        </motion.div>
      </div>
    </main>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative"
    >
      <Card className="p-6 h-full hover:shadow-lg transition-shadow">
        <div className="flex flex-col h-full">
          <div className="mb-4">{icon}</div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
          <div className="mt-4 flex items-center text-primary">
            <span className="text-sm font-medium">Learn more</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center p-4">
      <div className="text-3xl font-bold text-primary mb-2">{number}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  )
}