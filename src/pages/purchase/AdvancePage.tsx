import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import EntryAttachment from "@/components/EntryAttachment";

const toBn = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);
const months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

const AdvancePage = () => {
  const qc = useQueryClient();
  const now = new Date();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [suppId, setSuppId] = useState("");
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState("given");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editAmount, setEditAmount] = useState(0);
  const [editNote, setEditNote] = useState("");
  const [filterSupp, setFilterSupp] = useState("all");
  const [monthFilter, setMonthFilter] = useState(String(now.getMonth() + 1));
  const [yearFilter, setYearFilter] = useState(String(now.getFullYear()));

  const startDate = `${yearFilter}-${monthFilter.padStart(2, "0")}-01`;
  const endDate = `${yearFilter}-${monthFilter.padStart(2, "0")}-31`;

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data } = await supabase.from("parties").select("*").in("type", ["supplier", "both"]);
      return data || [];
    },
  });

  const { data: advances = [] } = useQuery({
    queryKey: ["supplier_advances", filterSupp, monthFilter, yearFilter],
    queryFn: async () => {
      let q = supabase.from("supplier_advances")
        .select("*, parties:supplier_id(name)")
        .order("date", { ascending: true })
        .gte("date", startDate)
        .lte("date", endDate);
      if (filterSupp !== "all") q = q.eq("supplier_id", filterSupp);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: activeYear } = useQuery({
    queryKey: ["activeYear"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).maybeSingle();
      return data;
    },
  });

  const resetForm = () => {
    setShowForm(false); setEditId(null);
    setSuppId(""); setAmount(0); setNote("");
    setDate(format(new Date(), "yyyy-MM-dd")); setType("given");
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!suppId) throw new Error("সরবরাহকারী নির্বাচন করুন");
      if (!amount || amount <= 0) throw new Error("পরিমাণ দিন");
      if (editId) {
        const { error } = await supabase.from("supplier_advances").update({ amount, note: note || null }).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("supplier_advances").insert({
          supplier_id: suppId, amount, type, date, note: note || null, year_id: activeYear?.id || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "আপডেট হয়েছে ✅" : "সংরক্ষিত হয়েছে ✅");
      qc.invalidateQueries({ queryKey: ["supplier_advances"] });
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("supplier_advances").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: ["supplier_advances"] });
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (a: any) => {
    setEditId(a.id);
    setEditAmount(Number(a.amount));
    setEditNote(a.note || "");
  };

  const saveInlineEdit = async (id: string) => {
    const { error } = await supabase.from("supplier_advances").update({ amount: editAmount, note: editNote || null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("আপডেট হয়েছে ✅");
    qc.invalidateQueries({ queryKey: ["supplier_advances"] });
    setEditId(null);
  };

  const advancesWithBalance = advances.reduce((acc: any[], a: any) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].runningBalance : 0;
    const runningBalance = a.type === "given" ? prev + Number(a.amount) : prev - Number(a.amount);
    acc.push({ ...a, runningBalance });
    return acc;
  }, []).reverse();

  const totalGiven = advances.filter((a: any) => a.type === "given").reduce((s, a) => s + Number(a.amount), 0);
  const totalReturned = advances.filter((a: any) => a.type === "returned").reduce((s, a) => s + Number(a.amount), 0);
  const netBalance = totalGiven - totalReturned;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-bengali">সরবরাহকারী অগ্রিম</h1>
          <p className="text-xs text-muted-foreground">Supplier Advance</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700 text-white font-bengali text-sm">
            <Plus className="w-4 h-4 mr-1" /> নতুন অগ্রিম
          </Button>
        )}
      </div>

      {showForm && (
        <div className="border rounded-xl p-4 mb-4 bg-muted/30 space-y-3">
          <h2 className="font-bengali font-semibold text-sm">নতুন অগ্রিম এন্ট্রি</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="font-bengali text-xs">সরবরাহকারী *</Label>
              <Select value={suppId} onValueChange={setSuppId}>
                <SelectTrigger className="font-bengali"><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>{suppliers?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-bengali text-xs">তারিখ</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="font-bengali text-xs">ধরন</Label>
            <div className="flex gap-2 mt-1">
              <button onClick={() => setType("given")}
                className={`flex-1 py-2 rounded-lg font-bengali text-sm font-bold transition-colors ${type === "given" ? "bg-blue-600 text-white" : "bg-muted"}`}>
                💸 দেওয়া
              </button>
              <button onClick={() => setType("returned")}
                className={`flex-1 py-2 rounded-lg font-bengali text-sm font-bold transition-colors ${type === "returned" ? "bg-green-600 text-white" : "bg-muted"}`}>
                ↩️ ফেরত
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="font-bengali text-xs">পরিমাণ *</Label>
              <Input type="number" value={amount || ""} onChange={(e) => setAmount(+e.target.value)} placeholder="০" />
            </div>
            <div>
              <Label className="font-bengali text-xs">নোট</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ঐচ্ছিক" className="font-bengali" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
              className="bg-green-600 hover:bg-green-700 text-white font-bengali">সংরক্ষণ করুন</Button>
            <Button variant="outline" onClick={resetForm} className="font-bengali">বাতিল</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p className="text-xs font-bengali text-blue-600">মোট দেওয়া</p>
          <p className="text-lg font-bold text-blue-700">৳{toBn(totalGiven)}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-xs font-bengali text-green-600">মোট ফেরত</p>
          <p className="text-lg font-bold text-green-700">৳{toBn(totalReturned)}</p>
        </div>
        <div className={`border rounded-xl p-3 text-center ${netBalance > 0 ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"}`}>
          <p className="text-xs font-bengali text-muted-foreground">নেট ব্যালেন্স</p>
          <p className={`text-lg font-bold ${netBalance > 0 ? "text-orange-700" : "text-gray-700"}`}>৳{toBn(netBalance)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bengali text-muted-foreground">মাস</span>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
            className="border rounded-xl px-4 py-2 text-base font-bengali">
            {months.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bengali text-muted-foreground">বছর</span>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
            className="border rounded-xl px-4 py-2 text-base font-bengali">
            {[2024, 2025, 2026].map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bengali text-muted-foreground">সরবরাহকারী</span>
          <Select value={filterSupp} onValueChange={setFilterSupp}>
            <SelectTrigger className="w-44 font-bengali"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব সরবরাহকারী</SelectItem>
              {suppliers?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bengali">তারিখ</TableHead>
              <TableHead className="font-bengali">সরবরাহকারী</TableHead>
              <TableHead className="font-bengali">ধরন</TableHead>
              <TableHead className="font-bengali text-right">দেওয়া</TableHead>
              <TableHead className="font-bengali text-right">ফেরত</TableHead>
              <TableHead className="font-bengali text-right">ব্যালেন্স</TableHead>
              <TableHead className="font-bengali">নোট</TableHead>
              <TableHead className="text-center font-bengali">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {advancesWithBalance.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center font-bengali py-6">কোনো অগ্রিম নেই</TableCell></TableRow>
            ) : advancesWithBalance.map((a: any) => {
              const isEditing = editId === a.id;
              return (
                <>
                  <TableRow key={a.id}>
                    <TableCell className="text-xs">{a.date}</TableCell>
                    <TableCell className="text-xs font-bengali">{a.parties?.name || "-"}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-bengali px-2 py-0.5 rounded-full ${a.type === "given" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                        {a.type === "given" ? "দেওয়া" : "ফেরত"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {a.type === "given" ? `৳${toBn(Number(a.amount))}` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {a.type === "returned" ? `৳${toBn(Number(a.amount))}` : "—"}
                    </TableCell>
                    <TableCell className={`text-right text-xs font-bold ${a.runningBalance > 0 ? "text-orange-600" : "text-green-600"}`}>
                      ৳{toBn(a.runningBalance)}
                    </TableCell>
                    <TableCell className="text-xs font-bengali">
                      {isEditing ? (
                        <Input value={editNote} onChange={(e) => setEditNote(e.target.value)}
                          className="w-28 text-xs h-7" placeholder="নোট" />
                      ) : a.note || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {deleteId === a.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs font-bengali text-destructive">মুছবো?</span>
                          <button onClick={() => deleteMut.mutate(a.id)}
                            className="p-1 rounded bg-destructive text-white hover:opacity-80"><Check className="w-3 h-3" /></button>
                          <button onClick={() => setDeleteId(null)}
                            className="p-1 rounded bg-muted hover:opacity-80"><X className="w-3 h-3" /></button>
                        </div>
                      ) : isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => saveInlineEdit(a.id)}
                            className="p-1 rounded bg-green-600 text-white hover:opacity-80"><Check className="w-3 h-3" /></button>
                          <button onClick={() => setEditId(null)}
                            className="p-1 rounded bg-muted hover:opacity-80"><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => startEdit(a)}
                            className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors">
                            <Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteId(a.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                  {/* ✅ Attachment */}
                  <TableRow key={`${a.id}-attach`}>
                    <TableCell colSpan={8} className="px-3 pb-2 pt-0">
                      <EntryAttachment module="supplier_advance" entryId={a.id} />
                    </TableCell>
                  </TableRow>
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdvancePage;