# Backend Wallet Logic (`api/wallet/...`)

**Files:**
- `api/wallet/connect/route.ts`
- `api/wallet/remove/route.ts`

---

## 📖 The Story: How it Works (Non-Technical)

Think of this as **The Office Manager**.

- **Goal:** We need to keep a clean record of who owns which wallet.
- **Why?** The blockchain is anonymous. It just sees numbers (`0x123...`). But RemittancePay knows you are "John Doe". This Manager links "John Doe" to "0x123...".

### 🖼️ Visual Flow: The Manager's Job

### 🖼️ Visual Flow: The Manager's Job

```mermaid
flowchart TD
    %% Roles
    Frontend[User Request\n(Via API)]
    Manager{Office Manager\nBackend Logic}
    DB[(Database)]

    %% Connect Flow
    Frontend -- "Connect Wallet 0x123" --> Manager
    Manager -- 1. Authentication --> AuthCheck{Is Token Valid?}
    
    AuthCheck -- No --> Error1[❌ Return 401 Unauthorized]
    
    AuthCheck -- Yes --> WalletCheck{Wallet History?}
    
    WalletCheck -- "New Wallet" --> NewSetup[Create New Record]
    WalletCheck -- "Old Wallet" --> Reactivate[Mark as Active]
    
    NewSetup --> DeactivateOthers[Mark all other wallets\nas Inactive]
    Reactivate --> DeactivateOthers
    
    DeactivateOthers --> UpdateDB[Save to Database:\nUser.wallet = 0x123]
    UpdateDB --> Success[✅ Return Success]

    %% Styles
    style Frontend fill:#ccf,stroke:#333
    style Manager fill:#f9f,stroke:#333
    style AuthCheck fill:#ff9,stroke:#333
    style WalletCheck fill:#ff9,stroke:#333
    style UpdateDB fill:#bfb,stroke:#333
    style Error1 fill:#fbb,stroke:#333
```

### Scene 1: Connecting (The Registry)
You connect your wallet on the website.
- **Frontend (The Translator):** "Hey Office Manager, User John just connected wallet `0x123`."
- **Manager:** "Let me check my files."
- **Manager:** "Okay, I've stapled `0x123` to John's folder. From now on, `0x123` = John."

### Scene 2: Changing Wallets (The Reassignment)
You switch from your laptop wallet to your phone wallet (`0x456`).
- **Manager:** "Wait, John already has a wallet (`0x123`)."
- **Manager:** "Okay, I will mark `0x123` as **Inactive** and mark `0x456` as **Active**. John can only use one at a time."

### Scene 3: Removing Wallet (The Security Check)
You want to remove your wallet permanently.
- **Manager:** "Are you sure? This is a serious action."
- **Manager:** "If you set a security password, tell me it now."
- **You:** "Pass123"
- **Manager:** "Correct. I have shredded the link. `0x456` is no longer John's wallet."

<div style="page-break-after: always;"></div>

---

## ⚙️ The Code: How the Machine Thinks (Technical)

### 1. Connecting Logic

```typescript
// api/wallet/connect/route.ts (Simplified)

const connect = async (req) => {
    // 1. Who is asking?
    const user = getUserFromToken(req);

    // 2. What wallet?
    const walletAddress = req.body.address;

    // 3. One Active Wallet Policy
    user.wallets.forEach(w => w.status = 'inactive'); 
    // "Turn off all old wallets"

    // 4. Create New Link
    user.wallets.push({
        address: walletAddress,
        status: 'active',
        connectedAt: Date.now()
    });

    // 5. Save
    db.save(user);
}
```

### 2. Removal Logic

```typescript
// api/wallet/remove/route.ts (Simplified)

const remove = async (req) => {
    // 1. Valid Password?
    if (user.hasSecurityPassword) {
        if (req.body.password !== user.password) {
            throw new Error("Wrong password!"); // "Stop right there!"
        }
    }

    // 2. Unlink
    user.walletAddress = null; 
    
    // 3. Save
    db.save(user);
}
```
**Analogy**: The "One Active Wallet" rule prevents confusion. If you lose your laptop (Wallet A), you just connect your phone (Wallet B), and the Manager automatically deactivates the lost laptop wallet.

<div style="page-break-after: always;"></div>

---

## 📚 Beginner's Glossary

| Word | Simple Meaning |
|---|---|
| **Office Manager** | The server-side code that keeps everything organized (The Backend). |
| **Token** | A digital badge proving you are logged in as "John Doe" (JWT). |
| **Active Wallet** | The specific wallet currently linked to your profile. |
| **Link** | Connecting an anonymous wallet address to a real user account. |
