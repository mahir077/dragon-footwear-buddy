import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useSearchParams, useNavigate } from "react-router-dom";
import { journalCashSale, journalCreditSale } from "@/lib/autoJournal";
import EntryCustomFields from "@/components/EntryCustomFields";
import EntryAttachment from "@/components/EntryAttachment";

type SaleItem = { article_id: string; color_id: string; cartons: number; pairs: number; rate: number; amount: number; season: string };

const saleTypes = [
  { key: "cash", bn: "নগদ বিক্রি", color: "border-stat-green bg-stat-green/10 text-stat-green" },
  { key: "credit", bn: "বাকি বিক্রি", color: "border-stat-blue bg-stat-blue/10 text-stat-blue" },
  { key: "cut_size", bn: "কাটসাইজ", color: "border-stat-orange bg-stat-orange/10 text-stat-orange" },
  { key: "lot", bn: "লট বিক্রি", color: "border-stat-purple bg-stat-purple/10 text-stat-purple" },
  { key: "single_pair", bn: "একপা বিক্রি", color: "border-yellow-500 bg-yellow-50 text-yellow-700" },
  { key: "b_grade", bn: "বি-মাল", color: "border-gray-500 bg-gray-50 text-gray-700" },
];

const channels = ["দোকান", "ডিলার", "পাইকারি", "লট"];

const SalesNewPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEdit = !!editId;

  // ✅ Pre-generated entryId for new sales
  const [entryId, setEntryId] = useState(() => crypto.randomUUID());

  const [saleType, setSaleType] = useState("cash");
  const [date, setDate] = useState<Date>(new Date());
  const [memoNo, setMemoNo] = useState("");
  const [partyId, setPartyId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [season, setSeason] = useState("winter");
  const [channel, setChannel] = useState("দোকান");
  const [commission, setCommission] = useState(0);
  const [transport, setTransport] = useState(0);
  const [deduction, setDeduction] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [bankId, setBankId] = useState("");
  const [items, setItems] = useState<SaleItem[]>([{ article_id: "", color_id: "", cartons: 0, pairs: 0, rate: 0, amount: 0, season: "winter" }]);
  const [loaded, setLoaded] = useState(false);

  const { data: parties } = useQuery({ queryKey: ["parties-customer"], queryFn: async () => { const { data } = await supabase.from("parties").select("*").in("type", ["customer", "both"]).eq("is_active", true); return data || []; } });
  const { data: locations } = useQuery({ queryKey: ["locations"], queryFn: async () => { const { data } = await supabase.from("locations").select("*").eq("is_active", true); return data || []; } });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: async () => { const { data } = await supabase.from("brands").select("*").eq("is_active", true); return data || []; } });
  const { data: articles } = useQuery({ queryKey: ["articles", brandId], queryFn: async () => { let q = supabase.from("articles").select("*, models!inner(brand_id, name_bn)").eq("is_active", true); if (brandId) q = q.eq("models.brand_id", brandId); const { data } = await q; return data || []; } });
  const { data: colors } = useQuery({ queryKey: ["colors"], queryFn: async () => { const { data } = await supabase.from("colors").select("*").eq("is_active", true); return data || []; } });
  const { data: banks } = useQuery({ queryKey: ["banks"], queryFn: async () => { const { data } = await supabase.from("bank_accounts").select("*").eq("is_active", true); return data || []; } });
  const { data: partyBalance } = useQuery({ queryKey: ["party-balance", partyId], queryFn: async () => { if (!partyId) return null; const { data } = await supabase.from("v_party_balance").select("*").eq("party_id", partyId).single(); return data; }, enabled: !!partyId });
  const { data: years } = useQuery({ queryKey: ["active-year"], queryFn: async () => { const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).single(); return data; } });

  useEffect(() => {
    if (!editId || loaded) return;
    const loadSale = async () => {
      const { data: sale } = await supabase.from("sales").select("*").eq("id", editId).single();
      if (!sale) return;
      setSaleType(sale.sale_type || "cash");
      setDate(sale.date ? parseISO(sale.date) : new Date());
      setMemoNo(sale.memo_no || "");
      setPartyId(sale.party_id || "");
      setLocationId(sale.location_id || "");
      setBrandId(sale.brand_id || "");
      setSeason(sale.season === "গরম" ? "summer" : "winter");
      setChannel(sale.channel || "দোকান");
      setCommission(sale.commission || 0);
      setTransport(sale.transport || 0);
      setDeduction(sale.deduction || 0);
      setPaidAmount(sale.paid_amount || 0);
      setPaymentMode(sale.payment_mode || "cash");
      setBankId(sale.bank_id || "");
      const { data: saleItems } = await supabase.from("sale_items").select("*").eq("sale_id", editId);
      if (saleItems && saleItems.length > 0) {
        setItems(saleItems.map((i: any) => ({
          article_id: i.article_id || "", color_id: i.color_id || "",
          cartons: i.cartons || 0, pairs: i.pairs || 0, rate: i.rate || 0,
          amount: i.amount || 0, season: i.season === "গরম" ? "summer" : "winter",
        })));
      }
      setLoaded(true);
    };
    loadSale();
  }, [editId, loaded]);

  useEffect(() => {
    if (isEdit) return;
    supabase.from("sales").select("memo_no").order("created_at", { ascending: false }).limit(1).then(({ data }) => {
      if (data?.[0]?.memo_no) {
        const num = parseInt(data[0].memo_no.replace(/\D/g, "")) + 1;
        setMemoNo(`SAL-${String(num).padStart(3, "0")}`);
      } else setMemoNo("SAL-001");
    });
  }, [isEdit]);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.amount, 0), [items]);
  const commissionAmount = useMemo(() => (subtotal * commission) / 100, [subtotal, commission]);
  const totalBill = useMemo(() => subtotal - commissionAmount + transport - deduction, [subtotal, commissionAmount, transport, deduction]);
  const previousDue = partyBalance?.current_balance || 0;
  const totalDue = previousDue + totalBill;
  const currentDue = totalDue - paidAmount;

  const updateItem = (idx: number, field: keyof SaleItem, val: any) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      if (field === "cartons" || field === "article_id") {
        const art = articles?.find(a => a.id === (field === "article_id" ? val : next[idx].article_id));
        if (art) next[idx].pairs = (field === "cartons" ? Number(val) : next[idx].cartons) * art.pairs_per_carton;
      }
      if (field === "cartons" || field === "rate" || field === "article_id") {
        next[idx].amount = next[idx].pairs * next[idx].rate;
      }
      return next;
    });
  };

  const addItem = () => setItems(prev => [...prev, { article_id: "", color_id: "", cartons: 0, pairs: 0, rate: 0, amount: 0, season }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const saleData = {
        date: format(date, "yyyy-MM-dd"), memo_no: memoNo, party_id: partyId || null,
        location_id: locationId || null, brand_id: brandId || null,
        season: season === "winter" ? "শীত" : "গরম",
        channel, sale_type: saleType, subtotal, commission: commissionAmount,
        transport, deduction, total_bill: totalBill, paid_amount: paidAmount,
        payment_mode: paymentMode, bank_id: paymentMode === "bank" ? bankId : null,
        year_id: years?.id || null,
      };

      let saleId = editId;

      if (isEdit) {
        const { error } = await supabase.from("sales").update(saleData).eq("id", editId);
        if (error) throw error;
        await supabase.from("sale_items").delete().eq("sale_id", editId);
        await supabase.from("stock_movements").delete().eq("reference_id", editId);
      } else {
        // ✅ pre-generated entryId use করছি
        const { data: sale, error } = await supabase.from("sales").insert({ ...saleData, id: entryId }).select().single();
        if (error) throw error;
        saleId = sale.id;
        await supabase.from("daily_transactions").insert({
          date: format(date, "yyyy-MM-dd"), type: "income",
          amount: paidAmount > 0 ? paidAmount : totalBill,
          note: `বিক্রয় - ${memoNo}`, year_id: years?.id || null,
        });
      }

      const saleItems = items.filter(i => i.article_id).map(i => ({
        sale_id: saleId, article_id: i.article_id, color_id: i.color_id || null,
        cartons: i.cartons, pairs: i.pairs, rate: i.rate, amount: i.amount,
        season: i.season === "winter" ? "শীত" : "গরম",
      }));
      if (saleItems.length) {
        const { error: e2 } = await supabase.from("sale_items").insert(saleItems);
        if (e2) throw e2;
        const movements = items.filter(i => i.article_id).map(i => ({
          date: format(date, "yyyy-MM-dd"), type: "sale", article_id: i.article_id,
          color_id: i.color_id || null, season: i.season === "winter" ? "শীত" : "গরম",
          from_location_id: locationId || null, cartons: -i.cartons, pairs: -i.pairs,
          reference_id: saleId,
        }));
        await supabase.from("stock_movements").insert(movements);
      }

      return saleId;
    },
    onSuccess: async (data) => {
      if (!isEdit && data) {
        const dateStr = format(date, "yyyy-MM-dd");
        if (saleType === "cash") {
  await journalCashSale(data, dateStr, totalBill, years?.id);
} else {
  await journalCreditSale(data, dateStr, totalBill, years?.id);
}
        // ✅ Next entry-র জন্য নতুন ID
        setEntryId(crypto.randomUUID());
      }
      toast({ title: isEdit ? "বিক্রয় আপডেট হয়েছে ✅" : "সফলভাবে সংরক্ষিত হয়েছে ✅" });
      queryClient.invalidateQueries({ queryKey: ["sales-list"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      navigate("/sales/list");
    },
    onError: (e: any) => toast({ title: "ত্রুটি হয়েছে", description: e.message, variant: "destructive" }),
  });

  // Edit mode-এ real sale ID use করব
  const activeEntryId = isEdit ? (editId || entryId) : entryId;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold font-bengali">{isEdit ? "বিক্রয় সম্পাদনা" : "নতুন বিক্রয়"}</h1>
        <p className="text-sm text-muted-foreground">{isEdit ? `Edit Sale — ${memoNo}` : "New Sale Entry"}</p>
      </div>

      {/* Sale Type */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {saleTypes.map(t => (
          <button key={t.key} onClick={() => setSaleType(t.key)}
            className={`p-3 rounded-xl border-2 font-bengali font-bold text-sm transition-all ${saleType === t.key ? t.color + " ring-2 ring-offset-1" : "border-border bg-card hover:border-muted-foreground/30"}`}>
            {t.bn}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-card p-4 rounded-xl border">
        <div>
          <label className="text-xs font-bengali text-muted-foreground">তারিখ</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left text-sm"><CalendarIcon className="mr-2 h-4 w-4" />{format(date, "dd/MM/yyyy")}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} className="p-3 pointer-events-auto" /></PopoverContent>
          </Popover>
        </div>
        <div><label className="text-xs font-bengali text-muted-foreground">মেমো নং</label><Input value={memoNo} onChange={e => setMemoNo(e.target.value)} /></div>
        <div>
          <label className="text-xs font-bengali text-muted-foreground">পার্টি</label>
          <Select value={partyId} onValueChange={setPartyId}><SelectTrigger><SelectValue placeholder="পার্টি নির্বাচন" /></SelectTrigger>
            <SelectContent>{parties?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
        </div>
        <div>
          <label className="text-xs font-bengali text-muted-foreground">লোকেশন</label>
          <Select value={locationId} onValueChange={setLocationId}><SelectTrigger><SelectValue placeholder="লোকেশন" /></SelectTrigger>
            <SelectContent>{locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name_bn}</SelectItem>)}</SelectContent></Select>
        </div>
        <div>
          <label className="text-xs font-bengali text-muted-foreground">ব্র্যান্ড</label>
          <Select value={brandId} onValueChange={setBrandId}><SelectTrigger><SelectValue placeholder="ব্র্যান্ড" /></SelectTrigger>
            <SelectContent>{brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name_bn}</SelectItem>)}</SelectContent></Select>
        </div>
        <div>
          <label className="text-xs font-bengali text-muted-foreground">সিজন</label>
          <div className="flex gap-2 mt-1">
            <button onClick={() => setSeason("winter")} className={`flex-1 py-2 rounded-lg text-sm font-bengali font-bold border-2 transition-all ${season === "winter" ? "border-stat-blue bg-stat-blue/10 text-stat-blue" : "border-border"}`}>❄️ শীত</button>
            <button onClick={() => setSeason("summer")} className={`flex-1 py-2 rounded-lg text-sm font-bengali font-bold border-2 transition-all ${season === "summer" ? "border-stat-orange bg-stat-orange/10 text-stat-orange" : "border-border"}`}>☀️ গরম</button>
          </div>
        </div>
        <div className="col-span-2 md:col-span-3">
          <label className="text-xs font-bengali text-muted-foreground">চ্যানেল</label>
          <div className="flex gap-2 mt-1">
            {channels.map(c => (
              <button key={c} onClick={() => setChannel(c)} className={`flex-1 py-2 rounded-lg text-xs font-bengali font-bold border-2 transition-all ${channel === c ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-card p-4 rounded-xl border space-y-3">
        <h3 className="font-bold font-bengali">মালের বিবরণ</h3>
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-6 gap-2 items-end">
            <div>
              <label className="text-[10px] font-bengali text-muted-foreground">আর্টিকেল</label>
              <Select value={item.article_id} onValueChange={v => updateItem(idx, "article_id", v)}>
                <SelectTrigger className="text-xs"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
                <SelectContent>{articles?.map(a => <SelectItem key={a.id} value={a.id}>{a.article_no}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bengali text-muted-foreground">রঙ</label>
              <Select value={item.color_id} onValueChange={v => updateItem(idx, "color_id", v)}>
                <SelectTrigger className="text-xs"><SelectValue placeholder="রঙ" /></SelectTrigger>
                <SelectContent>{colors?.map(c => <SelectItem key={c.id} value={c.id}>{c.name_bn}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-[10px] font-bengali text-muted-foreground">কার্টন</label><Input type="number" value={item.cartons || ""} onChange={e => updateItem(idx, "cartons", Number(e.target.value))} className="text-xs" /></div>
            <div><label className="text-[10px] font-bengali text-muted-foreground">জোড়া</label><Input type="number" value={item.pairs || ""} readOnly className="text-xs bg-muted" /></div>
            <div><label className="text-[10px] font-bengali text-muted-foreground">দর</label><Input type="number" value={item.rate || ""} onChange={e => updateItem(idx, "rate", Number(e.target.value))} className="text-xs" /></div>
            <div className="flex items-end gap-1">
              <div className="flex-1"><label className="text-[10px] font-bengali text-muted-foreground">মোট</label><Input value={item.amount} readOnly className="text-xs bg-muted font-bold" /></div>
              {items.length > 1 && <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeItem(idx)}><Trash2 className="w-4 h-4" /></Button>}
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem} className="font-bengali"><Plus className="w-4 h-4 mr-1" />আরো যোগ করুন</Button>
      </div>

      {/* Charges */}
      <div className="bg-card p-4 rounded-xl border">
        <h3 className="font-bold font-bengali mb-3">চার্জ হিসাব</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="text-xs font-bengali text-muted-foreground">সাবটোটাল</label><Input value={subtotal} readOnly className="bg-muted font-bold" /></div>
          <div><label className="text-xs font-bengali text-muted-foreground">কমিশন %</label><Input type="number" value={commission || ""} onChange={e => setCommission(Number(e.target.value))} /></div>
          <div><label className="text-xs font-bengali text-muted-foreground">ভাড়া</label><Input type="number" value={transport || ""} onChange={e => setTransport(Number(e.target.value))} /></div>
          <div><label className="text-xs font-bengali text-muted-foreground">লেছ</label><Input type="number" value={deduction || ""} onChange={e => setDeduction(Number(e.target.value))} /></div>
        </div>
        <div className="mt-3 p-3 gradient-stat-blue rounded-xl text-white text-center">
          <p className="text-xs opacity-70 font-bengali">মোট বিল</p>
          <p className="text-2xl font-extrabold font-bengali">৳{totalBill.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-card p-4 rounded-xl border">
        <h3 className="font-bold font-bengali mb-3">পেমেন্ট</h3>
        <div className="space-y-2">
          <div className="flex justify-between font-bengali"><span>সাবেক বাকি:</span><span className="text-destructive font-bold">৳{previousDue.toLocaleString()}</span></div>
          <div className="flex justify-between font-bengali"><span>নতুন বিল:</span><span className="font-bold">৳{totalBill.toLocaleString()}</span></div>
          <hr />
          <div className="flex justify-between font-bengali text-lg"><span className="font-bold">মোট দেনা:</span><span className="text-destructive font-extrabold">৳{totalDue.toLocaleString()}</span></div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div><label className="text-xs font-bengali text-muted-foreground">জমা দিলেন</label><Input type="number" value={paidAmount || ""} onChange={e => setPaidAmount(Number(e.target.value))} className="text-lg font-bold" /></div>
          <div>
            <label className="text-xs font-bengali text-muted-foreground">পেমেন্ট মোড</label>
            <div className="flex gap-2 mt-1">
              <button onClick={() => setPaymentMode("cash")} className={`flex-1 py-2 rounded-lg text-sm font-bengali font-bold border-2 ${paymentMode === "cash" ? "border-stat-green bg-stat-green/10" : "border-border"}`}>নগদ</button>
              <button onClick={() => setPaymentMode("bank")} className={`flex-1 py-2 rounded-lg text-sm font-bengali font-bold border-2 ${paymentMode === "bank" ? "border-stat-purple bg-stat-purple/10" : "border-border"}`}>ব্যাংক</button>
            </div>
          </div>
        </div>
        {paymentMode === "bank" && (
          <div className="mt-2"><Select value={bankId} onValueChange={setBankId}><SelectTrigger><SelectValue placeholder="ব্যাংক নির্বাচন" /></SelectTrigger>
            <SelectContent>{banks?.map(b => <SelectItem key={b.id} value={b.id}>{b.bank_name}</SelectItem>)}</SelectContent></Select></div>
        )}
        <div className={`mt-3 p-3 rounded-xl text-white text-center ${currentDue > 0 ? "gradient-stat-red" : "gradient-stat-green"}`}>
          <p className="text-xs opacity-70 font-bengali">বর্তমান বাকি</p>
          <p className="text-2xl font-extrabold font-bengali">৳{currentDue.toLocaleString()}</p>
        </div>
      </div>

      {/* ✅ Custom Fields + Attachment */}
      <div className="bg-card p-4 rounded-xl border space-y-3">
        <h3 className="font-bold font-bengali">অতিরিক্ত তথ্য</h3>
        <EntryCustomFields module="sales" entryId={activeEntryId} />
        <EntryAttachment module="sales" entryId={activeEntryId} />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 py-6 font-bengali" onClick={() => navigate("/sales/list")}>বাতিল</Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="flex-1 py-6 text-lg font-bold font-bengali bg-success hover:bg-success/90 text-success-foreground">
          {saveMutation.isPending ? "সংরক্ষণ হচ্ছে..." : isEdit ? "আপডেট করুন" : "বিক্রয় সংরক্ষণ করুন"}
        </Button>
      </div>
    </div>
  );
};

export default SalesNewPage;