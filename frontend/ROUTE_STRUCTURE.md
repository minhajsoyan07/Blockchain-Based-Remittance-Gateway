# Helper: Route Structure & Navigation Map

This document maps the user-facing URLs to the source code files, making it easier to understand the project structure.

## 📂 Key Directories

| Directory | Purpose |
|---|---|
| `app/` | **Pages & Routes**. Each folder is a URL path. `page.tsx` is the UI. |
| `components/` | **Reusable UI**. `ui/` has shadcn/layout components. |
| `lib/` | **Logic & Utilities**. Database, Auth, Helpers. |
| `hooks/` | **React Hooks**. Custom state logic. |
| `public/` | **Static Assets**. Images, icons. |

---

## 🗺️ Route Map (URL → File)

### Public Pages
| URL | File Path | Description |
|---|---|---|
| `/` | `app/page.tsx` | Landing page (Redirects to dashboard if logged in) |
| `/login` | `app/login/page.tsx` | User Login screen |
| `/signup` | `app/signup/page.tsx` | User Registration screen |
| `/forgot-password` | `app/forgot-password/page.tsx` | Password recovery request |
| `/reset-password` | `app/reset-password/page.tsx` | Password reset form |
| `/verify-otp` | `app/verify-otp/page.tsx` | SMS/Email OTP verification |

### Protected Pages (Requires Auth)
| URL | File Path | Description |
|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | **Main Dashboard**. Balance, charts, quick actions. |
| `/send` | `app/send/page.tsx` | Send Money form. |
| `/add-money` | `app/add-money/page.tsx` | Deposit funds (Bank, Card, Crypto). |
| `/withdraw` | `app/withdraw/page.tsx` | Withdraw funds. |
| `/exchange` | `app/exchange/page.tsx` | Currency exchange (Swap). |
| `/transactions` | `app/transactions/page.tsx` | Transaction history list. |
| `/settings` | `app/settings/page.tsx` | User profile & app settings. |
| `/profile` | `app/profile/page.tsx` | User profile details. |
| `/analytics` | `app/analytics/page.tsx` | Spending analytics & reports. |
| `/chatbot` | `app/chatbot/page.tsx` | Full-screen AI negotiation chat. |

### API Routes (Backend)
| Endpoint | File Path | Purpose |
|---|---|---|
| `/api/auth/me` | `app/api/auth/me/route.ts` | Get current user session. |
| `/api/auth/login` | `app/api/auth/login/route.ts` | Authenticate user. |
| `/api/auth/signup` | `app/api/auth/signup/route.ts` | Register new user. |
| `/api/transactions`| `app/api/transactions/route.ts` | Fetch transaction history. |
| `/api/wallet/...` | `app/api/wallet/...` | Wallet connection & management. |

---

## 🛠️ Key Components
- **Layout**: `app/layout.tsx` (Global providers, fonts, toaster)
- **Header**: `components/olive-header.tsx` (Main navigation header)
- **Sidebar**: `components/app-menu.tsx` (Desktop sidebar navigation)
- **Auth Forms**: `components/auth/login-form.tsx`, `signup-form.tsx`
- **Database Logic**: `lib/db/` (Users, Transactions, Adapter)
