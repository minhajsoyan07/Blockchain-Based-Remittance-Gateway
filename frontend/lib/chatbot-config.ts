export type ChatMessageRole = "assistant" | "user"

export interface ChatKnowledgeEntry {
  topic: string
  headline: string
  keywords: string[]
  summary: string
  guidance: string[]
  followUps: string[]
}

export interface ChatAssistantReply {
  content: string
  topic?: string
  followUps?: string[]
  headline?: string
  emoji?: string
}

export interface ConversationContext {
  lastTopic?: string
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string; topic?: string }>
  userSentiment?: "positive" | "neutral" | "negative" | "question" | "confused"
  previousResponses?: string[]
}

const knowledgeBase: ChatKnowledgeEntry[] = [
  {
    topic: "send",
    headline: "Sending money via blockchain",
    keywords: ["send", "transfer", "payment", "remit", "payout", "send money"],
    summary:
      "### 💸 Sending money is super easy!\n\nThink of it like ordering food online - you pick what you want (currency), enter where it goes (wallet address), and hit send!\n\n### We support\n- 🇺🇸 USD\n- 🇪🇺 EUR\n- 🇬🇧 GBP\n- 🇧🇩 BDT\n- ₿ BTC\n- Ξ ETH\n- 💲 USDT\n\n### How it works\nWhatever currency you choose, we automatically convert it to **ETH** behind the scenes and send it via MetaMask on the blockchain. Just connect your main wallet, paste the recipient's **0x address**, pick your currency, enter the amount, and boom - done! The blockchain ensures it gets there safely, like having a GPS tracker on your money.",
    guidance: [
      "Select your preferred currency (converts to ETH automatically).",
      "Ensure sufficient ETH balance (amount + **2% gas fee**).",
      "Recipient address must be a valid Ethereum address (**starts with 0x**).",
      "Check **Transactions History** to track your transfers.",
    ],
    followUps: [
      "How do currency conversions work?",
      "What are the gas fees?",
      "How long do transactions take?",
    ],
  },
  {
    topic: "recovery",
    headline: "Account recovery & OTP workflows",
    keywords: ["otp", "password", "recovery", "reset", "login"],
    summary:
      "🔐 **Forgot your password? No stress!** Use the OTP wizard:\n\n1. Choose email or phone recovery.\n2. We send you a **6-digit code** (valid for 3 mins).\n3. Verify code & set a huge new password.\n\n**Pro Tip:** Enable Multi-Factor Authentication (MFA) to avoid lockouts in the future!",
    guidance: [
      "Codes expire after **3 minutes**.",
      "Check spam/junk folder if email doesn't arrive.",
      "Consider enabling **MFA** for better security.",
    ],
    followUps: ["Enable multi-factor authentication", "Resend my OTP", "What if I lose both email and phone?"],
  },
  {
    topic: "add-money",
    headline: "Adding money to your account",
    keywords: ["add money", "deposit", "top up", "fund", "add funds", "load money"],
    summary:
      "### 💰 Top up your balance instantly!\n\n### Ways to Add Money\n- 💳 **Card**: Instant (like online shopping)\n- 🏦 **Bank Transfer**: 1-3 days (traditional)\n- ₿ **Crypto**: Instant (digital cash)\n\n We accept **USD, EUR, GBP, BDT, BTC, ETH, USDT**. Exchange rates update every **5 minutes** so you always get the fair market price!",
    guidance: [
      "Select currency from 7 options.",
      "Choose method: **Card**, **Bank**, or **Crypto**.",
      "Funds are **immediately available** after processing.",
    ],
    followUps: ["What currencies can I deposit?", "How long do deposits take?", "Are there any fees?"],
  },
  {
    topic: "withdraw",
    headline: "Withdrawing money from your account",
    keywords: ["withdraw", "withdrawal", "cash out", "payout", "get money", "take out"],
    summary:
      "### 💵 Cash out anytime, anywhere!\n\n### Withdrawal Methods\n- 🏦 **Bank Transfer**: 1-3 business days\n- 👛 **Crypto Wallet**: Instant\n- 📱 **Mobile Money**: Instant (bKash, Nagad, Rocket for BD 🇧🇩)\n\nPick any of our **7 supported currencies**, choose your country, and we handle the rest!",
    guidance: [
      "Supported: Bank, Crypto, bKash, Nagad, Rocket.",
      "Available in **USD, EUR, GBP, BDT, BTC, ETH, USDT**.",
      "**Crypto & Mobile Money** are processed instantly.",
    ],
    followUps: ["How long does withdrawal take?", "What are the withdrawal limits?", "Which countries are supported?"],
  },
  {
    topic: "currencies",
    headline: "Supported currencies and exchange",
    keywords: ["currency", "currencies", "exchange", "rate", "convert", "fx", "swap", "usd", "eur", "gbp", "bdt", "btc", "eth", "usdt"],
    summary:
      "### 💱 We speak 7 Currencies!\n\n### Fiat\n- 🇺🇸 USD (US Dollar)\n- 🇪🇺 EUR (Euro)\n- 🇬🇧 GBP (British Pound)\n- 🇧🇩 BDT (Bangladeshi Taka)\n\n### Crypto\n- ₿ BTC (Bitcoin)\n- Ξ ETH (Ethereum)\n- 💲 USDT (Tether)\n\nWe pull **live rates every 5 minutes** from CoinGecko & ExchangeRate-API. When sending, everything converts to **ETH** for the blockchain transaction.",
    guidance: [
      "Rates update every **5 minutes**.",
      "All currencies convert to **ETH** for sending.",
      "View all balances on your **Dashboard**.",
      "Swap instantly on the **Exchange** page.",
    ],
    followUps: ["How are exchange rates calculated?", "Can I hold multiple currencies?", "What about exchange fees?"],
  },
  {
    topic: "exchange",
    headline: "Currency exchange and swapping",
    keywords: ["exchange page", "convert currency", "swap currency", "exchange rates"],
    summary:
      "💱 **Instant Currency Swaps at Fair Rates!**\n\nSwap between any pair (e.g., USD to BTC, BDT to EUR) instantly. We use **live mid-market rates** with no hidden markups.\n\n**How to Swap:**\n1. Go to Exchange page\n2. Select 'From' and 'To' currencies\n3. Enter amount\n4. Confirm swap!",
    guidance: [
      "Select source and target currencies.",
      "See **real-time conversion preview**.",
      "Transactions are **instant**.",
      "No waiting time.",
    ],
    followUps: ["How do I check current rates?", "Are there exchange fees?", "Can I set rate alerts?"],
  },
  {
    topic: "dashboard",
    headline: "Dashboard and analytics overview",
    keywords: ["dashboard", "analytics", "chart", "graph", "report", "portfolio", "statistics"],
    summary:
      "📊 **Your Financial Command Center**\n\nYour Dashboard shows:\n- 💰 **Total Portfolio Value**\n- 🌍 **Balances** in all 7 currencies\n- 📈 **Performance Chart** (Last 5 months trends)\n- 📝 **Recent Activity**\n\nIt's like having a personal accountant updated in real-time!",
    guidance: [
      "View total portfolio value at a glance.",
      "Analyze spending trends with interactive charts.",
      "Quick access to **Send**, **Add Interest**, **Exchange**.",
      "Monitor recent transactions.",
    ],
    followUps: ["How do I view transaction history?", "What does the performance chart show?", "Can I export my data?"],
  },
  {
    topic: "metamask",
    headline: "MetaMask wallet integration",
    keywords: ["metamask", "wallet", "blockchain", "connect wallet", "eth balance"],
    summary:
      "🛡️ **MetaMask is your key to the blockchain!**\n\nThink of it as your secure digital identity. Connecting MetaMask allows you to:\n- Use your **real ETH balance**\n- Sign secure transactions\n- Verify ownership on the blockchain\n\n**Don't have it?** Install the browser extension from [metamask.io](https://metamask.io) in 2 minutes!",
    guidance: [
      "Install from **metamask.io**.",
      "Connect via Dashboard (**'Connect MetaMask'** button).",
      "Real ETH balance updates every **10 seconds**.",
      "Required for sending money.",
    ],
    followUps: ["How do I connect my wallet?", "What is my ETH balance used for?", "Is MetaMask safe?"],
  },
  {
    topic: "blockchain",
    headline: "Blockchain and cryptocurrency basics",
    keywords: ["blockchain", "crypto", "ethereum", "eth", "bitcoin", "btc", "gas fee", "transaction"],
    summary:
      "⛓️ **Powered by Ethereum Blockchain**\n\nBlockchain is a public, immutable ledger. Every transaction you make is:\n- **Transparency**: Visible on the blockchain (via Etherscan)\n- **Secure**: Cannot be faked or reversed\n- **Global**: Works anywhere without banks\n\n**Gas Fees (2%)** cover the cost of processing on the network.",
    guidance: [
      "Transactions are **permanent** and irreversible.",
      "**Gas Fee (2%)** covers network processing.",
      "Verification takes **1-5 minutes**.",
      "Provides ultimate transparency.",
    ],
    followUps: ["What is a gas fee?", "Why do we use blockchain?", "How secure are transactions?"],
  },
  {
    topic: "transactions",
    headline: "Transaction history and details",
    keywords: ["transaction", "transactions", "history", "transaction id", "txid", "tx hash"],
    summary:
      "📝 **Track Every Penny**\n\nView your full financial history on the Transactions page.\n\n**Details include:**\n- **ID**: Unique tracker (e.g., `TX11RPAY01`)\n- **Type**: Send, Add, Exchange, Withdraw\n- **Status**: Pending, Completed, Failed\n- **Amount & Fees**\n\nUse the filters to find specific transfers instantly.",
    guidance: [
      "Format: `TX11RPAY##`.",
      "Filter by date, type, or status.",
      "Click any transaction for full details.",
      "Export capability available.",
    ],
    followUps: ["How do I track a transaction?", "What information is stored?", "Can I export transaction history?"],
  },
  {
    topic: "profile",
    headline: "Profile and settings management",
    keywords: ["profile", "settings", "account", "update", "edit profile", "change password", "preferences"],
    summary:
      "⚙️ **Your Account, Your Way**\n\nCustomize your experience in Profile Settings:\n- **Personal Info**: Name, Email, Phone\n- **Security**: Change Password, 2FA\n- **Appearance**: Light/Dark Mode 🌙/☀️\n- **Language & Fonts**: 5 font choices including *SolaimanLipi* for Bangla.\n\nEverything saves automatically!",
    guidance: [
      "Update contact info instantly.",
      "Enable **Two-Factor Auth** for safety.",
      "Toggle **Dark Mode** for eye comfort.",
      "Choose from **5 premium fonts**.",
    ],
    followUps: ["How do I change my password?", "Can I customize the theme?", "What languages are supported?"],
  },
  {
    topic: "security",
    headline: "Security and data protection",
    keywords: ["security", "password", "encryption", "hash", "secure", "privacy", "safe"],
    summary:
      "🔒 **Bank-Grade Security**\n\nWe protect your data with 4 layers of security:\n1. **SHA-256 Hashing**: Scrambles passwords so no one can read them.\n2. **JWT Auth**: Secure, expiring session tokens.\n3. **Encryption**: End-to-end data protection.\n4. **Blockchain**: Immutable transaction records.\n\nIt's like having a digital Fort Knox!",
    guidance: [
      "**SHA-256** password hashing.",
      "**JWT** for secure sessions.",
      "**HTTPS** & End-to-End Encryption.",
      "Blockchain immutability.",
    ],
    followUps: ["How are passwords stored?", "Is my data safe?", "What about transaction security?"],
  },
  {
    topic: "limits",
    headline: "Transaction limits and fees",
    keywords: ["limit", "limits", "fee", "fees", "cost", "charge", "price"],
    summary:
      "💰 **Transparent Pricing, Zero Hidden Fees**\n\n- **Add Money**: FREE\n- **Withdraw**: FREE\n- **Exchange**: FREE\n- **Send Money**: 2% Gas Fee (Blockchain cost)\n\nThat's it! No monthly charges, no maintenance fees. Pay only for what the blockchain network needs.",
    guidance: [
      "**2% Gas Fee** on Sends only.",
      "**0% Fee** on Deposits & Withdrawals.",
      "**0% Fee** on Currency Exchange.",
      "No account maintenance fees.",
    ],
    followUps: ["What are the gas fees?", "Are there any hidden costs?", "What about deposit fees?"],
  },
  {
    topic: "countries",
    headline: "Supported countries and regions",
    keywords: ["country", "countries", "region", "bangladesh", "usa", "uk", "india", "pakistan"],
    summary:
      "🌍 **Global Reach**\n\nWe operate in key regions with localized support:\n- 🇧🇩 **Bangladesh**: Mobile Money (bKash, Nagad)\n- 🇺🇸 **USA**\n- 🇬🇧 **UK**\n- 🇮🇳 **India**\n- 🇵🇰 **Pakistan**\n\nMore countries coming soon! You can use Crypto features globally 🌎.",
    guidance: [
      "**Bangladesh**: Special Mobile Money support.",
      "**Global**: Crypto Wallet support.",
      "**US/UK/EU**: Bank Transfer support.",
      "Expanding to new regions monthly.",
    ],
    followUps: ["Which mobile money services work?", "When will my country be added?", "What about other regions?"],
  },
  {
    topic: "account",
    headline: "Account creation and management",
    keywords: ["signup", "register", "sign up", "create account", "account", "sign in", "login"],
    summary:
      "🚀 **Join in Seconds!**\n\nSign up with just:\n- Name\n- Email\n- Phone\n- Password\n\nYou get a unique **User ID** (e.g., `RPAY001`). No long forms or waiting periods. Connect MetaMask immediately and start transacting!",
    guidance: [
      "Requires Name, Email, Phone.",
      "**User ID** is auto-generated.",
      "Instant access to all features.",
      "Connect **MetaMask** for full utility.",
    ],
    followUps: ["How do I sign up?", "What is my User ID?", "How do I verify my account?"],
  },
  {
    topic: "features",
    headline: "RemittancePay features overview",
    keywords: ["features", "what can i do", "capabilities", "services", "functionality", "what does remittancepay do"],
    summary:
      "🚀 **All Your Financial Needs in One App**\n\n1. **Send Money**: Global, instant, low fee.\n2. **Add Funds**: Card, Bank, Crypto.\n3. **Withdraw**: Flexible payout options.\n4. **Exchange**: 7-Currency instant swap.\n5. **Analytics**: Real-time portfolio tracking.\n6. **Wallet**: Multi-currency & Crypto support.\n\nEverything powered by **Ethereum** for speed and security.",
    guidance: [
      "**Send**: Global transfers.",
      "**Add/Withdraw**: Multiple channels.",
      "**Exchange**: Instant swaps.",
      "**Track**: Advanced analytics.",
    ],
    followUps: ["What currencies are supported?", "How does blockchain work?", "What makes this special?"],
  },
  {
    topic: "help",
    headline: "How to get help",
    keywords: ["how", "why", "when", "where", "explain", "show me", "tell me", "guide", "steps"],
    summary:
      "💬 **I'm here to help!**\n\nAsk me about:\n- **Sending Money**\n- **Fees & Limits**\n- **Account Settings**\n- **Technical Issues**\n\nJust type your question like \"*How do I send money?*\" or \"*Explain gas fees*\" and I'll guide you step-by-step.",
    guidance: [
      "Be specific with questions.",
      "Use keywords like **send**, **fee**, **account**.",
      "Ask for **step-by-step** guides.",
      "I'm available 24/7!",
    ],
    followUps: ["How do I send money?", "What currencies are supported?", "Tell me about fees"],
  },
  {
    topic: "support",
    headline: "Contact RemittancePay support",
    keywords: ["contact", "support", "help", "email", "phone", "customer service", "help desk"],
    summary:
      "📞 **Need Human Support?**\n\nWe are available 24/7 for you!\n\n📧 **Email**: `misoyan07@gmail.com`\n📞 **Phone**: `+880-1518-913006`\n\n**Founders:**\n- Md. Minhajul Islam\n- Sabirana Tasnim Moon\n\n*Tip: Include your Transaction ID (`TX...`) for faster help!*",
    guidance: [
      "Email: **misoyan07@gmail.com**",
      "Phone: **+880-1518-913006**",
      "Include **Transaction ID**.",
      "Founders are directly accessible.",
    ],
    followUps: ["How do I report a problem?", "What is your response time?", "How can I contact the founders?"],
  },
  {
    topic: "founder-info",
    headline: "About Md. Minhajul Islam & Sabirana Tasnim Moon - Founders",
    keywords: ["minhajul", "islam", "sabirana", "tasnim", "moon", "founder", "creator", "founders", "creators", "who made", "who created", "who built", "made this", "creator name", "founder name"],
    summary:
      "👨‍💼 **Meet the Creators!**\n\n**RemittancePay** is the brainchild of:\n\n**Md. Minhajul Islam**\n- Student at **IUBAT** (ID: 22103379)\n- Blockchain Visionary\n\n**Sabirana Tasnim Moon**\n- Co-Founder\n- Fintech Innovator\n\nTogether, they are revolutionizing global finance! 🚀\n\n📧 `misoyan07@gmail.com`\n📞 `+880-1518-913006`",
    guidance: [
      "**Md. Minhajul Islam** (IUBAT Student).",
      "**Sabirana Tasnim Moon** (Co-Founder).",
      "Contact directly via email/phone.",
      "Building the future of remittance.",
    ],
    followUps: ["What makes RemittancePay special?", "Who are the founders?", "What technologies does it use?"],
  },
  {
    topic: "iubat",
    headline: "About IUBAT - Founder's Institution",
    keywords: ["iubat", "university", "institution", "education", "college", "bangladesh university"],
    summary:
      "🏫 **Proudly Associated with IUBAT**\n\n**International University of Business Agriculture and Technology**\n\nOur founder, **Md. Minhajul Islam**, is a student here (ID: `22103379`). This project represents the cutting-edge innovation fostered at IUBAT, combining academic excellence with real-world blockchain solutions.",
    guidance: [
      "**IUBAT**: Leading private university in BD.",
      "**Student ID**: 22103379.",
      "Project highlights fintech innovation.",
    ],
    followUps: ["Who created RemittancePay?", "What is the project about?", "How can I learn more?"],
  },
  {
    topic: "remittancepay-overview",
    headline: "RemittancePay - Complete Platform Overview",
    keywords: ["remittancepay", "remittance pay", "platform", "system", "what is", "about remittancepay", "what does", "overview"],
    summary:
      "🌐 **RemittancePay: The Future of Money Transfer**\n\nA revolutionary platform by **Md. Minhajul Islam** & **Sabirana Tasnim Moon**.\n\n**Key Highlights:**\n- ⚡ **Speed**: Instant Crypto/Mobile Money transfers.\n- 🌍 **Global**: Supports 7 currencies (USD, EUR, GBP, BDT, etc.).\n- 🛡️ **Secure**: Powered by **Ethereum Blockchain**.\n- 💸 **Cheap**: Only 2% fee on sends, free deposits/withdrawals.\n\nIt's your **Global Bank** that never sleeps!",
    guidance: [
      "Blockchain-powered.",
      "7-Currency Support.",
      "Real-time exchange rates.",
      "Low 2% fees.",
    ],
    followUps: ["How do I get started?", "What currencies are supported?", "Is it safe?"],
  },
  {
    topic: "technical-details",
    headline: "Technical Architecture & Implementation",
    keywords: ["technical", "architecture", "how it works", "backend", "frontend", "api", "database", "implementation", "tech stack", "technology"],
    summary:
      "⚙️ **Under the Hood**\n\n**Stack:**\n- **Frontend**: Next.js 14, React, Tailwind, TypeScript\n- **Backend**: Next.js API Routes, Hardhat (Smart Contracts)\n- **Database**: Dual-Mode JSON System\n- **Blockchain**: Ethereum (MetaMask integration)\n\n**Features:**\n- SHA-256 Hashing\n- JWT Authentication\n- Real-time API integration (CoinGecko)\n\nOptimized for **Speed, Security, and Scalability**.",
    guidance: [
      "**Next.js 14** & **React**.",
      "**Ethereum** Smart Contracts.",
      "**JSON** File Database.",
      "**SHA-256** & **JWT** Security.",
    ],
    followUps: ["How are exchange rates fetched?", "What database does it use?", "How is security handled?"],
  },
  {
    topic: "general-knowledge",
    headline: "General Information & Tips",
    keywords: ["general", "info", "information", "tips", "tricks", "best practices", "guide", "faq", "questions"],
    summary:
      "💡 **Pro Tips for Success**\n\n- **Safety First**: Verify 0x addresses before sending.\n- **Security**: Never share your Private Key!\n- **Rates**: Refresh every 5 mins for latest rates.\n- **Passwords**: Use complex passwords for max security.\n\n**Need Help?**\nContact: `misoyan07@gmail.com`\nCall: `+880-1518-913006`\n\n*Enjoy seamless transfers with RemittancePay!*",
    guidance: [
      "Verify **0x addresses**.",
      "Protect **Private Keys**.",
      "Refresh for latest rates.",
      "Contact support for issues.",
    ],
    followUps: ["How do I stay secure?", "What are best practices?", "How can I learn more?"],
  },
]

export const defaultGreeting =
  "👋 Hey there! Welcome to RemittancePAY AI! I'm your friendly assistant who knows EVERYTHING about this platform. I can help you with sending money, adding funds, withdrawals, currency exchange, transactions, MetaMask setup, blockchain stuff, fees, and basically anything! What's on your mind?"

// ============================================================================
// Fuzzy Matching: Levenshtein Distance for typo tolerance
// ============================================================================
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix = []

  // increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  // increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1,   // insertion
            matrix[i - 1][j] + 1    // deletion
          )
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

// Add new technical knowledge base entries
const technicalKnowledge: ChatKnowledgeEntry[] = [
  {
    topic: "architecture",
    headline: "System Architecture & Tech Stack",
    keywords: ["architecture", "tech stack", "technologies", "framework", "database", "backend", "frontend"],
    summary:
      "### 🏗️ RemittancePay Architecture\n\nWe use a modern, scalable stack:\n\n### 💻 Frontend\n- `Next.js 14` (App Router)\n- `TypeScript` (Type Safety)\n- `Tailwind CSS` + `Shadcn/UI`\n- `Framer Motion` (Animations)\n\n### ⚙️ Backend\n- `Next.js API Routes` (Serverless)\n- `Hardhat` (Blockchain Dev Env)\n- `Ethers.js` (Web3 Interaction)\n\n### 💾 Database\n- Custom JSON-based storage (`mock-db.ts`) for speed and portability.\n\n### ⛓️ Blockchain\n- Ethereum Network\n- Smart Contracts (Solidity)",
    guidance: [
      "Frontend: **Next.js 14 + Tailwind**",
      "Backend: **Next.js API + Hardhat**",
      "Blockchain: **Ethereum + Solidity**",
      "Auth: **JWT + SHA-256**",
    ],
    followUps: ["Show me the smart contract code", "How is the database implemented?", "Explain the frontend structure"],
  },
  {
    topic: "smart-contract",
    headline: "Smart Contract Implementation",
    keywords: ["smart contract", "solidity", "contract code", "blockchain code", "remittance contract"],
    summary:
      "📜 **RemittancePay Smart Contract**\n\nOur `Remittance.sol` handles the core logic. Here's a snippet of how a transfer works:\n\n```solidity\nfunction sendRemittance(address payable _receiver) public payable {\n    require(msg.value > 0, \"Amount must be greater than 0\");\n    \n    // Transfer ETH to receiver\n    _receiver.transfer(msg.value);\n    \n    // Emit event for tracking\n    emit RemittanceSent(msg.sender, _receiver, msg.value, block.timestamp);\n}\n```\n\nThis ensures trustless, instant transfers directly on the Ethereum blockchain.",
    guidance: [
      "Written in **Solidity**.",
      "Uses `payable` functions for ETH handling.",
      "Emits events for frontend tracking.",
      "Deployed via **Hardhat**.",
    ],
    followUps: ["Where is the contract deployed?", "How do gas fees work in code?", "Is it audited?"],
  },
  {
    topic: "database-code",
    headline: "Database Implementation (JSON)",
    keywords: ["database code", "db code", "mock-db", "json storage", "how data is stored"],
    summary:
      "💾 **Custom JSON Database**\n\nWe use a lightweight, file-based database for speed. Here's how we read user data:\n\n```typescript\n// lib/db-utils.ts\nimport fs from 'fs';\nimport path from 'path';\n\nconst dbPath = path.join(process.cwd(), 'data', 'users.json');\n\nexport function getUser(email: string) {\n  const data = fs.readFileSync(dbPath, 'utf8');\n  const users = JSON.parse(data);\n  return users.find(u => u.email === email);\n}\n```\n\nThis keeps the app portable and fast without needing an external SQL server for this version.",
    guidance: [
      "Uses `fs` module to read/write JSON.",
      "Located in `data/users.json`.",
      "Zero-latency reads.",
      "Easy to backup and migrate.",
    ],
    followUps: ["Is this secure?", "How do you handle backups?", "Can it scale?"],
  },
];

// Merge technical entries into main knowledge base
technicalKnowledge.forEach(entry => knowledgeBase.push(entry));


// ============================================================================
// Enhanced Keyword Scoring: Fuzzy Matching & Context
// ============================================================================
const scoreEntry = (normalized: string, entry: ChatKnowledgeEntry) => {
  let score = 0
  const words = normalized.split(/\s+/)

  // 1. Exact Keyword Matching
  entry.keywords.forEach((keyword) => {
    const keywordLower = keyword.toLowerCase()

    // Fuzzy match allowance (based on keyword length)
    const maxDist = keywordLower.length > 5 ? 2 : 1

    // Check against user words
    words.forEach(userWord => {
      // Exact match
      if (userWord === keywordLower) {
        score += 8
      }
      // Fuzzy match (typo tolerance)
      else if (levenshteinDistance(userWord, keywordLower) <= maxDist) {
        score += 5 // Slightly lower capability for fuzzy match
      }
    })

    // Phrase match check
    if (normalized.includes(keywordLower)) {
      score += 10
    }
  })

  // 2. Headline Fuzzy Match
  if (levenshteinDistance(normalized, entry.headline.toLowerCase()) < 5 || normalized.includes(entry.headline.toLowerCase())) {
    score += 6
  }

  // 3. Topic Match
  if (normalized.includes(entry.topic)) {
    score += 4
  }

  return score
}

// ============================================================================
// Format Guidance: Creates concise, friendly responses based on user query
// ============================================================================
const formatGuidance = (entry: ChatKnowledgeEntry, isDetailQuery: boolean = false) => {
  // For detailed queries, provide more explanation with real-life examples
  if (isDetailQuery) {
    const keyPoints = entry.guidance.slice(0, 2).map((item) => `- ${item}`).join("\n")
    return `${entry.summary}\n\n### 💡 Quick Tips\n${keyPoints || ''}`
  }
  // For quick queries, just summary
  return entry.summary
}

// Helper function to get contextually appropriate emoji
function getContextualEmoji(topic: string | undefined, content: string): string {
  const lowerContent = content.toLowerCase()

  // Greeting emojis
  if (topic === "greeting" || lowerContent.includes("welcome") || lowerContent.includes("hello")) {
    return "👋"
  }

  // Success/helpful emojis
  if (lowerContent.includes("good news") || lowerContent.includes("excellent") || lowerContent.includes("great")) {
    return "✨"
  }

  // Tech/Code emojis
  if (topic === "architecture" || topic === "smart-contract" || topic === "database-code") {
    return "💻"
  }

  // Money/transaction emojis
  if (topic === "send" || topic === "add-money" || topic === "withdraw") {
    return "💸"
  }

  // Currency/exchange emojis
  if (topic === "currencies" || topic === "exchange") {
    return "💱"
  }

  // Security/safety emojis
  if (topic === "security" || topic === "metamask" || lowerContent.includes("secure") || lowerContent.includes("safe")) {
    return "🛡️"
  }

  // Settings/profile emojis
  if (topic === "profile" || topic === "account") {
    return "⚙️"
  }

  // Dashboard/analytics emojis
  if (topic === "dashboard" || topic === "transactions") {
    return "📊"
  }

  // Support/help emojis
  if (topic === "help" || topic === "support") {
    return "💬"
  }

  // Blockchain/crypto emojis
  if (topic === "blockchain") {
    return "⛓️"
  }

  // Features overview
  if (topic === "features") {
    return "🚀"
  }

  // Fees/limits
  if (topic === "limits") {
    return "💰"
  }

  // Countries
  if (topic === "countries") {
    return "🌍"
  }

  // Default friendly emoji
  return "💡"
}

