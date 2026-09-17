#!/usr/bin/env node

/**
 * Generate Database View Script
 * Automatically creates/updates DATABASE_VIEW.md with current database contents
 */

const fs = require('fs')
const path = require('path')

// File paths
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')
const TRANSACTIONS_FILE = path.join(process.cwd(), 'data', 'transactions.json')
const OUTPUT_FILE = path.join(process.cwd(), 'DATABASE_VIEW.md')

// Read JSON data
function readJSONFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(data)
    }
    return null
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message)
    return null
  }
}

// Format date from timestamp
function formatDate(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Format currency with symbol
function formatCurrency(currency, amount) {
  const symbols = {
    USD: '$',
    BDT: '৳',
    BTC: '₿',
    ETH: 'Ξ',
    USDT: '$',
    EUR: '€',
    GBP: '£'
  }
  const symbol = symbols[currency] || currency
  return `${symbol}${amount.toFixed(currency === 'BTC' || currency === 'ETH' ? 6 : 2)}`
}

// Generate user section
function generateUserSection(users) {
  if (!users || Object.keys(users).length === 0) {
    return '### No Users Found\n\n_No user data available._\n\n'
  }

  let output = ''
  
  for (const [userId, user] of Object.entries(users)) {
    output += `### User ${userId}\n\n`
    output += '| Field | Value |\n'
    output += '|-------|-------|\n'
    output += `| **User ID** | ${user.id} |\n`
    output += `| **Email** | ${user.email} |\n`
    output += `| **Full Name** | ${user.fullName} |\n`
    output += `| **Phone** | ${user.phone || '(Not provided)'} |\n`
    output += `| **Password** | \`***HASHED***\` (bcrypt: salt:hash) |\n`
    output += `| **Wallet Address** | ${user.walletAddress || '(Not connected)'} |\n\n`

    // Currency balances
    output += '#### Currency Balances\n\n'
    output += '| Currency | Balance |\n'
    output += '|----------|----------|\n'
    
    if (user.balances) {
      for (const [currency, amount] of Object.entries(user.balances)) {
        output += `| ${currency} | ${formatCurrency(currency, amount)} |\n`
      }
    }
    
    if (user.realEthBalance !== undefined) {
      output += `| **Real ETH Balance** | Ξ${user.realEthBalance.toFixed(6)} |\n`
    }
    
    output += '\n'

    // Profile information
    output += '#### Profile Information\n\n'
    output += '| Field | Value |\n'
    output += '|-------|-------|\n'
    output += `| NID | ${user.nid || '(Empty)'} |\n`
    output += `| Address | ${user.address || '(Empty)'} |\n`
    output += `| Date of Birth | ${user.dateOfBirth || '(Empty)'} |\n`
    output += `| Profile Photo | ${user.profilePhoto ? 'Base64 Image Data Present' : '(Not set)'} |\n\n`
  }

  return output
}

// Generate transaction section
function generateTransactionSection(transactions, users) {
  if (!transactions || transactions.length === 0) {
    return '### No Transactions Found\n\n_No transaction data available._\n\n'
  }

  let output = '### All Transactions\n\n'
  output += '| TX ID | From User | To Address | Amount | Gas Fee | Currency | Description | Status | Date |\n'
  output += '|-------|-----------|------------|--------|---------|----------|-------------|--------|------|\n'
  
  // Sort transactions by timestamp (newest first)
  const sortedTx = [...transactions].sort((a, b) => b.timestamp - a.timestamp)
  
  for (const tx of sortedTx) {
    const user = users?.[tx.fromUserId]
    const userName = user ? user.fullName : tx.fromUserId
    const shortAddress = tx.toAddress.slice(0, 10) + '...' + tx.toAddress.slice(-8)
    const formattedDate = formatDate(tx.timestamp)
    
    output += `| ${tx.id} | ${tx.fromUserId} | ${shortAddress} | ${tx.amount.toFixed(2)} | ${tx.gasFee.toFixed(6)} | ${tx.currency} | ${tx.description || '(Empty)'} | ${tx.status} | ${formattedDate} |\n`
  }
  
  output += '\n'
  return output
}

// Generate summary section
function generateSummarySection(transactions) {
  if (!transactions || transactions.length === 0) {
    return ''
  }

  let output = '## Transaction Summary\n\n'
  output += '### By Type\n'
  output += `- **Total Transactions**: ${transactions.length}\n`
  
  const statusCount = transactions.reduce((acc, tx) => {
    acc[tx.status] = (acc[tx.status] || 0) + 1
    return acc
  }, {})
  
  output += `- **Completed**: ${statusCount.completed || 0}\n`
  output += `- **Pending**: ${statusCount.pending || 0}\n`
  output += `- **Failed**: ${statusCount.failed || 0}\n\n`

  // By currency
  output += '### By Currency\n'
  const ethTxs = transactions.filter(tx => tx.currency === 'ETH')
  const totalEth = ethTxs.reduce((sum, tx) => sum + tx.amount, 0)
  const totalGas = ethTxs.reduce((sum, tx) => sum + tx.gasFee, 0)
  
  output += `- **ETH Transactions**: ${ethTxs.length}\n`
  output += `- **Total ETH Sent**: ${totalEth.toFixed(2)} ETH\n`
  output += `- **Total Gas Fees**: ${totalGas.toFixed(2)} ETH\n\n`

  // By status table
  output += '### By Status\n'
  output += '| Status | Count | Percentage |\n'
  output += '|--------|-------|------------|\n'
  
  for (const [status, count] of Object.entries(statusCount)) {
    const percentage = ((count / transactions.length) * 100).toFixed(0)
    output += `| ${status} | ${count} | ${percentage}% |\n`
  }
  
  output += '\n'
  return output
}

// Generate recent activity
function generateRecentActivity(transactions) {
  if (!transactions || transactions.length === 0) {
    return ''
  }

  const sortedTx = [...transactions].sort((a, b) => b.timestamp - a.timestamp)
  const latest = sortedTx[0]

  let output = '## Recent Activity\n\n'
  output += '### Latest Transaction\n'
  output += `**${latest.id}**\n`
  output += `- **Date**: ${formatDate(latest.timestamp)}\n`
  output += `- **Amount**: ${latest.amount.toFixed(6)} ${latest.currency}\n`
  output += `- **Gas Fee**: ${latest.gasFee.toFixed(6)} ${latest.currency}\n`
  output += `- **To**: ${latest.toAddress.slice(0, 10)}...${latest.toAddress.slice(-8)}\n`
  output += `- **Total Cost**: ${(latest.amount + latest.gasFee).toFixed(6)} ${latest.currency}\n\n`

  output += '### Transaction Timeline\n'
  sortedTx.forEach((tx, idx) => {
    output += `${idx + 1}. **${formatDate(tx.timestamp)}** - Sent ${tx.amount.toFixed(2)} ${tx.currency} (${tx.id})\n`
  })
  
  output += '\n'
  return output
}

// Generate financial summary
function generateFinancialSummary(users, transactions) {
  let output = '## Financial Summary\n\n'
  output += '### Current Holdings\n'
  
  if (users && Object.keys(users).length > 0) {
    const user = Object.values(users)[0]
    if (user.balances) {
      output += `- **Total USD Value**: ~${formatCurrency('USD', user.balances.USD)}\n`
      output += `- **Total BDT Value**: ${formatCurrency('BDT', user.balances.BDT)}\n`
      output += `- **Cryptocurrency Holdings**: ${user.balances.ETH.toFixed(2)} ETH, ${user.balances.BTC.toFixed(6)} BTC\n`
      output += `- **Fiat Holdings**: ${formatCurrency('USD', user.balances.USD)} USD, ${formatCurrency('EUR', user.balances.EUR)} EUR, ${formatCurrency('GBP', user.balances.GBP)} GBP\n`
    }
  }
  
  if (transactions && transactions.length > 0) {
    output += '\n### Transaction History Value\n'
    const ethTxs = transactions.filter(tx => tx.currency === 'ETH')
    const totalEth = ethTxs.reduce((sum, tx) => sum + tx.amount, 0)
    const totalGas = ethTxs.reduce((sum, tx) => sum + tx.gasFee, 0)
    const avgSize = totalEth / ethTxs.length
    const avgGas = totalGas / ethTxs.length
    
    output += `- **Total Amount Sent**: ${totalEth.toFixed(2)} ETH\n`
    output += `- **Total Gas Fees Paid**: ${totalGas.toFixed(2)} ETH\n`
    output += `- **Average Transaction Size**: ${avgSize.toFixed(2)} ETH\n`
    output += `- **Average Gas Fee**: ${avgGas.toFixed(2)} ETH\n`
  }
  
  output += '\n'
  return output
}

// Main function
function generateDatabaseView() {
  console.log('Reading database files...')
  
  const users = readJSONFile(USERS_FILE)
  const transactions = readJSONFile(TRANSACTIONS_FILE)

  if (!users && !transactions) {
    console.error('No database files found!')
    process.exit(1)
  }

  console.log('Generating database view...')

  let content = '# RemittancePay Database View\n\n'
  content += `**Last Updated**: ${new Date().toLocaleString()}\n\n`
  content += '> **🔄 Auto-Update**: Run `npm run db:view` or `node scripts/generate-database-view.js` to regenerate this file\n'
  content += '> \n'
  content += '> **Note**: This file provides a human-readable view of the database. For actual data storage, see `data/users.json` and `data/transactions.json`\n\n'
  content += '---\n\n'

  // User database
  content += '## User Database\n\n'
  content += generateUserSection(users)

  // Transaction history
  content += '---\n\n## Transaction History\n\n'
  content += generateTransactionSection(transactions, users)

  // Summary
  content += '---\n\n'
  content += generateSummarySection(transactions)

  // Recent activity
  content += '---\n\n'
  content += generateRecentActivity(transactions)

  // Financial summary
  content += '---\n\n'
  content += generateFinancialSummary(users, transactions)

  // System information
  content += '---\n\n## System Information\n\n'
  content += '### Database Files\n'
  content += '- **Users**: `data/users.json`\n'
  content += '- **Transactions**: `data/transactions.json`\n'
  content += '- **View File**: `DATABASE_VIEW.md` (this file)\n\n'

  content += '### ID Generation\n'
  if (users) {
    const maxUserId = Math.max(...Object.keys(users).map(id => parseInt(id.replace('RPAY', '')) || 0))
    content += `- **Next User ID**: RPAY${(maxUserId + 1).toString().padStart(3, '0')}\n`
  }
  if (transactions) {
    const maxTxId = Math.max(...transactions.map(tx => parseInt(tx.id.replace('TX11RPAY', '')) || 0))
    content += `- **Next Transaction ID**: TX11RPAY${(maxTxId + 1).toString().padStart(2, '0')}\n`
  }
  content += '\n'

  content += '### Storage Type\n'
  content += '- **Server**: File-based JSON storage\n'
  content += '- **Client**: Browser localStorage\n'
  content += '- **Auto-switch**: Yes (based on environment)\n\n'

  // Security notes
  content += '---\n\n## Security Notes\n\n'
  content += '⚠️ **Password Security**\n'
  content += '- All passwords are hashed using bcrypt\n'
  content += '- Format: `salt:hash`\n'
  content += '- Example: `eec8deacc65e2bfa515fa033bc2e2b7d:eaf11a7ee516a91ed80f7d1fe5e85a660941076466e58259bfdda6250e8165e0`\n'
  content += '- **Never** store passwords in plain text\n\n'
  
  content += '⚠️ **Wallet Security**\n'
  content += '- Wallet addresses are public blockchain addresses\n'
  content += '- Never share private keys\n'
  content += '- Always verify recipient addresses before transactions\n\n'

  // Update instructions
  content += '---\n\n## Update Instructions\n\n'
  content += 'This file is a **snapshot** of the database. To update this view:\n\n'
  content += '1. View current data in:\n'
  content += '   - `data/users.json` (for user information)\n'
  content += '   - `data/transactions.json` (for transaction history)\n\n'
  content += '2. For automated updates, run:\n'
  content += '   ```bash\n'
  content += '   node scripts/generate-database-view.js\n'
  content += '   ```\n\n'
  content += '3. This document provides a human-readable summary and may not reflect real-time changes without regeneration.\n\n'
  content += '---\n\n'
  content += `**Generated**: ${new Date().toLocaleString()} by generate-database-view.js\n`

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, content, 'utf-8')
  
  console.log('✅ Database view generated successfully!')
  console.log(`📄 Output: ${OUTPUT_FILE}`)
  console.log(`👤 Users: ${users ? Object.keys(users).length : 0}`)
  console.log(`💸 Transactions: ${transactions ? transactions.length : 0}`)
}

// Run if called directly
if (require.main === module) {
  generateDatabaseView()
}

module.exports = { generateDatabaseView }
