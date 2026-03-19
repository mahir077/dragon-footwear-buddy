import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

interface JournalLine {
  account_id: string;
  debit: number;
  credit: number;
  note?: string;
}

interface CreateJournalParams {
  date: string;
  narration: string;
  sourceModule: string;
  sourceId: string;
  yearId?: string | null;
  lines: JournalLine[];
}

// =============================================
// CHART OF ACCOUNTS CODES (from seed data)
// =============================================
// 1101 — হাতে নগদ (Cash in Hand)
// 1102 — ব্যাংক ব্যালেন্স (Bank Balance)
// 1104 — পার্টি পাওনা (Party Receivable)
// 1105 — সরবরাহকারী অগ্রিম (Supplier Advance)
// 1106 — কাঁচামাল স্টক (Raw Material Stock)
// 1107 — তৈরি পণ্য স্টক (Finished Goods Stock)
// 1201 — মেশিনারি (Machinery)
// 1202 — আসবাবপত্র (Furniture)
// 1203 — অবচয় সঞ্চিতি (Accumulated Depreciation)
// 2101 — সরবরাহকারী বাকি (Supplier Payable)
// 2102 — পার্টি অগ্রিম (Party Advance Received)
// 2103 — কমিশন বাকি (Commission Payable)
// 2201 — ব্যাংক লোন (Bank Loan)
// 2202 — সুদি লোন (Interest Loan)
// 2203 — হাওলাদ (Temporary Loan)
// 3001 — মালিকের মূলধন (Owner Capital)
// 4001 — জুতা বিক্রয় (Shoe Sales)
// 4002 — বর্জ্য বিক্রয় (Waste Sale)
// 4003 — ভাড়া আয় (Rent Income)
// 4004 — অন্যান্য আয় (Other Income)
// 5001 — COGS
// 5002 — কাঁচামাল ব্যয় (Raw Material Cost)
// 5003 — বেতন ও মজুরি (Salary)
// 5004 — কমিশন ব্যয় (Commission Expense)
// 5005 — ভাড়া ব্যয় (Rent Expense)
// 5006 — লোনের সুদ (Loan Interest)
// 5007 — অবচয় (Depreciation)
// 5008 — রক্ষণাবেক্ষণ (Maintenance)
// 5009 — বীমা / PF
// 5010 — অন্যান্য ব্যয় (Other Expense)

export const getAccountId = async (code: string): Promise<string | null> => {
  const { data } = await db.from("chart_of_accounts").select("id").eq("code", code).single();
  return data?.id || null;
};

const accountCache: Record<string, string> = {};

export const getAccountIdCached = async (code: string): Promise<string | null> => {
  if (accountCache[code]) return accountCache[code];
  const id = await getAccountId(code);
  if (id) accountCache[code] = id;
  return id;
};

// ✅ Main auto journal — duplicate prevention + error propagation
export const createAutoJournal = async (params: CreateJournalParams): Promise<{ success: boolean; id: string | null; error?: string }> => {
  try {
    // আগের journal entry থাকলে delete করো
    const { data: existing } = await db
      .from("journal_entries")
      .select("id")
      .eq("source_module", params.sourceModule)
      .eq("source_id", params.sourceId)
      .maybeSingle();

    if (existing?.id) {
      await db.from("journal_lines").delete().eq("journal_entry_id", existing.id);
      await db.from("journal_entries").delete().eq("id", existing.id);
    }

    const { data, error } = await db.rpc("create_journal_entry", {
      p_date: params.date,
      p_narration: params.narration,
      p_source_module: params.sourceModule,
      p_source_id: params.sourceId,
      p_year_id: params.yearId || null,
      p_lines: params.lines,
    });

    if (error) {
      console.error("Auto journal error:", error);
      return { success: false, id: null, error: error.message };
    }

    return { success: true, id: data };
  } catch (e: any) {
    console.error("Auto journal exception:", e);
    return { success: false, id: null, error: e.message };
  }
};

// =============================================
// MODULE-SPECIFIC JOURNAL HELPERS
// =============================================

// 1. SALES — Cash Sale
export const journalCashSale = async (
  saleId: string, date: string, amount: number, yearId?: string | null
) => {
  const [cashId, salesId, cogsId, stockId] = await Promise.all([
    getAccountIdCached("1101"), getAccountIdCached("4001"),
    getAccountIdCached("5001"), getAccountIdCached("1107"),
  ]);
  if (!cashId || !salesId) return { success: false, error: "Account not found" };
  const lines: JournalLine[] = [
    { account_id: cashId, debit: amount, credit: 0, note: "নগদ বিক্রয়" },
    { account_id: salesId, debit: 0, credit: amount, note: "বিক্রয় আয়" },
  ];
  if (cogsId && stockId) {
    lines.push(
      { account_id: cogsId, debit: amount, credit: 0, note: "COGS" },
      { account_id: stockId, debit: 0, credit: amount, note: "স্টক কমেছে" },
    );
  }
  return await createAutoJournal({ date, narration: `নগদ বিক্রয় — ৳${amount}`, sourceModule: "sales", sourceId: saleId, yearId, lines });
};

// 2. SALES — Credit Sale
export const journalCreditSale = async (
  saleId: string, date: string, amount: number, yearId?: string | null
) => {
  const [receivableId, salesId] = await Promise.all([
    getAccountIdCached("1104"), getAccountIdCached("4001"),
  ]);
  if (!receivableId || !salesId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `বাকি বিক্রয় — ৳${amount}`, sourceModule: "sales", sourceId: saleId, yearId,
    lines: [
      { account_id: receivableId, debit: amount, credit: 0, note: "পার্টি পাওনা" },
      { account_id: salesId, debit: 0, credit: amount, note: "বিক্রয় আয়" },
    ],
  });
};

// 3. PURCHASE — Cash Purchase
export const journalCashPurchase = async (
  purchaseId: string, date: string, amount: number, yearId?: string | null
) => {
  const [rawMatId, cashId] = await Promise.all([
    getAccountIdCached("1106"), getAccountIdCached("1101"),
  ]);
  if (!rawMatId || !cashId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `নগদ ক্রয় — ৳${amount}`, sourceModule: "purchase", sourceId: purchaseId, yearId,
    lines: [
      { account_id: rawMatId, debit: amount, credit: 0, note: "কাঁচামাল" },
      { account_id: cashId, debit: 0, credit: amount, note: "নগদ" },
    ],
  });
};

// 4. PURCHASE — Credit Purchase
export const journalCreditPurchase = async (
  purchaseId: string, date: string, amount: number, yearId?: string | null
) => {
  const [rawMatId, payableId] = await Promise.all([
    getAccountIdCached("1106"), getAccountIdCached("2101"),
  ]);
  if (!rawMatId || !payableId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `বাকি ক্রয় — ৳${amount}`, sourceModule: "purchase", sourceId: purchaseId, yearId,
    lines: [
      { account_id: rawMatId, debit: amount, credit: 0, note: "কাঁচামাল" },
      { account_id: payableId, debit: 0, credit: amount, note: "সরবরাহকারী বাকি" },
    ],
  });
};

// 5. KHATA — Income
export const journalIncome = async (
  txId: string, date: string, amount: number, yearId?: string | null
) => {
  const [cashId, incomeId] = await Promise.all([
    getAccountIdCached("1101"), getAccountIdCached("4004"),
  ]);
  if (!cashId || !incomeId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `আয় — ৳${amount}`, sourceModule: "khata", sourceId: txId, yearId,
    lines: [
      { account_id: cashId, debit: amount, credit: 0 },
      { account_id: incomeId, debit: 0, credit: amount },
    ],
  });
};

// 6. KHATA — Expense
export const journalExpense = async (
  txId: string, date: string, amount: number, yearId?: string | null
) => {
  const [expenseId, cashId] = await Promise.all([
    getAccountIdCached("5010"), getAccountIdCached("1101"),
  ]);
  if (!expenseId || !cashId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `ব্যয় — ৳${amount}`, sourceModule: "khata", sourceId: txId, yearId,
    lines: [
      { account_id: expenseId, debit: amount, credit: 0 },
      { account_id: cashId, debit: 0, credit: amount },
    ],
  });
};

// 7. SALARY
export const journalSalary = async (
  salaryId: string, date: string, amount: number, yearId?: string | null
) => {
  const [salaryExpId, cashId] = await Promise.all([
    getAccountIdCached("5003"), getAccountIdCached("1101"),
  ]);
  if (!salaryExpId || !cashId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `বেতন পরিশোধ — ৳${amount}`, sourceModule: "salary", sourceId: salaryId, yearId,
    lines: [
      { account_id: salaryExpId, debit: amount, credit: 0 },
      { account_id: cashId, debit: 0, credit: amount },
    ],
  });
};

// 8. LOAN — Received
export const journalLoanReceived = async (
  loanId: string, date: string, amount: number, loanType: string, yearId?: string | null
) => {
  const loanCode = loanType === "bank" ? "2201" : loanType === "interest" ? "2202" : "2203";
  const [cashId, loanAccId] = await Promise.all([
    getAccountIdCached("1101"), getAccountIdCached(loanCode),
  ]);
  if (!cashId || !loanAccId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `লোন গ্রহণ — ৳${amount}`, sourceModule: "loan", sourceId: loanId, yearId,
    lines: [
      { account_id: cashId, debit: amount, credit: 0 },
      { account_id: loanAccId, debit: 0, credit: amount },
    ],
  });
};

// 9. RENT — Payment
export const journalRentPayment = async (
  rentId: string, date: string, amount: number, yearId?: string | null
) => {
  const [rentExpId, cashId] = await Promise.all([
    getAccountIdCached("5005"), getAccountIdCached("1101"),
  ]);
  if (!rentExpId || !cashId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `ভাড়া পরিশোধ — ৳${amount}`, sourceModule: "rent", sourceId: rentId, yearId,
    lines: [
      { account_id: rentExpId, debit: amount, credit: 0 },
      { account_id: cashId, debit: 0, credit: amount },
    ],
  });
};

// 10. WASTE SALE
export const journalWasteSale = async (
  wasteId: string, date: string, amount: number, yearId?: string | null
) => {
  const [cashId, wasteIncomeId] = await Promise.all([
    getAccountIdCached("1101"), getAccountIdCached("4002"),
  ]);
  if (!cashId || !wasteIncomeId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `বর্জ্য বিক্রয় — ৳${amount}`, sourceModule: "waste", sourceId: wasteId, yearId,
    lines: [
      { account_id: cashId, debit: amount, credit: 0 },
      { account_id: wasteIncomeId, debit: 0, credit: amount },
    ],
  });
};

// 11. COMMISSION — Accrual
export const journalCommissionAccrual = async (
  ledgerId: string, date: string, amount: number, yearId?: string | null
) => {
  const [commExpId, commPayId] = await Promise.all([
    getAccountIdCached("5004"), getAccountIdCached("2103"),
  ]);
  if (!commExpId || !commPayId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `কমিশন ব্যয় — ৳${amount}`, sourceModule: "commission", sourceId: ledgerId, yearId,
    lines: [
      { account_id: commExpId, debit: amount, credit: 0 },
      { account_id: commPayId, debit: 0, credit: amount },
    ],
  });
};

// 12. COMMISSION — Payment
export const journalCommissionPayment = async (
  ledgerId: string, date: string, amount: number, yearId?: string | null
) => {
  const [commPayId, cashId] = await Promise.all([
    getAccountIdCached("2103"), getAccountIdCached("1101"),
  ]);
  if (!commPayId || !cashId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `কমিশন পরিশোধ — ৳${amount}`, sourceModule: "commission", sourceId: ledgerId, yearId,
    lines: [
      { account_id: commPayId, debit: amount, credit: 0 },
      { account_id: cashId, debit: 0, credit: amount },
    ],
  });
};

// 13. CAPITAL — Deposit
export const journalCapitalDeposit = async (
  stmtId: string, date: string, amount: number, yearId?: string | null
) => {
  const [cashId, capitalId] = await Promise.all([
    getAccountIdCached("1101"), getAccountIdCached("3001"),
  ]);
  if (!cashId || !capitalId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `মূলধন জমা — ৳${amount}`, sourceModule: "capital", sourceId: stmtId, yearId,
    lines: [
      { account_id: cashId, debit: amount, credit: 0 },
      { account_id: capitalId, debit: 0, credit: amount },
    ],
  });
};

// 14. CAPITAL — Withdrawal
export const journalCapitalWithdrawal = async (
  stmtId: string, date: string, amount: number, yearId?: string | null
) => {
  const [capitalId, cashId] = await Promise.all([
    getAccountIdCached("3001"), getAccountIdCached("1101"),
  ]);
  if (!capitalId || !cashId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `মূলধন উত্তোলন — ৳${amount}`, sourceModule: "capital", sourceId: stmtId, yearId,
    lines: [
      { account_id: capitalId, debit: amount, credit: 0 },
      { account_id: cashId, debit: 0, credit: amount },
    ],
  });
};

// 15. INSURANCE — Deposit
export const journalInsuranceDeposit = async (
  ledgerId: string, date: string, amount: number, yearId?: string | null
) => {
  const [insuranceExpId, cashId] = await Promise.all([
    getAccountIdCached("5009"), getAccountIdCached("1101"),
  ]);
  if (!insuranceExpId || !cashId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `বীমা/PF জমা — ৳${amount}`, sourceModule: "insurance", sourceId: ledgerId, yearId,
    lines: [
      { account_id: insuranceExpId, debit: amount, credit: 0 },
      { account_id: cashId, debit: 0, credit: amount },
    ],
  });
};