// ============================================================================
// Enhanced Sentiment & Intent Analysis: Advanced detection with context awareness
// ============================================================================
function detectSentimentAndIntent(normalized: string): { sentiment: ConversationContext["userSentiment"]; intent: string } {
  const positiveWords = ["thank", "thanks", "great", "good", "awesome", "perfect", "excellent", "love", "happy", "appreciate", "wonderful", "amazing", "fantastic", "brilliant"]
  const negativeWords = ["error", "problem", "issue", "wrong", "failed", "not working", "can't", "cannot", "help", "stuck", "confused", "broken", "doesn't work", "error", "bug"]
  const techWords = ["code", "bug", "error", "api", "database", "react", "nextjs", "typescript", "solidity", "contract", "function", "variable", "component"]
  const questionWords = ["how", "what", "when", "where", "why", "which", "who", "can i", "should i", "do i", "does", "is", "are", "will", "would"]
  const confusedWords = ["?", "not sure", "don't understand", "don't know", "unclear", "confused", "mean", "explain", "clarify", "help me understand"]
  const urgencyWords = ["urgent", "asap", "immediately", "now", "quickly", "fast", "emergency"]

  const lowerInput = normalized.toLowerCase()

  // Tech Intent Detection
  if (techWords.some(w => lowerInput.includes(w))) {
    return { sentiment: "neutral", intent: "technical_support" }
  }

  // Enhanced detection with multiple checks
  if (positiveWords.some(w => lowerInput.includes(w)) && !negativeWords.some(w => lowerInput.includes(w))) {
    return { sentiment: "positive", intent: "appreciation" }
  }

  // Check for urgency
  if (urgencyWords.some(w => lowerInput.includes(w)) && (negativeWords.some(w => lowerInput.includes(w)) || confusedWords.some(w => lowerInput.includes(w)))) {
    return { sentiment: "negative", intent: "problem_solving" }
  }

  if (negativeWords.some(w => lowerInput.includes(w)) || confusedWords.some(w => lowerInput.includes(w))) {
    return { sentiment: lowerInput.includes("?") || confusedWords.some(w => lowerInput.includes(w)) ? "confused" : "negative", intent: "problem_solving" }
  }

  if (questionWords.some(w => lowerInput.includes(w)) || lowerInput.endsWith("?") || lowerInput.includes("?")) {
    return { sentiment: "question", intent: "information" }
  }

  return { sentiment: "neutral", intent: "general" }
}

