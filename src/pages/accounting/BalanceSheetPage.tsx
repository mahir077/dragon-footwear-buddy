import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

const db = supabase as any;
const months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

const BalanceSheetPage = () => {
  const now = new Date();
  const [monthFilter, setMonthFilter] = useState(String(now.getMonth() + 1));
  const [yearFilter, setYearFilter] = useState(String(now.getFullYear()));

  const startDate = `${yearFilter}-${monthFilter.padStart(2, "0")}-01`;
  const endDate = `${yearFilter}-${monthFilter.padStart(2, "0")}-31`;

  const { data: accounts = [] } = useQuery({
    queryKey: ["coa_all_bs"],
    queryFn: async () => {
      const { data } = await db.from("chart_of_accounts").select("*").eq("is_group", false).eq("is_active", true).order("code");
      return data || [];
    },
  });

  const { data: journalLines = [], isLoading } = useQuery({
    queryKey: ["bs_journal_lines", monthFilter, yearFilter],
    queryFn: async () => {
      const { data } = await db.from("journal_lines")
        .select("*, journal_entries!inner(date)")
        .gte("journal_entries.date", startDate)
        .lte("journal_entries.date", endDate);
      return data || [];
    },
  });

  const getBalance = (accountId: string, type: string) => {
    const lines = journalLines.filter((l: any) => l.account_id === accountId);
    const totalDebit = lines.reduce((sum: number, l: any) => sum + (Number(l.debit) || 0), 0);
    const totalCredit = lines.reduce((sum: number, l: any) => sum + (Number(l.credit) || 0), 0);
    if (type === "asset" || type === "expense") return totalDebit - totalCredit;
    return totalCredit - totalDebit;
  };

  const getAccountsByType = (type: string) =>
    accounts.filter((a: any) => a.account_type === type)
      .map((a: any) => ({ ...a, balance: getBalance(a.id, type) }))
      .filter((a: any) => a.balance !== 0);

  const assetAccounts = getAccountsByType("asset");
  const liabilityAccounts = getAccountsByType("liability");
  const capitalAccounts = getAccountsByType("capital");
  const incomeAccounts = getAccountsByType("income");
  const expenseAccounts = getAccountsByType("expense");

  const totalIncome = incomeAccounts.reduce((sum: number, a: any) => sum + a.balance, 0);
  const totalExpense = expenseAccounts.reduce((sum: number, a: any) => sum + a.balance, 0);
  const netProfit = totalIncome - totalExpense;

  const currentAssets = assetAccounts.filter((a: any) => a.code >= "1100" && a.code < "1200");
  const fixedAssets = assetAccounts.filter((a: any) => a.code >= "1200" && a.code < "1300");
  const currentLiabilities = liabilityAccounts.filter((a: any) => a.code >= "2100" && a.code < "2200");
  const longTermLiabilities = liabilityAccounts.filter((a: any) => a.code >= "2200" && a.code < "2300");

  const totalCurrentAssets = currentAssets.reduce((sum: number, a: any) => sum + a.balance, 0);
  const totalFixedAssets = fixedAssets.reduce((sum: number, a: any) => sum + a.balance, 0);
  const totalAssets = totalCurrentAssets + totalFixedAssets;
  const totalCurrentLiabilities = currentLiabilities.reduce((sum: number, a: any) => sum + a.balance, 0);
  const totalLongTermLiabilities = longTermLiabilities.reduce((sum: number, a: any) => sum + a.balance, 0);
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;
  const totalCapital = capitalAccounts.reduce((sum: number, a: any) => sum + a.balance, 0) + netProfit;
  const totalLiabilitiesAndCapital = totalLiabilities + totalCapital;
  const isBalanced = totalAssets === totalLiabilitiesAndCapital && totalAssets > 0;

  // ✅ Excel Export
  const exportToExcel = () => {
    const monthName = months[parseInt(monthFilter) - 1];
    const rows: string[][] = [];

    rows.push(["ড্রাগন ফুটওয়্যার — ব্যালেন্স শিট"]);
    rows.push([`সময়কাল: ${monthName} ${yearFilter}`]);
    rows.push([]);

    // Assets
    rows.push(["সম্পদ (Assets)", ""]);
    rows.push(["চলতি সম্পদ", ""]);
    currentAssets.forEach((a: any) => rows.push([a.name_bn, String(a.balance)]));
    rows.push(["মোট চলতি সম্পদ", String(totalCurrentAssets)]);
    rows.push(["স্থায়ী সম্পদ", ""]);
    fixedAssets.forEach((a: any) => rows.push([a.name_bn, String(a.balance)]));
    rows.push(["মোট স্থায়ী সম্পদ", String(totalFixedAssets)]);
    rows.push(["মোট সম্পদ", String(totalAssets)]);
    rows.push([]);

    // Liabilities
    rows.push(["দায় (Liabilities)", ""]);
    rows.push(["চলতি দায়", ""]);
    currentLiabilities.forEach((a: any) => rows.push([a.name_bn, String(a.balance)]));
    rows.push(["মোট চলতি দায়", String(totalCurrentLiabilities)]);
    rows.push(["দীর্ঘমেয়াদী দায়", ""]);
    longTermLiabilities.forEach((a: any) => rows.push([a.name_bn, String(a.balance)]));
    rows.push(["মোট দায়", String(totalLiabilities)]);
    rows.push([]);

    // Capital
    rows.push(["মূলধন (Capital)", ""]);
    capitalAccounts.forEach((a: any) => rows.push([a.name_bn, String(a.balance)]));
    if (netProfit !== 0) rows.push([netProfit >= 0 ? "নিট লাভ" : "নিট ক্ষতি", String(Math.abs(netProfit))]);
    rows.push(["মোট মূলধন", String(totalCapital)]);
    rows.push([]);

    rows.push(["মোট দায় + মূলধন", String(totalLiabilitiesAndCapital)]);
    rows.push([isBalanced ? "✅ ব্যালেন্স মিলেছে" : "❌ ব্যালেন্স মিলছে না"]);

    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ব্যালেন্স-শিট-${monthName}-${yearFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderRows = (rows: any[]) =>
    rows.map((acc: any) => (
      <tr key={acc.id} className="border-t hover:bg-muted/20">
        <td className="p-3 font-bengali pl-8 text-sm">{acc.name_bn}</td>
        <td className="p-3 text-right font-mono text-sm">৳{acc.balance.toLocaleString()}</td>
      </tr>
    ));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-bengali">ব্যালেন্স শিট</h1>
          <p className="text-xs text-muted-foreground">Balance Sheet</p>
        </div>
        <div className="flex gap-2">
          {/* ✅ Excel Export */}
          <Button variant="outline" size="sm" onClick={exportToExcel} disabled={isLoading || totalAssets === 0}>
            <Download className="w-4 h-4 mr-1" />Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1" />প্রিন্ট
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bengali text-muted-foreground">মাস</span>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="border rounded-xl px-4 py-2 text-base font-bengali">
            {months.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bengali text-muted-foreground">বছর</span>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="border rounded-xl px-4 py-2 text-base font-bengali">
            {[2024, 2025, 2026].map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
      </div>

      {!isLoading && totalAssets > 0 && (
        <div className={`px-4 py-2 rounded-lg text-sm font-bengali font-bold ${isBalanced ? "bg-green-100 text-green-700" : "bg-destructive/10 text-destructive"}`}>
          {isBalanced ? "✅ ব্যালেন্স শিট মিলেছে" : `❌ মিলছে না — সম্পদ: ৳${totalAssets.toLocaleString()} | দায়+মূলধন: ৳${totalLiabilitiesAndCapital.toLocaleString()}`}
        </div>
      )}

      {isLoading ? (
        <p className="text-center font-bengali text-muted-foreground py-8">লোড হচ্ছে...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* LEFT: ASSETS */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="p-3 text-left font-bengali" colSpan={2}>🏦 সম্পদ (Assets)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-blue-50">
                  <td colSpan={2} className="px-3 py-1.5 font-bold font-bengali text-xs text-blue-700">চলতি সম্পদ</td>
                </tr>
                {currentAssets.length === 0 ? <tr><td colSpan={2} className="p-3 text-center font-bengali text-muted-foreground text-xs">কোনো চলতি সম্পদ নেই</td></tr> : renderRows(currentAssets)}
                <tr className="bg-blue-50 font-semibold border-t">
                  <td className="p-3 font-bengali text-sm">মোট চলতি সম্পদ</td>
                  <td className="p-3 text-right font-mono text-sm text-blue-700">৳{totalCurrentAssets.toLocaleString()}</td>
                </tr>
                <tr className="bg-blue-50">
                  <td colSpan={2} className="px-3 py-1.5 font-bold font-bengali text-xs text-blue-700">স্থায়ী সম্পদ</td>
                </tr>
                {fixedAssets.length === 0 ? <tr><td colSpan={2} className="p-3 text-center font-bengali text-muted-foreground text-xs">কোনো স্থায়ী সম্পদ নেই</td></tr> : renderRows(fixedAssets)}
                <tr className="bg-blue-50 font-semibold border-t">
                  <td className="p-3 font-bengali text-sm">মোট স্থায়ী সম্পদ</td>
                  <td className="p-3 text-right font-mono text-sm text-blue-700">৳{totalFixedAssets.toLocaleString()}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-blue-700 text-white font-bold">
                  <td className="p-4 font-bengali text-base">মোট সম্পদ</td>
                  <td className="p-4 text-right font-mono text-base">৳{totalAssets.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* RIGHT: LIABILITIES + CAPITAL */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-red-600 text-white">
                  <th className="p-3 text-left font-bengali" colSpan={2}>💳 দায় (Liabilities)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-red-50">
                  <td colSpan={2} className="px-3 py-1.5 font-bold font-bengali text-xs text-red-700">চলতি দায়</td>
                </tr>
                {currentLiabilities.length === 0 ? <tr><td colSpan={2} className="p-3 text-center font-bengali text-muted-foreground text-xs">কোনো চলতি দায় নেই</td></tr> : renderRows(currentLiabilities)}
                <tr className="bg-red-50 font-semibold border-t">
                  <td className="p-3 font-bengali text-sm">মোট চলতি দায়</td>
                  <td className="p-3 text-right font-mono text-sm text-red-700">৳{totalCurrentLiabilities.toLocaleString()}</td>
                </tr>
                <tr className="bg-red-50">
                  <td colSpan={2} className="px-3 py-1.5 font-bold font-bengali text-xs text-red-700">দীর্ঘমেয়াদী দায়</td>
                </tr>
                {longTermLiabilities.length === 0 ? <tr><td colSpan={2} className="p-3 text-center font-bengali text-muted-foreground text-xs">কোনো দীর্ঘমেয়াদী দায় নেই</td></tr> : renderRows(longTermLiabilities)}
                <tr className="bg-red-50 font-semibold border-t">
                  <td className="p-3 font-bengali text-sm">মোট দায়</td>
                  <td className="p-3 text-right font-mono text-sm text-red-700">৳{totalLiabilities.toLocaleString()}</td>
                </tr>
              </tbody>

              <thead>
                <tr className="bg-purple-600 text-white">
                  <th className="p-3 text-left font-bengali" colSpan={2}>💰 মূলধন (Capital)</th>
                </tr>
              </thead>
              <tbody>
                {capitalAccounts.length === 0 ? <tr><td colSpan={2} className="p-3 text-center font-bengali text-muted-foreground text-xs">কোনো মূলধন নেই</td></tr> : renderRows(capitalAccounts)}
                {netProfit !== 0 && (
                  <tr className="border-t hover:bg-muted/20">
                    <td className="p-3 font-bengali pl-8 text-sm">{netProfit >= 0 ? "নিট লাভ (P&L)" : "নিট ক্ষতি (P&L)"}</td>
                    <td className={`p-3 text-right font-mono text-sm ${netProfit >= 0 ? "text-green-700" : "text-destructive"}`}>৳{Math.abs(netProfit).toLocaleString()}</td>
                  </tr>
                )}
                <tr className="bg-purple-50 font-semibold border-t">
                  <td className="p-3 font-bengali text-sm">মোট মূলধন</td>
                  <td className="p-3 text-right font-mono text-sm text-purple-700">৳{totalCapital.toLocaleString()}</td>
                </tr>
              </tbody>

              <tfoot>
                <tr className={`font-bold text-white ${isBalanced ? "bg-green-700" : "bg-destructive"}`}>
                  <td className="p-4 font-bengali text-base">মোট দায় + মূলধন</td>
                  <td className="p-4 text-right font-mono text-base">৳{totalLiabilitiesAndCapital.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs font-bengali text-muted-foreground">সময়কাল: {months[parseInt(monthFilter) - 1]}, {yearFilter}</p>
    </div>
  );
};

export default BalanceSheetPage;