import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";

const db = supabase as any;

// ✅ Transaction tables only
const TRANSACTION_TABLES = [
  "journal_lines",
  "journal_entries",
  "waste_sales",
  "sale_items",
  "stock_movements",
  "sales",
  "purchase_items",
  "purchases",
  "productions",
  "party_payments",
  "loan_transactions",
  "loans",
  "salary_sheets",
  "attendance",
  "salary_advances",
  "daily_transactions",
  "entry_attachments",
  "entry_custom_field_values",
  "assets",
];

// ✅ Everything including setup
const ALL_TABLES = [
  ...TRANSACTION_TABLES,
  "parties",
  "raw_materials",
  "articles",
  "models",
  "brands",
  "colors",
  "locations",
  "bank_accounts",
  "employees",
  "income_heads",
  "expense_heads",
  "chart_of_accounts",
  "financial_years",
];

const SettingsPage = () => {
  const qc = useQueryClient();
  const [company, setCompany] = useState({ name: "ড্রাগন পিউ ফুটওয়্যার", address: "", phone: "" });
  const [lang, setLang] = useState<"bn" | "en">("bn");
  const [lockOpen, setLockOpen] = useState(false);
  const [clearType, setClearType] = useState<"transaction" | "full" | null>(null);
  const [clearConfirmText, setClearConfirmText] = useState("");
  const [clearing, setClearing] = useState(false);

  const { data: activeYear } = useQuery({
    queryKey: ["active-year"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).maybeSingle();
      return data;
    },
  });

  const lockYear = async () => {
    if (!activeYear) return;
    const { error } = await supabase.from("financial_years").update({ is_locked: true }).eq("id", activeYear.id);
    if (error) toast.error("ত্রুটি হয়েছে");
    else { toast.success("বছর লক করা হয়েছে"); setLockOpen(false); }
  };

  const clearData = async () => {
    const requiredText = clearType === "full" ? "FULL DELETE" : "DELETE";
    if (clearConfirmText !== requiredText) {
      toast.error(`সঠিক text লিখুন: ${requiredText}`);
      return;
    }

    setClearing(true);
    const tables = clearType === "full" ? ALL_TABLES : TRANSACTION_TABLES;

    try {
      for (const table of tables) {
        const { error } = await db.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) console.error(`Error clearing ${table}:`, error.message);
      }
      toast.success(clearType === "full" ? "সম্পূর্ণ রিসেট হয়েছে ✅" : "ট্রানজেকশন ডেটা মুছে গেছে ✅");
      qc.invalidateQueries();
      setClearType(null);
      setClearConfirmText("");
    } catch (e: any) {
      toast.error("ত্রুটি: " + e.message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold font-bengali">⚙️ সেটিংস</h1>

      {/* Company Info */}
      <Card>
        <CardHeader><CardTitle className="font-bengali">কোম্পানি তথ্য</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label className="font-bengali">কোম্পানির নাম</Label><Input value={company.name} onChange={e => setCompany(p => ({ ...p, name: e.target.value }))} /></div>
          <div><Label className="font-bengali">ঠিকানা</Label><Input value={company.address} onChange={e => setCompany(p => ({ ...p, address: e.target.value }))} /></div>
          <div><Label className="font-bengali">ফোন</Label><Input value={company.phone} onChange={e => setCompany(p => ({ ...p, phone: e.target.value }))} /></div>
          <Button onClick={() => toast.success("সংরক্ষিত হয়েছে")} className="font-bengali">সংরক্ষণ করুন</Button>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader><CardTitle className="font-bengali">ভাষা নির্বাচন</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          <Button variant={lang === "bn" ? "default" : "outline"} className="flex-1 text-lg py-6 font-bengali" onClick={() => setLang("bn")}>বাংলা</Button>
          <Button variant={lang === "en" ? "default" : "outline"} className="flex-1 text-lg py-6" onClick={() => setLang("en")}>English</Button>
        </CardContent>
      </Card>

      {/* Financial Year */}
      <Card>
        <CardHeader><CardTitle className="font-bengali">আর্থিক বছর</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {activeYear ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{activeYear.name}</p>
                <p className="text-sm text-muted-foreground">{activeYear.start_date} → {activeYear.end_date}</p>
                {activeYear.is_locked && <p className="text-sm text-destructive font-semibold font-bengali">🔒 লক করা আছে</p>}
              </div>
              {!activeYear.is_locked && (
                <Button variant="destructive" size="sm" onClick={() => setLockOpen(true)} className="font-bengali">🔒 বছর লক করুন</Button>
              )}
            </div>
          ) : <p className="text-muted-foreground font-bengali">কোনো সক্রিয় বছর নেই</p>}
        </CardContent>
      </Card>

      {/* ✅ Data Clear Options */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="font-bengali text-destructive flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            ডেটা মুছুন
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Option 1 — Transaction Only */}
          <div className="border border-orange-300 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🟡</span>
              <p className="font-bold font-bengali">ট্রানজেকশন ডেটা মুছুন</p>
            </div>
            <p className="text-xs font-bengali text-muted-foreground">
              বিক্রয়, ক্রয়, উৎপাদন, জার্নাল, বেতন, উপস্থিতি মুছবে।
              পার্টি, আর্টিকেল, কর্মচারী সেটআপ থাকবে।
            </p>
            <Button variant="outline" className="w-full border-orange-400 text-orange-600 hover:bg-orange-50 font-bengali"
              onClick={() => { setClearType("transaction"); setClearConfirmText(""); }}>
              <Trash2 className="w-4 h-4 mr-2" />ট্রানজেকশন মুছুন
            </Button>
          </div>

          {/* Option 2 — Full Reset */}
          <div className="border border-destructive/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔴</span>
              <p className="font-bold font-bengali text-destructive">সম্পূর্ণ রিসেট</p>
            </div>
            <p className="text-xs font-bengali text-muted-foreground">
              সব কিছু মুছবে — ট্রানজেকশন + সেটআপ ডেটা।
              শুধু User accounts থাকবে।
            </p>
            <Button variant="destructive" className="w-full font-bengali"
              onClick={() => { setClearType("full"); setClearConfirmText(""); }}>
              <Trash2 className="w-4 h-4 mr-2" />সম্পূর্ণ রিসেট করুন
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lock Year Dialog */}
      <Dialog open={lockOpen} onOpenChange={setLockOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 font-bengali"><AlertTriangle className="w-5 h-5 text-destructive" />সতর্কতা!</DialogTitle></DialogHeader>
          <p className="text-sm font-bengali">বছর বন্ধ করলে আর কোনো entry করা যাবে না। নিশ্চিত?</p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setLockOpen(false)} className="font-bengali">বাতিল</Button>
            <Button variant="destructive" onClick={lockYear} className="font-bengali">হ্যাঁ, লক করুন</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ Clear Confirmation Dialog */}
      <Dialog open={!!clearType} onOpenChange={(v) => { if (!v) { setClearType(null); setClearConfirmText(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 font-bengali ${clearType === "full" ? "text-destructive" : "text-orange-600"}`}>
              <Trash2 className="w-5 h-5" />
              {clearType === "full" ? "সম্পূর্ণ রিসেট?" : "ট্রানজেকশন মুছবেন?"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {clearType === "transaction" ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm font-bengali space-y-1">
                <p className="font-bold text-orange-700">মুছবে:</p>
                <p>❌ সব বিক্রয়, ক্রয়, উৎপাদন</p>
                <p>❌ সব জার্নাল এন্ট্রি</p>
                <p>❌ সব বেতন ও উপস্থিতি</p>
                <p>❌ সব লোন লেনদেন</p>
                <p className="font-bold text-green-700 mt-2">থাকবে:</p>
                <p>✅ পার্টি, আর্টিকেল, কর্মচারী</p>
                <p>✅ Chart of Accounts, Financial Years</p>
              </div>
            ) : (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm font-bengali space-y-1">
                <p className="font-bold text-destructive">সব মুছবে:</p>
                <p>❌ সব ট্রানজেকশন ডেটা</p>
                <p>❌ পার্টি, আর্টিকেল, কর্মচারী</p>
                <p>❌ Chart of Accounts</p>
                <p>❌ Financial Years</p>
                <p className="font-bold text-green-700 mt-2">শুধু থাকবে:</p>
                <p>✅ User accounts ও roles</p>
              </div>
            )}

            <div>
              <Label className={`font-bengali font-bold ${clearType === "full" ? "text-destructive" : "text-orange-600"}`}>
                নিশ্চিত করতে{" "}
                <span className="bg-muted px-1 rounded font-mono">
                  {clearType === "full" ? "FULL DELETE" : "DELETE"}
                </span>{" "}
                টাইপ করুন:
              </Label>
              <Input
                value={clearConfirmText}
                onChange={e => setClearConfirmText(e.target.value)}
                placeholder={clearType === "full" ? "FULL DELETE" : "DELETE"}
                className="mt-1 font-mono"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setClearType(null); setClearConfirmText(""); }} className="flex-1 font-bengali">
                বাতিল
              </Button>
              <Button
                variant={clearType === "full" ? "destructive" : "default"}
                className={`flex-1 font-bengali ${clearType === "transaction" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                onClick={clearData}
                disabled={clearConfirmText !== (clearType === "full" ? "FULL DELETE" : "DELETE") || clearing}
              >
                {clearing ? "মুছছে..." : "হ্যাঁ, মুছুন"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;