// ============================================================================
// Natural Response Variations: Creates varied, natural responses
// ============================================================================
function getNaturalResponseVariations(topic: string, sentiment: ConversationContext["userSentiment"]): string {
  const variations: Record<string, Record<string, string[]>> = {
    send: {
      positive: ["Awesome!", "Perfect!", "Great!", "Excellent!"],
      neutral: ["Sure thing!", "Absolutely!", "Got it!", "Right!"],
      question: ["Great question!", "Good question!", "Let me explain!", "I'll help with that!"],
      confused: ["No worries, let me explain!", "Don't worry, I got you!", "Let me break it down!", "I'll clarify that!"],
      negative: ["I'll help you get this sorted!", "Let's fix this!", "I can help with that!", "No problem, let me assist!"]
    },
    // tech topic variations
    architecture: {
      positive: ["Glad you're interested in the tech!", "Our stack is pretty cool!"],
      neutral: ["Here's the technical breakdown:", "Let's dive into the code:"],
      question: ["Let me show you how it works under the hood:", "Technical deep dive coming up:"],
      confused: ["It can be complex, let me simplify:", "Here's the simple version of our stack:"],
      negative: ["Let's debug this:", "I can explain the architecture:"]
    },
    greeting: {
      positive: ["Hey! Great to see you!", "Hello! Good to meet you!", "Hi there! Welcome!"],
      neutral: ["Hello there!", "Hey!", "Hi!"],
      question: ["Hi! How can I assist?", "Hello! What can I help with?", "Hey! What do you need?"],
      confused: ["Hi! Let me help clarify things!", "Hey! I can explain!", "Hello! I'm here to help!"],
      negative: ["Hey! I'm here to help!", "Hi! Let's get this sorted!", "Hello! I can assist!"]
    }
  }
  const topicVariations = variations[topic] || variations["send"]
  const sentimentVariations = topicVariations[sentiment || "neutral"] || topicVariations["neutral"]
  return sentimentVariations[Math.floor(Math.random() * sentimentVariations.length)] || ""
}

// ============================================================================
// Check for Repetition: Avoids repeating same responses
// ============================================================================
function checkRepetition(content: string, previousResponses?: string[]): boolean {
  if (!previousResponses || previousResponses.length === 0) return false
  const normalizedContent = content.toLowerCase().substring(0, 50)
  return previousResponses.some(prev => prev.toLowerCase().substring(0, 50) === normalizedContent)
}

// ============================================================================
// Build Natural Response: Creates human-like, contextual response
// ============================================================================
function buildNaturalResponse(
  entry: ChatKnowledgeEntry,
  normalized: string,
  sentiment: ConversationContext["userSentiment"],
  isDetailQuery: boolean,
  conversationHistory?: ConversationContext["conversationHistory"],
  previousResponses?: string[]
): string {
  let response = entry.summary

  // Get natural opening phrase based on sentiment
  const opening = getNaturalResponseVariations(entry.topic, sentiment)

  // Check if user asked about this before
  const hasAskedBefore = conversationHistory?.some(msg =>
    msg.role === "user" &&
    (msg.content.toLowerCase().includes(entry.topic) || msg.topic === entry.topic)
  )

  // Build natural response based on query type
  if (isDetailQuery) {
    // Detailed explanations with key points
    const keyPoints = entry.guidance.slice(0, 2).map(item => `- ${item}`).join("\n")
    response = `${entry.summary}\n\n**Quick Tips:**\n${keyPoints}`
  }

  // Add natural opening if not repetitive
  if (opening && !hasAskedBefore) {
    response = `${opening}\n\n${response}`
  } else if (hasAskedBefore && sentiment !== "positive") {
    // Re-explaining with variation
    const reExplainPhrases = [
      `Let me explain **${entry.headline}** in a different way:`,
      `Here's **${entry.headline}** from another angle:`,
      `Let me rephrase that for you:`,
    ]
    const phrase = reExplainPhrases[Math.floor(Math.random() * reExplainPhrases.length)]
    response = `${phrase}\n\n${response}`
  }

  // Add natural contextual closing based on sentiment
  const closings: Record<string, string[]> = {
    confused: [
      "\n\nDoes that make more sense now?",
      "\n\nHope that clears things up!",
      "\n\nLet me know if you need more details!"
    ],
    question: [
      "\n\nIs there anything specific you'd like to know more about?",
      "\n\nWant to dive deeper into this?",
      "\n\nAny other questions?"
    ],
    positive: [
      "\n\nHappy to help! Anything else?",
      "\n\nGreat! What else can I assist with?",
      "\n\nYou're welcome!"
    ],
    negative: [
      "\n\nHope that helps resolve the issue!",
      "\n\nDoes that fix it?",
      "\n\nLet me know if you need more help!"
    ]
  }

  if (sentiment && closings[sentiment]) {
    const closingOptions = closings[sentiment]
    const closing = closingOptions[Math.floor(Math.random() * closingOptions.length)]
    response += closing
  }

  return response
}

// ============================================================================
// Build Response: Creates intelligent, context-aware responses
// ============================================================================
// ============================================================================
// Advanced Query Analysis: Intelligent query type detection
// ============================================================================
function analyzeQuery(normalized: string): { isDetailQuery: boolean; queryType: string; requiresExplanation: boolean } {
  const detailIndicators = ["how", "what", "explain", "tell me", "show", "describe", "why", "can you", "could you", "walk me through", "guide", "steps", "code", "architecture"]
  const explanationIndicators = ["explain", "what is", "what does", "how does", "why does", "tell me about", "describe"]
  const comparisonIndicators = ["difference", "compare", "vs", "versus", "better", "best", "which"]

  const isDetailQuery = detailIndicators.some(ind => normalized.includes(ind))
  const requiresExplanation = explanationIndicators.some(ind => normalized.includes(ind))
  const isComparisonQuery = comparisonIndicators.some(ind => normalized.includes(ind))

  let queryType = "general"
  if (isComparisonQuery) queryType = "comparison"
  else if (requiresExplanation) queryType = "explanation"
  else if (isDetailQuery) queryType = "detailed"

  return { isDetailQuery, queryType, requiresExplanation }
}

