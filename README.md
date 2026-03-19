# 🐉 ড্রাগন পিউ ফুটওয়্যার — ERP ম্যানেজমেন্ট সিস্টেম

> **Dragon Pew Footwear ERP** — A full-featured Enterprise Resource Planning system built for a Bangladeshi footwear manufacturer. Built with React, TypeScript, Supabase, and shadcn/ui.

**Live Demo:** [dragonfootwear.netlify.app](https://dragonfootwear.netlify.app)

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| State | TanStack Query (React Query) |
| Deployment | Netlify |

---

## 📦 Modules

### 🏭 Core Operations
- **বিক্রয় (Sales)** — Cash, Credit, Cut-size, Lot, Single pair, B-grade
- **ক্রয় (Purchase)** — Raw material purchase with auto journal
- **উৎপাদন (Production)** — Carton tracking with stock movements
- **গোডাউন (Godown)** — Stock management, transfer, damage tracking

### 💰 Accounting
- **Double-Entry Accounting** — Auto journal for all 22 modules
- **Trial Balance** — Monthly with Excel export
- **P&L Statement** — Gross profit + Net profit
- **Balance Sheet** — Assets, Liabilities, Capital
- **মাসিক ব্যয় (Monthly Expense)** — Year-wise breakdown

### 👥 Party & Finance
- **Party Ledger** — Running balance with Excel export
- **Loan Management** — Bank, Interest, Hawlad with interest accrual
- **FDR / Savings** tracking

### 👨‍💼 HR & Payroll
- **Attendance Grid** — Monthly grid with OT & late tracking
- **Salary Sheet** — Auto calculation with journal
- **Employee Advance** tracking

### 🏠 Rent & Commission
- Factory rent, Godown rent, Commission (accrual + payment)

### 💼 Capital & Insurance
- Capital deposit/withdrawal, Life insurance, PF, Paduka Samiti

### 🗃️ Assets
- Machinery & Furniture with depreciation and disposal journal

### 🔐 System
- **Auth** — Email/password login with Supabase Auth
- **Role-based Access** — Super Admin, Admin, User
- **Audit Log** — Real-time journal entry history
- **Entry Attachments** — File uploads per entry
- **Custom Fields** — Per-module custom data fields

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/mahir077/dragon-footwear-buddy.git

# Navigate to project directory
cd dragon-footwear-buddy

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🗄️ Database

This project uses **Supabase** (PostgreSQL) with:
- 35+ tables
- 15+ views (v_shoe_stock, v_party_balance, v_stock_valuation, etc.)
- Row Level Security (RLS) policies
- Auto journal via PostgreSQL RPC function

---

## 📊 Features Highlights

- ✅ **Bengali UI** — Full Bengali language interface
- ✅ **Auto Double-Entry Journal** — 21 journal helper functions
- ✅ **Excel Export** — TB, P&L, BS, Party Ledger, Monthly Expense
- ✅ **Dashboard** — Net Profit, Balance Sheet snapshot, Stock value
- ✅ **Role-based Routes** — Super Admin / Admin / User access control
- ✅ **Dark Mode** support
- ✅ **Responsive** — Mobile + Desktop

---

## 🏢 Built By

**Mahraat IT** — Building vertical SaaS products for Bangladesh SME market.

> "Build Smarter. Grow Faster."

- Website: [mahraat.com](https://mahraat.com)
- Developer: Mahir Sadman

---

## 📄 License

This project is proprietary software built for Dragon Pew Footwear.  
© 2026 Mahraat IT. All rights reserved.
