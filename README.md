# Blockchain-Based Remittance Gateway (RemittancePay)

A decentralized, cross-border remittance gateway and financial dashboard built with Ethereum smart contracts, Hardhat, Next.js 14, and Tailwind CSS.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [How It Works](#how-it-works)
   - [1. User Onboarding and Identity Registration](#1-user-onboarding-and-identity-registration)
   - [2. Web3 Wallet Binding and Session Management](#2-web3-wallet-binding-and-session-management)
   - [3. Funding and Liquidity Management](#3-funding-and-liquidity-management)
   - [4. Cross-Border Remittance Transfer](#4-cross-border-remittance-transfer)
   - [5. Currency Exchange and Rate Calculation](#5-currency-exchange-and-rate-calculation)
   - [6. Fund Withdrawal to External Wallets](#6-fund-withdrawal-to-external-wallets)
3. [Smart Contract Architecture](#smart-contract-architecture)
   - [Data Structures](#data-structures)
   - [State Mappings](#state-mappings)
   - [Core Functions](#core-functions)
   - [Events](#events)
4. [Frontend Architecture and Features](#frontend-architecture-and-features)
   - [Application Route Structure](#application-route-structure)
   - [Key Application Modules](#key-application-modules)
   - [AI Financial Assistant](#ai-financial-assistant)
5. [Technology Stack](#technology-stack)
6. [Prerequisites and Installation](#prerequisites-and-installation)
   - [Prerequisites](#prerequisites)
   - [Backend Setup (Smart Contracts)](#backend-setup-smart-contracts)
   - [Frontend Setup (Web Application)](#frontend-setup-web-application)
7. [Testing and Verification](#testing-and-verification)
8. [License](#license)

---

## Executive Summary

Traditional cross-border remittances rely on intermediaries such as SWIFT networks and correspondent banks. This model introduces high transaction fees, multi-day settlement delays, unpredictable foreign exchange markups, and opaque processing pipelines.

RemittancePay provides a transparent, secure, and rapid cross-border payment gateway leveraging Ethereum smart contracts for settlement and custody, coupled with a full-featured Next.js web application. Users can deposit funds into escrow-backed smart contracts, initiate peer-to-peer cross-border transfers in seconds, convert between multiple supported currencies, and withdraw settled funds directly to their non-custodial Web3 wallets.

---

## How It Works

The platform operates across four layers: the client user interface, the application API server, the Web3 provider integration layer, and the Ethereum blockchain.

```
+-------------------------------------------------------------+
|                     Client Browser                          |
|  Next.js 14 UI (Dashboard, Send, Withdraw, Exchange, Chat) |
+------------------------------+------------------------------+
                               |
               +---------------+---------------+
               |                               |
               v                               v
+-------------------------------+ +---------------------------+
|      Next.js API Layer        | |  Web3 / Ethers.js Layer   |
| Auth, OTP, User DB, Analytics | |  MetaMask Signer/Provider |
+-------------------------------+ +-------------+-------------+
                                                |
                                                v
                                  +---------------------------+
                                  |    Ethereum Blockchain    |
                                  |    RemittancePay.sol      |
                                  +---------------------------+
```

### 1. User Onboarding and Identity Registration
1. A new user signs up using their email, full legal name, phone number, and password.
2. The platform issues a one-time verification code (OTP) to validate the user's communication channel.
3. Upon authentication, a user profile is created containing essential KYC attributes (such as full name, email, phone, nationality, age, gender, national identity number, and residential address).
4. The user profile is permanently recorded on-chain via the `createProfile` method in `RemittancePay.sol`, establishing a cryptographic link between the user's KYC record and their public Ethereum address.

### 2. Web3 Wallet Binding and Session Management
1. The user connects their non-custodial wallet (such as MetaMask) via the integration layer (`lib/metamask-utils.ts`).
2. The client requests account access using standard Ethereum RPC methods (`eth_requestAccounts`).
3. Once approved, the user's public address is transmitted to the backend API (`/api/wallet/connect`).
4. The backend verifies the user's active session, registers the wallet address, sets it as active, and deactivates previously registered secondary wallets to prevent address collision.
5. Users can selectively disconnect or permanently remove a wallet after confirming their account security credentials.

### 3. Funding and Liquidity Management
1. Users deposit funds into their internal platform balance using the `addFunds` smart contract function.
2. The transaction transfers native ETH from the user's personal wallet into the `RemittancePay` contract balance.
3. The contract updates `balances[msg.sender]` and emits a `BalanceUpdated` event.
4. The updated balance is immediately reflected across the frontend dashboard and transaction monitors.

### 4. Cross-Border Remittance Transfer
1. The sender initiates a transfer from `/send`, specifying the recipient's wallet address and the transfer amount.
2. Pre-execution checks verify that:
   - The recipient address is valid and non-zero.
   - The transfer amount is strictly positive.
   - The sender is registered in the contract registry.
   - The sender's balance is sufficient to cover the transfer amount.
3. Upon submission, the sender confirms the transaction through their wallet provider.
4. The smart contract updates internal ledger balances:
   - `balances[msg.sender] -= amount`
   - `balances[recipient] += amount`
5. A `Transaction` struct containing the sender, recipient, amount, block timestamp, status, and gas consumption is appended to both parties' transaction history arrays.
6. The contract emits `TransactionSent` and `TransactionReceived` events, making the transaction traceable on-chain.

### 5. Currency Exchange and Rate Calculation
1. The exchange module (`/exchange`) queries dynamic exchange rate endpoints (`/api/exchange-rates`).
2. Users can calculate conversion rates across fiat and crypto pairs (USD, EUR, GBP, BDT, BTC, ETH, USDT).
3. The platform computes real-time conversion rates, calculates network fees, and allows users to swap held balances into desired denominations.

### 6. Fund Withdrawal to External Wallets
1. When a user wishes to cash out their internal balance, they access `/withdraw`.
2. The user inputs the amount to withdraw.
3. The smart contract validates that `balances[msg.sender] >= amount`.
4. The contract deducts the requested amount from the internal ledger and transfers native ETH to `msg.sender` via a low-level call (`call{value: amount}`).
5. Re-entrancy protection principles are satisfied by deducting the internal balance prior to dispatching funds.
6. A `FundsWithdrawn` event is broadcast to the network.

---

## Smart Contract Architecture

The primary smart contract is `RemittancePay.sol`, located in `backend/contracts/RemittancePay.sol`.

### Data Structures

#### `Transaction`
Represents an individual transfer record stored permanently on-chain.
- `address from`: The public address of the sender.
- `address to`: The public address of the recipient.
- `uint256 amount`: The transferred value in Wei.
- `uint256 timestamp`: Block timestamp when the transaction was mined.
- `string status`: Execution status (e.g., `"completed"`).
- `uint256 gasUsed`: Estimated gas cost for the transfer.

#### `UserProfile`
Encapsulates on-chain user identity information.
- `address walletAddress`: Bound Ethereum account address.
- `string name`: Legal name of the user.
- `string email`: Registered email address.
- `string phone`: Contact telephone number.
- `string nationality`: Country of citizenship.
- `uint256 age`: Age of the user.
- `string gender`: Gender descriptor.
- `string nidNumber`: National identification number.
- `string address_`: Physical residential address.
- `bool verified`: KYC verification status flag.
- `uint256 createdAt`: Timestamp of profile initialization.

### State Mappings

```solidity
mapping(address => UserProfile) public profiles;
mapping(address => Transaction[]) public transactionHistory;
mapping(address => uint256) public balances;
mapping(address => bool) public registeredUsers;
```

### Core Functions

- `sendMoney(address _to, uint256 _amount) public payable returns (bool)`:
  Transfers funds from `msg.sender` to `_to`, verifies registration status, updates balances, writes transaction records to history, and emits events.
- `receiveMoney(address _from, uint256 _amount) public returns (bool)`:
  Updates the caller's balance when receiving authorized remittance disbursements.
- `createProfile(string _name, string _email, string _phone, string _nationality, uint256 _age, string _gender, string _nidNumber, string _address) public`:
  Registers a new user profile on-chain and flags the sender as an active registered user.
- `getProfile(address _user) public view returns (UserProfile memory)`:
  Returns the complete user profile associated with a wallet address.
- `getBalance(address _user) public view returns (uint256)`:
  Queries the available internal balance for the specified account.
- `getTransactionHistory(address _user) public view returns (Transaction[] memory)`:
  Retrieves all historical transactions sent or received by the given account.
- `addFunds() public payable`:
  Deposits native ETH into the contract vault and credits the caller's internal balance.
- `withdrawFunds(uint256 _amount) public`:
  Deducts the specified amount from the caller's internal balance and transfers native ETH back to their external address.
- `verifyProfile(address _user) public`:
  Enables administrative verification of a user's on-chain KYC profile.
- `getTransactionCount(address _user) public view returns (uint256)`:
  Returns the total count of transactions associated with a wallet address.

### Events

- `event TransactionSent(address indexed from, address indexed to, uint256 amount, uint256 timestamp)`
- `event TransactionReceived(address indexed to, address indexed from, uint256 amount, uint256 timestamp)`
- `event ProfileCreated(address indexed user, string name)`
- `event BalanceUpdated(address indexed user, uint256 newBalance)`
- `event FundsWithdrawn(address indexed user, uint256 amount)`

---

## Frontend Architecture and Features

The web client is built on Next.js 14 utilizing the App Router architecture, React 18, and TypeScript.

### Application Route Structure

| Route | File Path | Access Level | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | Public | Landing page with automatic redirect for authenticated users |
| `/login` | `app/login/page.tsx` | Public | Credential-based authentication interface |
| `/signup` | `app/signup/page.tsx` | Public | User registration and initial credential creation |
| `/verify-otp` | `app/verify-otp/page.tsx` | Public | Multi-factor one-time password verification screen |
| `/forgot-password` | `app/forgot-password/page.tsx` | Public | Password reset initiation screen |
| `/reset-password` | `app/reset-password/page.tsx` | Public | Password credential update screen |
| `/dashboard` | `app/dashboard/page.tsx` | Authenticated | Main account overview: balances, quick actions, analytics |
| `/send` | `app/send/page.tsx` | Authenticated | Transfer creation and transaction submission |
| `/add-money` | `app/add-money/page.tsx` | Authenticated | Account deposit interface (Bank, Card, and Crypto) |
| `/withdraw` | `app/withdraw/page.tsx` | Authenticated | Fund redemption and on-chain withdrawal interface |
| `/exchange` | `app/exchange/page.tsx` | Authenticated | Multi-currency converter and balance exchange |
| `/transactions` | `app/transactions/page.tsx` | Authenticated | Searchable and filterable transaction history table |
| `/analytics` | `app/analytics/page.tsx` | Authenticated | Financial analytics, money-flow visualizer, and charts |
| `/profile` | `app/profile/page.tsx` | Authenticated | Personal information and KYC profile inspector |
| `/settings` | `app/settings/page.tsx` | Authenticated | Wallet management, theme, language, and preferences |
| `/chatbot` | `app/chatbot/page.tsx` | Authenticated | Interactive AI financial negotiation and support assistant |

### Key Application Modules

- **Navigation and Layout (`components/olive-header.tsx`, `components/app-menu.tsx`)**: Responsive header and collapsible sidebar with real-time balance displays, wallet connection triggers, and navigation links.
- **Wallet Connection Manager (`components/metamask-button.tsx`, `components/wallet/wallet-manager.tsx`)**: Handles non-custodial wallet connections, account change detection, network switching, and secure wallet dissociation.
- **Performance and Flow Visualizers (`components/dashboard-performance-chart.tsx`, `components/dashboard-money-flow.tsx`)**: Dynamic charts presenting weekly inflow/outflow, transfer volume trends, and transaction statuses.
- **State and Context Providers (`lib/auth-context.tsx`, `lib/theme-context.tsx`, `lib/language-context.tsx`, `lib/font-context.tsx`)**: Centralized application state management handling sessions, theme switching, localization, and typography.

### AI Financial Assistant

The application includes an embedded AI assistant (`components/ai-assistant.tsx`, `app/chatbot/page.tsx`) designed to provide instant guidance on:
- Cross-border remittance cost estimation.
- Real-time exchange rate checks and currency trends.
- Guidance on smart contract transactions, gas estimation, and transfer status resolution.

---

## Technology Stack

- **Smart Contract Development**: Solidity 0.8.24, Hardhat 2.19, Hardhat Toolbox, Ethers.js
- **Frontend Framework**: Next.js 14 (App Router), React 18, TypeScript 5
- **Styling and UI**: Tailwind CSS 3.4, PostCSS, Radix UI Primitives, Lucide React
- **Animations and Charts**: Framer Motion, Recharts
- **Validation and Utilities**: Zod, React Hook Form, Date-fns, Sonner

---

## Prerequisites and Installation

### Prerequisites

- Node.js version 18.0.0 or higher
- npm version 9.0.0 or higher
- MetaMask extension installed in a Chromium-based browser or Firefox

### Backend Setup (Smart Contracts)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the Solidity smart contracts:
   ```bash
   npm run compile
   ```

4. Run the contract test suite:
   ```bash
   npm run test
   ```

5. Deploy contracts to a local or test network:
   ```bash
   npm run deploy
   ```

### Frontend Setup (Web Application)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Access the application in your browser at:
   ```
   http://localhost:3000
   ```

5. Build the production application bundle:
   ```bash
   npm run build
   ```

---

## Testing and Verification

- **Smart Contract Tests**: Automated tests located in `backend/test/RemittancePay.test.js` validate profile creation, fund deposits, transfer limits, and withdrawal access control.
- **Throughput and Stress Testing**: Benchmarking utilities are available in `frontend/scripts/throughput/` to measure send-money API throughput and mock stress scenarios.

---

## License

This project is licensed under the ISC License.
