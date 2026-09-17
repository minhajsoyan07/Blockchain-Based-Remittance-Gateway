# Blockchain-Based Remittance Gateway

A secure, decentralized cross-border remittance gateway and financial dashboard built with Ethereum smart contracts, Hardhat, Next.js 14, and Tailwind CSS.

## 🚀 Overview

**RemittancePay** empowers users to send, receive, and manage international money transfers with the trust, transparency, and speed of blockchain technology.

- **Smart Contract Escrow & Settlement**: Direct on-chain transfers with verified recipient balances and tamper-proof transaction histories.
- **User Profiles & Verification**: Decentralized identity management with KYC profile creation and status verification.
- **Next.js 14 Modern Web UI**: Fast, responsive web application with wallet connection (MetaMask / Ethers.js), transaction analytics, and exchange rate calculators.
- **Developer-Friendly Smart Contract Tooling**: Powered by Hardhat for local simulation, testing, and deployment.

---

## 🏗️ Project Architecture

```
RemittancePay/
├── backend/                  # Hardhat project (Solidity contracts & scripts)
│   ├── contracts/            # Smart contracts (RemittancePay.sol)
│   ├── scripts/              # Deployment and interaction scripts
│   ├── test/                 # Hardhat unit tests
│   └── hardhat.config.js     # Hardhat configuration
│
└── frontend/                 # Next.js 14 Web Application
    ├── app/                  # App Router pages and layouts
    ├── components/           # UI components (Radix UI, Tailwind)
    ├── hooks/                # Custom React hooks
    ├── lib/                  # Utilities, wallet helpers & configs
    └── public/               # Static assets
```

---

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity (`^0.8.0`), Hardhat, Ethers.js
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Radix UI
- **State & Animations**: Framer Motion, Lucide Icons, Sonner Notifications
- **Testing & Tooling**: Hardhat Toolbox, ESLint

---

## ⚡ Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MetaMask](https://metamask.io/) browser extension

### 2. Backend Setup (Smart Contracts)
```bash
cd backend

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy contracts
npm run deploy
```

### 3. Frontend Setup (Web App)
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📜 License
This project is licensed under the ISC License.