// 16. BANK — Deposit
export const journalBankDeposit = async (
  txId: string, date: string, amount: number, yearId?: string | null
) => {
  const [bankId, cashId] = await Promise.all([
    getAccountIdCached("1102"), getAccountIdCached("1101"),
  ]);
  if (!bankId || !cashId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `ব্যাংকে জমা — ৳${amount}`, sourceModule: "khata", sourceId: txId, yearId,
    lines: [
      { account_id: bankId, debit: amount, credit: 0 },
      { account_id: cashId, debit: 0, credit: amount },
    ],
  });
};

// 17. BANK — Withdrawal
export const journalBankWithdrawal = async (
  txId: string, date: string, amount: number, yearId?: string | null
) => {
  const [cashId, bankId] = await Promise.all([
    getAccountIdCached("1101"), getAccountIdCached("1102"),
  ]);
  if (!cashId || !bankId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `ব্যাংক থেকে তুললাম — ৳${amount}`, sourceModule: "khata", sourceId: txId, yearId,
    lines: [
      { account_id: cashId, debit: amount, credit: 0 },
      { account_id: bankId, debit: 0, credit: amount },
    ],
  });
};

// 18. ASSET — Purchase
export const journalAssetPurchase = async (
  assetId: string, date: string, amount: number, assetType: string, yearId?: string | null
) => {
  const assetCode = assetType === "machinery" ? "1201" : "1202";
  const [assetAccId, cashId] = await Promise.all([
    getAccountIdCached(assetCode), getAccountIdCached("1101"),
  ]);
  if (!assetAccId || !cashId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `সম্পদ ক্রয় — ৳${amount}`, sourceModule: "asset", sourceId: assetId, yearId,
    lines: [
      { account_id: assetAccId, debit: amount, credit: 0 },
      { account_id: cashId, debit: 0, credit: amount },
    ],
  });
};

// 19. ASSET — Depreciation
export const journalDepreciation = async (
  assetId: string, date: string, amount: number, yearId?: string | null
) => {
  const [deprExpId, accumDeprId] = await Promise.all([
    getAccountIdCached("5007"), getAccountIdCached("1203"),
  ]);
  if (!deprExpId || !accumDeprId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `অবচয় — ৳${amount}`, sourceModule: "asset", sourceId: assetId, yearId,
    lines: [
      { account_id: deprExpId, debit: amount, credit: 0 },
      { account_id: accumDeprId, debit: 0, credit: amount },
    ],
  });
};
// 20. ASSET — Disposal (বিক্রি)
export const journalAssetDisposal = async (
  assetId: string, date: string, saleAmount: number, bookValue: number, yearId?: string | null
) => {
  const [cashId, assetAccId, accumDeprId, gainId, lossId] = await Promise.all([
    getAccountIdCached("1101"),
    getAccountIdCached("1201"),
    getAccountIdCached("1203"),
    getAccountIdCached("4004"), // gain → other income
    getAccountIdCached("5010"), // loss → other expense
  ]);
  if (!cashId || !assetAccId) return { success: false, error: "Account not found" };

  const gainOrLoss = saleAmount - bookValue;
  const lines: JournalLine[] = [
    { account_id: cashId, debit: saleAmount, credit: 0, note: "সম্পদ বিক্রয়" },
    { account_id: assetAccId, debit: 0, credit: bookValue, note: "সম্পদ বাদ" },
  ];
  if (gainOrLoss > 0 && gainId) {
    lines.push({ account_id: gainId, debit: 0, credit: gainOrLoss, note: "বিক্রয় লাভ" });
  } else if (gainOrLoss < 0 && lossId) {
    lines.push({ account_id: lossId, debit: Math.abs(gainOrLoss), credit: 0, note: "বিক্রয় ক্ষতি" });
  }

  return await createAutoJournal({
    date, narration: `সম্পদ বিক্রয় — ৳${saleAmount}`,
    sourceModule: "asset", sourceId: assetId, yearId, lines,
  });
};
// 21. LOAN — Interest Accrual
export const journalLoanInterest = async (
  txId: string, date: string, amount: number, yearId?: string | null
) => {
  const [interestExpId, cashId] = await Promise.all([
    getAccountIdCached("5006"), // লোনের সুদ
    getAccountIdCached("1101"),
  ]);
  if (!interestExpId || !cashId) return { success: false, error: "Account not found" };
  return await createAutoJournal({
    date, narration: `লোনের সুদ — ৳${amount}`, sourceModule: "loan", sourceId: txId, yearId,
    lines: [
      { account_id: interestExpId, debit: amount, credit: 0, note: "সুদ ব্যয়" },
      { account_id: cashId, debit: 0, credit: amount, note: "নগদ" },
    ],
  });
};