export function buildResponse(input: string, context?: ConversationContext): ChatAssistantReply {
  const normalized = input.trim().toLowerCase()
  const { sentiment, intent } = detectSentimentAndIntent(normalized)
  const { isDetailQuery, queryType, requiresExplanation } = analyzeQuery(normalized)

  // Enhanced context awareness - check conversation history for better understanding
  const lastUserMessage = context?.conversationHistory?.filter(m => m.role === "user").slice(-1)[0]
  const lastAssistantMessage = context?.conversationHistory?.filter(m => m.role === "assistant").slice(-1)[0]
  const isFollowUp = lastUserMessage && lastUserMessage.content.toLowerCase() !== normalized
  const conversationTopic = lastAssistantMessage?.topic || context?.lastTopic

  if (!normalized) {
    return {
      content: "👋 **Welcome to RemittancePay AI!**\n\nI'm your intelligent assistant. I know everything about:\n- 💸 **Transactions**\n- 💻 **System Architecture**\n- ⛓️ **Smart Contracts**\n\nWhat would you like to know?",
      followUps: ["How do I send money?", "Show me the smart contract", "Explain the tech stack"],
      emoji: "👋"
    }
  }

  // ============================================================================
  // Handle Sentiment-Based Responses
  // ============================================================================
  if (sentiment === "positive") {
    const positiveResponses = [
      "Awesome! 😊 I'm so glad I could help!",
      "That's great to hear! 🎉",
      "You're very welcome! Happy to help! 😊"
    ]
    const randomResponse = positiveResponses[Math.floor(Math.random() * positiveResponses.length)]
    return {
      topic: context?.lastTopic || "general",
      content: `${randomResponse} What else can I help you with?`,
      followUps: ["How do I send money?", "Tell me about fees"],
      emoji: "😊"
    }
  }

  // ============================================================================
  // Handle Greeting Responses - Natural Variations
  // ============================================================================
  if (normalized.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|hey there|what's up|sup)$/)) {
    const greetingVariations = [
      "Hey! 👋 Nice to meet you! I'm here to help with anything RemittancePay related. Ask me anything - I know every feature inside out!",
      "Hello! 👋 Welcome! I'm your AI assistant and I know everything about RemittancePay. What would you like to explore?",
      "Hi there! 👋 Great to see you! I'm here to help with sending money, managing your wallet, or anything else about the platform. What's on your mind?"
    ]
    const greetingContent = greetingVariations[Math.floor(Math.random() * greetingVariations.length)]
    return {
      topic: "greeting",
      content: greetingContent,
      followUps: ["How do I send money?", "What can you help me with?"],
      emoji: "👋"
    }
  }

  // ============================================================================
  // Handle Founder/Creator Questions - Enhanced with More Details
  // ============================================================================
  if (normalized.includes("founder") || normalized.includes("who created") || normalized.includes("made this") ||
    normalized.includes("who built") || normalized.includes("who made") || normalized.includes("creator") ||
    normalized.includes("minhajul") || normalized.includes("islam") ||
    normalized.includes("sabirana") || normalized.includes("tasnim") || normalized.includes("moon")) {
    const founderResponses = [
      "👨‍💼 RemittancePay was created by Md. Minhajul Islam and Sabirana Tasnim Moon! They combined blockchain technology with traditional remittance services to create this platform. Think of it like upgrading your old phone to the latest model - same core functions, but way faster and more secure! Want to reach out? 📧 misoyan07@gmail.com or 📞 +880-1518-913006",
      "👨‍💼 Yes! Md. Minhajul Islam and Sabirana Tasnim Moon are the founders. They designed RemittancePay to bridge the gap between traditional banking and blockchain technology. It's like having the reliability of a bank with the speed of cryptocurrency! Pretty innovative, right? Contact: 📧 misoyan07@gmail.com or 📞 +880-1518-913006",
      "👨‍💼 That's Md. Minhajul Islam and Sabirana Tasnim Moon! They are the visionaries behind RemittancePay. Their idea was to make global money transfers as easy as sending a text message, but with blockchain security. The platform supports 7 currencies, integrates with MetaMask, and handles everything from deposits to withdrawals. Need to contact them? 📧 misoyan07@gmail.com or 📞 +880-1518-913006"
    ]
    const founderContent = founderResponses[Math.floor(Math.random() * founderResponses.length)]
    return {
      topic: "about",
      content: founderContent,
      followUps: ["What makes RemittancePay special?", "How does blockchain work here?"],
      emoji: "👨‍💼"
    }
  }

  // ============================================================================
  // Handle "what can you do" / "help" queries - Enhanced with Context
  // ============================================================================
  if (normalized.match(/^what (can|could) (you|i) do/) || normalized.match(/^help$/) || normalized === "what help" ||
    normalized.includes("capabilities") || normalized.includes("features")) {
    const entry = knowledgeBase.find(e => e.topic === "features")!
    let content = formatGuidance(entry, true)
    const emoji = getContextualEmoji("features", content)

    // Add natural opening based on sentiment
    if (sentiment === "question") {
      content = `${emoji} Great question! ${content}`
    } else if (sentiment === "confused") {
      content = `${emoji} Absolutely! Let me break it down: ${content}`
    } else {
      const trimmedContent = content.trim()
      const startsWithEmoji = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(trimmedContent)
      if (!startsWithEmoji) {
        content = `${emoji} ${content}`
      }
    }

    return {
      topic: "features",
      content: content,
      followUps: ["How do I send money?", "What currencies work?"],
      emoji: emoji
    }
  }

  // Enhanced scoring with context awareness
  let bestEntry: ChatKnowledgeEntry | undefined
  let bestScore = 0
  const contextBoost = conversationTopic ? 3 : 0 // Boost score if we have conversation context

  knowledgeBase.forEach((entry) => {
    let score = scoreEntry(normalized, entry)

    // Context boost: if we were discussing this topic, increase relevance
    if (conversationTopic && entry.topic === conversationTopic) {
      score += contextBoost
    }

    // Intent boost: match intent with entry topic
    if (intent === "problem_solving" && (entry.topic === "support" || entry.topic === "help")) {
      score += 5
    }
    if (intent === "information" && entry.topic !== "support") {
      score += 2
    }

    if (score > bestScore) {
      bestScore = score
      bestEntry = entry
    }
  })

  if (bestEntry && bestScore > 0) {
    // Check for repetition
    const previousContent = context?.previousResponses?.[context.previousResponses.length - 1]
    const isRepetitive = previousContent && checkRepetition(previousContent, context.previousResponses)

    // Build natural response with sentiment awareness
    let content = buildNaturalResponse(
      bestEntry,
      normalized,
      sentiment,
      isDetailQuery,
      context?.conversationHistory,
      context?.previousResponses
    )

    const emoji = getContextualEmoji(bestEntry.topic, content)

    // If content doesn't already start with emoji, add it with a space
    const trimmedContent = content.trim()
    const startsWithEmoji = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(trimmedContent)
    if (!startsWithEmoji) {
      content = `${emoji} ${content}`
    }

    // Add variation if repetitive
    if (isRepetitive) {
      const variationPhrases = [
        "Let me put this another way:",
        "Here's another angle on that:",
        "To explain it differently:",
        "In simpler terms:"
      ]
      const phrase = variationPhrases[Math.floor(Math.random() * variationPhrases.length)]
      content = `${phrase} ${content}`
    }

    // Generate 2 most relevant follow-ups based on user intent
    const relevantFollowUps = getRelevantFollowUps(bestEntry, normalized, bestScore)

    return {
      topic: bestEntry.topic,
      headline: bestEntry.headline,
      content: content,
      followUps: relevantFollowUps,
      emoji: emoji,
    }
  }

  // ============================================================================
  // Context-Aware Responses When No Direct Match
  // ============================================================================
  if (context?.lastTopic || context?.conversationHistory) {
    const related = context.lastTopic ? knowledgeBase.find((entry) => entry.topic === context.lastTopic) : undefined

    // Try to find related topic from conversation history
    const recentTopics = context.conversationHistory?.slice(-3).map(m => m.topic).filter(Boolean)
    let contextEntry = related

    if (!contextEntry && recentTopics && recentTopics.length > 0) {
      const mostRecentTopic = recentTopics[recentTopics.length - 1]
      contextEntry = knowledgeBase.find(e => e.topic === mostRecentTopic)
    }

    if (contextEntry) {
      const emoji = getContextualEmoji(contextEntry.topic, "")
      const confusionResponses = [
        `${emoji} I'm not entirely sure what you mean there, but since we were discussing ${contextEntry.headline.toLowerCase()}, here's what I can tell you: ${contextEntry.summary}\n\nWant me to explain it differently or go deeper into something specific?`,
        `${emoji} Hmm, let me connect this to what we were talking about - ${contextEntry.headline.toLowerCase()}. Here's the deal: ${contextEntry.summary}\n\nDoes that help? Or should I explain something else?`,
        `${emoji} I might not have caught that exactly, but building on our ${contextEntry.headline.toLowerCase()} conversation: ${contextEntry.summary}\n\nCan you rephrase or ask something more specific? I want to make sure I help you right!`
      ]
      const content = sentiment === "confused"
        ? confusionResponses[Math.floor(Math.random() * confusionResponses.length)]
        : `${emoji} Since we were on ${contextEntry.headline.toLowerCase()}, here's the info: ${contextEntry.summary}\n\nWant to dive deeper into anything?`

      return {
        topic: contextEntry.topic,
        content,
        followUps: getRelevantFollowUps(contextEntry, normalized, 0),
        emoji: emoji,
      }
    }
  }

  // ============================================================================
  // Default Fallback Response - Natural and Varied
  // ============================================================================
  const fallbackResponses = [
    "💡 Hmm, I'm not entirely sure what you're asking, but no worries! I know this system like the back of my hand. Try asking about:\n• Sending money globally\n• Adding funds to your account\n• Withdrawing to banks or wallets\n• Currency exchange\n• MetaMask wallet connection\n• Transaction fees\n\nWhat interests you most?",
    "💡 I might not have caught that exactly! But I'm here to help with anything RemittancePay related. You could ask about sending money, adding funds, withdrawals, currencies, MetaMask, fees, or transactions. What would you like to explore?",
    "💡 Let me help you better! I can explain sending money, deposits, withdrawals, currency exchange, MetaMask setup, transaction history, fees, security, or anything about the platform. What specific thing do you want to know?"
  ]
  const fallbackContent = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]

  return {
    content: fallbackContent,
    followUps: ["How do I send money?", "What currencies are supported?"],
    emoji: "💡"
  }
}

