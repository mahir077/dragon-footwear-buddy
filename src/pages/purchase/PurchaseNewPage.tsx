import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const toBn = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);

type PurchaseItem = {
  material_id: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
};

const PurchaseNewPage = () => {
  const qc = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const [memoNo, setMemoNo] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [bankId, setBankId] = useState("");
  const [transport, setTransport] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [note, setNote] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([
    { material_id: "", unit: "", quantity: 0, rate: 0, amount: 0 },
  ]);

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data } = await supabase.from("parties").select("*").in("type", ["supplier", "both"]).eq("is_active", true);
      return data || [];
    },
  });

  const { data: materials } = useQuery({
    queryKey: ["raw_materials"],
    queryFn: async () => {
      const { data } = await supabase.from("raw_materials").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: banks } = useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const { data } = await supabase.from("bank_accounts").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: activeYear } = useQuery({
    queryKey: ["activeYear"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).single();
      return data;
    },
  });

  // Auto memo
  useEffect(() => {
    supabase.from("purchases").select("id", { count: "exact", head: true }).then(({ count }) => {
      setMemoNo(`PUR-${String((count || 0) + 1).padStart(3, "0")}`);
    });
  }, []);

  const updateItem = (idx: number, field: keyof PurchaseItem, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "material_id") {
        const mat = materials?.find((m) => m.id === value);
        if (mat) next[idx].unit = mat.unit;
      }
      next[idx].amount = next[idx].quantity * next[idx].rate;
      return next;
    });
  };

  const addRow = () => setItems((p) => [...p, { material_id: "", unit: "", quantity: 0, rate: 0, amount: 0 }]);
  const removeRow = (i: number) => items.length > 1 && setItems((p) => p.filter((_, idx) => idx !== i));

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const total = subtotal + transport - discount;
  const baki = total - paidAmount;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: purchase, error } = await supabase.from("purchases").insert({
        date: format(date, "yyyy-MM-dd"),
        memo_no: memoNo,
        supplier_id: supplierId || null,
        payment_mode: paymentMode,
        bank_id: paymentMode === "bank" ? bankId : null,
        subtotal, transport, discount, total,
        paid_amount: paidAmount,
        year_id: activeYear?.id || null,
        note,
      }).select().single();
      if (error) throw error;

      const purchaseItems = items.filter((i) => i.material_id).map((i) => ({
        purchase_id: purchase.id,
        material_id: i.material_id,
        unit: i.unit,
        quantity: i.quantity,
        rate: i.rate,
        amount: i.amount,
      }));
      if (purchaseItems.length) {
        const { error: e2 } = await supabase.from("purchase_items").insert(purchaseItems);
        if (e2) throw e2;
      }
      return purchase;
    },
    onSuccess: () => {
      toast.success("সফলভাবে সংরক্ষিত হয়েছে ✅");
      qc.invalidateQueries({ queryKey: ["purchases"] });
      setItems([{ material_id: "", unit: "", quantity: 0, rate: 0, amount: 0 }]);
      setTransport(0); setDiscount(0); setPaidAmount(0); setNote("");
      setSupplierId("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl font-bold font-bengali mb-1">নতুন ক্রয়</h1>
      <p className="text-xs text-muted-foreground mb-4">New Purchase</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Date */}
        <div>
          <Label className="font-bengali text-sm">তারিখ</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left text-sm", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {date ? format(date, "dd/MM/yyyy") : "তারিখ নির্বাচন"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="p-3 pointer-events-auto" /></PopoverContent>
          </Popover>
        </div>
        {/* Memo */}
        <div>
          <Label className="font-bengali text-sm">মেমো নং</Label>
          <Input value={memoNo} onChange={(e) => setMemoNo(e.target.value)} className="text-sm" />
        </div>
        {/* Supplier */}
        <div>
          <Label className="font-bengali text-sm">সরবরাহকারী</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
            <SelectContent>{suppliers?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Payment Mode */}
      <div className="mb-4">
        <Label className="font-bengali text-sm mb-2 block">পেমেন্ট মোড</Label>
        <div className="flex gap-2">
          {[
            { val: "cash", label: "🟢 নগদ", cls: "bg-green-600" },
            { val: "credit", label: "🔵 বাকি", cls: "bg-blue-600" },
            { val: "bank", label: "🟣 ব্যাংক", cls: "bg-purple-600" },
          ].map((m) => (
            <button
              key={m.val}
              onClick={() => setPaymentMode(m.val)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bengali font-bold text-white transition-all ${
                paymentMode === m.val ? m.cls + " ring-2 ring-offset-1 ring-white shadow-lg" : "bg-muted text-muted-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {paymentMode === "bank" && (
          <Select value={bankId} onValueChange={setBankId}>
            <SelectTrigger className="mt-2 text-sm"><SelectValue placeholder="ব্যাংক নির্বাচন" /></SelectTrigger>
            <SelectContent>{banks?.map((b) => <SelectItem key={b.id} value={b.id}>{b.bank_name} - {b.account_no}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>

      {/* Items Table */}
      <div className="border rounded-lg overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left font-bengali">কাঁচামাল</th>
              <th className="p-2 text-left font-bengali">ইউনিট</th>
              <th className="p-2 text-right font-bengali">পরিমাণ</th>
              <th className="p-2 text-right font-bengali">দর</th>
              <th className="p-2 text-right font-bengali">মোট</th>
              <th className="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-t">
                <td className="p-1.5">
                  <Select value={item.material_id} onValueChange={(v) => updateItem(i, "material_id", v)}>
                    <SelectTrigger className="text-xs h-8"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
                    <SelectContent>{materials?.map((m) => <SelectItem key={m.id} value={m.id}>{m.name_bn}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="p-1.5 text-xs text-muted-foreground">{item.unit || "-"}</td>
                <td className="p-1.5"><Input type="number" value={item.quantity || ""} onChange={(e) => updateItem(i, "quantity", +e.target.value)} className="text-xs h-8 text-right w-20" /></td>
                <td className="p-1.5"><Input type="number" value={item.rate || ""} onChange={(e) => updateItem(i, "rate", +e.target.value)} className="text-xs h-8 text-right w-20" /></td>
                <td className="p-1.5 text-right font-semibold text-xs">৳{toBn(item.amount)}</td>
                <td className="p-1.5"><button onClick={() => removeRow(i)} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="outline" size="sm" onClick={addRow} className="mb-4 text-xs font-bengali">
        <Plus className="w-3.5 h-3.5 mr-1" /> আরো যোগ করুন
      </Button>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div><Label className="font-bengali text-xs">ভাড়া</Label><Input type="number" value={transport || ""} onChange={(e) => setTransport(+e.target.value)} className="text-sm" /></div>
        <div><Label className="font-bengali text-xs">ছাড়</Label><Input type="number" value={discount || ""} onChange={(e) => setDiscount(+e.target.value)} className="text-sm" /></div>
        <div><Label className="font-bengali text-xs">পরিশোধ</Label><Input type="number" value={paidAmount || ""} onChange={(e) => setPaidAmount(+e.target.value)} className="text-sm" /></div>
        <div>
          <Label className="font-bengali text-xs">মোট</Label>
          <div className="text-lg font-bold font-bengali mt-1">৳{toBn(total)}</div>
          {baki > 0 && <div className="text-sm font-bengali text-destructive">বাকি: ৳{toBn(baki)}</div>}
        </div>
      </div>

      <div className="mb-3">
        <Label className="font-bengali text-xs">নোট</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} className="text-sm" />
      </div>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full bg-green-600 hover:bg-green-700 text-white text-base font-bengali font-bold py-5"
      >
        ক্রয় সংরক্ষণ করুন
      </Button>
    </div>
  );
};

export default PurchaseNewPage;
