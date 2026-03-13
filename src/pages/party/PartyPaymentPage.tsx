 import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const PartyPaymentPage = () => {
  const qc = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const [partyId, setPartyId] = useState("");
  const [type, setType] = useState<"receipt" | "payment">("receipt");
  const [amount, setAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [bankId, setBankId] = useState("");
  const [note, setNote] = useState("");

  const { data: parties = [] } = useQuery({
    queryKey: ["parties-all"],
    queryFn: async () => {
      const { data } = await supabase.from("parties").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: partyBalance } = useQuery({
    queryKey: ["party-balance", partyId],
    queryFn: async () => {
      if (!partyId) return null;
      const { data } = await supabase.from("v_party_balance").select("*").eq("party_id", partyId).single();
      return data;
    },
    enabled: !!partyId,
  });

  const { data: banks = [] } = useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const { data } = await supabase.from("bank_accounts").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: years } = useQuery({
    queryKey: ["active-year"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).single();
      return data;
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["party-payments", partyId],
    queryFn: async () => {
      if (!partyId) return [];
      const { data } = await (supabase as any).from("party_payments")
        .select("*")
        .eq("party_id", partyId)
        .order("date", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!partyId,
  });

  const selectedParty = parties.find((p: any) => p.id === partyId);
  const currentBalance = partyBalance?.current_balance || 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!partyId) throw new Error("পার্টি নির্বাচন করুন");
      if (!amount || amount <= 0) throw new Error("সঠিক পরিমাণ দিন");

      const { error } = await (supabase as any).from("party_payments").insert({
        date: format(date, "yyyy-MM-dd"),
        party_id: partyId,
        type,
        amount,
        payment_mode: paymentMode,
        bank_id: paymentMode === "bank" ? bankId : null,
        note,
        year_id: years?.id || null,
      });
      if (error) throw error;

      // Also record in daily_transactions
      await supabase.from("daily_transactions").insert({
        date: format(date, "yyyy-MM-dd"),
        type: type === "receipt" ? "income" : "expense",
        amount,
        note: `${type === "receipt" ? "টাকা আদায়" : "টাকা প্রদান"} - ${selectedParty?.name || ""}${note ? " | " + note : ""}`,
        year_id: years?.id || null,
      });
    },
    onSuccess: () => {
      toast({ title: type === "receipt" ? "টাকা আদায় সফল ✅" : "টাকা প্রদান সফল ✅" });
      qc.invalidateQueries({ queryKey: ["party-payments", partyId] });
      qc.invalidateQueries({ queryKey: ["party-balance", partyId] });
      setAmount(0);
      setNote("");
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold font-bengali">পার্টি পেমেন্ট</h1>
        <p className="text-sm text-muted-foreground">Party Payment / Receipt</p>
      </div>

      {/* Type Toggle */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setType("receipt")}
          className={`p-4 rounded-xl border-2 font-bengali font-bold text-lg transition-all ${type === "receipt" ? "border-green-500 bg-green-50 text-green-700" : "border-border bg-card"}`}>
          💰 টাকা আদায়
          <p className="text-xs font-normal mt-1 opacity-70">Customer থেকে নেওয়া</p>
        </button>
        <button onClick={() => setType("payment")}
          className={`p-4 rounded-xl border-2 font-bengali font-bold text-lg transition-all ${type === "payment" ? "border-red-500 bg-red-50 text-red-700" : "border-border bg-card"}`}>
          💸 টাকা প্রদান
          <p className="text-xs font-normal mt-1 opacity-70">Supplier কে দেওয়া</p>
        </button>
      </div>

      {/* Form */}
      <div className="bg-card p-4 rounded-xl border space-y-4">
        {/* Party */}
        <div>
          <label className="text-xs font-bengali text-muted-foreground">পার্টি নির্বাচন</label>
          <Select value={partyId} onValueChange={setPartyId}>
            <SelectTrigger><SelectValue placeholder="পার্টি বেছে নিন" /></SelectTrigger>
            <SelectContent>
              {parties.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Balance Card */}
        {partyId && (
          <div className={`p-3 rounded-xl text-white text-center ${currentBalance > 0 ? "bg-red-500" : currentBalance < 0 ? "bg-blue-500" : "bg-green-500"}`}>
            <p className="text-xs opacity-80 font-bengali">
              {currentBalance > 0 ? "বর্তমান পাওনা (আমাদের)" : currentBalance < 0 ? "বর্তমান দেনা (আমাদের)" : "হিসাব পরিষ্কার"}
            </p>
            <p className="text-2xl font-extrabold font-bengali">৳{Math.abs(currentBalance).toLocaleString()}</p>
            <p className="text-xs opacity-80">{selectedParty?.name}</p>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="text-xs font-bengali text-muted-foreground">তারিখ</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />{format(date, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs font-bengali text-muted-foreground">পরিমাণ (৳)</label>
          <Input type="number" value={amount || ""} onChange={e => setAmount(Number(e.target.value))}
            className="text-2xl font-bold h-14" placeholder="০" />
        </div>

        {/* Payment Mode */}
        <div>
          <label className="text-xs font-bengali text-muted-foreground">পেমেন্ট মোড</label>
          <div className="flex gap-2 mt-1">
            <button onClick={() => setPaymentMode("cash")}
              className={`flex-1 py-2 rounded-lg font-bengali font-bold border-2 transition-all ${paymentMode === "cash" ? "border-green-500 bg-green-50 text-green-700" : "border-border"}`}>
              নগদ
            </button>
            <button onClick={() => setPaymentMode("bank")}
              className={`flex-1 py-2 rounded-lg font-bengali font-bold border-2 transition-all ${paymentMode === "bank" ? "border-purple-500 bg-purple-50 text-purple-700" : "border-border"}`}>
              ব্যাংক
            </button>
            <button onClick={() => setPaymentMode("mobile")}
              className={`flex-1 py-2 rounded-lg font-bengali font-bold border-2 transition-all ${paymentMode === "mobile" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-border"}`}>
              মোবাইল
            </button>
          </div>
        </div>

        {paymentMode === "bank" && (
          <Select value={bankId} onValueChange={setBankId}>
            <SelectTrigger><SelectValue placeholder="ব্যাংক নির্বাচন" /></SelectTrigger>
            <SelectContent>
              {banks.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.bank_name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {/* Note */}
        <div>
          <label className="text-xs font-bengali text-muted-foreground">নোট (ঐচ্ছিক)</label>
          <Input value={note} onChange={e => setNote(e.target.value)} placeholder="কারণ বা বিবরণ..." className="font-bengali" />
        </div>

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className={`w-full py-6 text-lg font-bold font-bengali ${type === "receipt" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white`}>
          {saveMutation.isPending ? "সংরক্ষণ হচ্ছে..." : type === "receipt" ? "💰 টাকা আদায় সংরক্ষণ" : "💸 টাকা প্রদান সংরক্ষণ"}
        </Button>
      </div>

      {/* Recent History */}
      {partyId && history.length > 0 && (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="p-3 bg-muted font-bold font-bengali text-sm">সাম্প্রতিক লেনদেন</div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="font-bengali">
                <th className="p-2 text-left">তারিখ</th>
                <th className="p-2 text-left">ধরন</th>
                <th className="p-2 text-left">মোড</th>
                <th className="p-2 text-right">পরিমাণ</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h: any) => (
                <tr key={h.id} className="border-t">
                  <td className="p-2">{h.date}</td>
                  <td className="p-2 font-bengali">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${h.type === "receipt" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {h.type === "receipt" ? "আদায়" : "প্রদান"}
                    </span>
                  </td>
                  <td className="p-2 font-bengali">{h.payment_mode}</td>
                  <td className={`p-2 text-right font-bold ${h.type === "receipt" ? "text-green-600" : "text-red-600"}`}>
                    {h.type === "receipt" ? "+" : "-"}৳{(h.amount || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PartyPaymentPage;