// ============================================================================
// Get Relevant Follow-ups: Selects exactly 2 most relevant prompts based on user query
// ============================================================================
function getRelevantFollowUps(entry: ChatKnowledgeEntry, normalized: string, score: number): string[] {
  const allFollowUps = entry.followUps || []

  // Always return exactly 2 prompts
  if (allFollowUps.length <= 2) {
    return allFollowUps.length === 1 ? [...allFollowUps, "How can I help more?"] : allFollowUps
  }

  // Score follow-ups based on relevance to user query
  const scored = allFollowUps.map(followUp => {
    const followUpLower = followUp.toLowerCase()
    let relevance = 0

    // Check if follow-up contains keywords from user query
    const userWords = normalized.split(/\s+/).filter(w => w.length > 3)
    userWords.forEach(word => {
      if (followUpLower.includes(word)) relevance += 5
    })

    // Boost common action words
    if (followUpLower.includes("how")) relevance += 3
    if (followUpLower.includes("what")) relevance += 2

    return { followUp, relevance }
  })

  // Sort by relevance and take exactly top 2
  scored.sort((a, b) => b.relevance - a.relevance)
  const selected = scored.slice(0, 2).map(item => item.followUp)

  // Ensure we always return exactly 2
  if (selected.length < 2 && allFollowUps.length > 0) {
    // Fill with additional follow-ups if needed
    const remaining = allFollowUps.filter(f => !selected.includes(f))
    while (selected.length < 2 && remaining.length > 0) {
      selected.push(remaining.shift()!)
    }
  }

  return selected.slice(0, 2)
}

export { knowledgeBase }


