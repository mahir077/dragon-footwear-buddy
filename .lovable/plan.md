

# Dragon Footwear ERP — App Shell

## Overview
A bilingual (Bengali + English) business management system for Dragon Footwear, designed for non-technical users with large text, big buttons, and mobile-first responsive design.

## Design System
- **Colors**: Primary navy (#1B3A5C), success green (#16A34A), danger red (#DC2626), plus teal, purple, orange for stat cards
- **Font**: Noto Sans Bengali (loaded via Google Fonts), minimum 16px everywhere
- **Bilingual labels**: Bengali text large, English subtitle small below
- **Large touch targets**: Big buttons, big inputs, generous spacing

## Pages & Components

### 1. Login Page
- Company header: **ড্রাগন পিউ ফুটওয়্যার** (Dragon Pew Footwear) with logo area
- Simple phone/username + password form with large inputs
- Big login button in primary navy
- Bilingual labels on all fields

### 2. App Layout (authenticated shell)
- **Top Header**: Company name left, today's date in Bengali (e.g., ৮ মার্চ ২০২৬), logout button right
- **Left Sidebar** (desktop): All 16 menu items with Lucide icons, Bengali label large + English small
  - ড্যাশবোর্ড (Dashboard), সেটআপ (Setup), আর্থিক বছর (Fiscal Year), দৈনিক খাতা (Daily Ledger), ক্রয় (Purchase), উৎপাদন (Production), বিক্রয় (Sales), ক্যাশ/ব্যাংক/লোন (Cash/Bank/Loan), কর্মচারী (Employee), ভাড়া ও কমিশন (Rent & Commission), মূলধন ও বীমা (Capital & Insurance), বর্জ্য বিক্রি (Waste Sales), রেজিস্টার (Register), এক্সেল (Excel), সারসংক্ষেপ (Summary), ইনভয়েস (Invoice), সিস্টেম (System)
- **Bottom Navigation** (mobile): Collapses sidebar into a fixed bottom nav bar with icons + Bengali labels, scrollable horizontally for all items

### 3. Dashboard Page
- 6 large stat cards in a responsive grid (2 columns on mobile, 3 on desktop):
  - আজকের আয় / Today's Income — green background
  - আজকের ব্যয় / Today's Expense — red background
  - বাস্তব ব্যালেন্স / Actual Balance — blue background
  - নগদ / Cash — teal background
  - ব্যাংক / Bank — purple background
  - গোডাউন স্টক / Godown Stock — orange background
- Each card shows Bengali title, English subtitle, and a large number (placeholder ৳০ for now)

### 4. Placeholder Pages
- All 16 sidebar routes get simple placeholder pages with the page title, ready for future implementation

## Mobile Behavior
- Sidebar hidden on mobile, replaced with fixed bottom navigation bar
- Bottom nav shows icons with short Bengali labels, horizontally scrollable
- All content is single-column and touch-friendly on small screens

