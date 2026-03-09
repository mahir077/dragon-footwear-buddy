import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, ArrowLeft } from "lucide-react";

type RegKey = "sales" | "purchases" | "cash" | "bank" | "loan" | "production" | "damage" | "advance" | "fdr" | "short_carton";

const registers: { key: RegKey; icon: string; label: string }[] = [
  { key: "sales", icon: "📒", label: "বিক্রয় রেজিস্টার" },
  { key: "purchases", icon: "🛒", label: "ক্রয় রেজিস্টার" },
  { key: "cash", icon: "💵", label: "নগদ রেজিস্টার" },
  { key: "bank", icon: "🏦", label: "ব্যাংক রেজিস্টার" },
  { key: "loan", icon: "💳", label: "লোন রেজিস্টার" },
  { key: "production", icon: "📦", label: "উৎপাদন রেজিস্টার" },
  { key: "damage", icon: "⚠️", label: "ড্যামেজ রেজিস্টার" },
  { key: "advance", icon: "💼", label: "অগ্রিম রেজিস্টার" },
  { key: "fdr", icon: "🏭", label: "FDR রেজিস্টার" },
  { key: "short_carton", icon: "📋", label: "শর্ট কার্টন রেজিস্টার" },
];

const RegisterPage = () => {
  const [active, setActive] = useState<RegKey | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + "01";
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);

  const { data = [], isLoading } = useQuery({
    queryKey: ["register", active, from, to],
    enabled: !!active,
    queryFn: async () => {
      if (!active) return [];
      switch (active) {
        case "sales": {
          const { data } = await supabase.from("sales").select("*").gte("date", from).lte("date", to).order("date", { ascending: false });
          return (data || []).map((r: any) => ({ তারিখ: r.date, মেমো: r.memo_no, ধরন: r.sale_type, মোট: r.total_bill, পরিশোধ: r.paid_amount }));
        }
        case "purchases": {
          const { data } = await supabase.from("purchases").select("*").gte("date", from).lte("date", to).order("date", { ascending: false });
          return (data || []).map((r: any) => ({ তারিখ: r.date, মেমো: r.memo_no, মোট: r.total, পরিশোধ: r.paid_amount }));
        }
        case "cash": {
          const { data } = await supabase.from("daily_transactions").select("*").is("bank_id", null).gte("date", from).lte("date", to).order("date", { ascending: false });
          return (data || []).map((r: any) => ({ তারিখ: r.date, ধরন: r.type, পরিমাণ: r.amount, নোট: r.note }));
        }
        case "bank": {
          const { data } = await supabase.from("daily_transactions").select("*").not("bank_id", "is", null).gte("date", from).lte("date", to).order("date", { ascending: false });
          return (data || []).map((r: any) => ({ তারিখ: r.date, ধরন: r.type, পরিমাণ: r.amount, নোট: r.note }));
        }
        case "loan": {
          const { data } = await supabase.from("loan_transactions").select("*").gte("date", from).lte("date", to).order("date", { ascending: false });
          return (data || []).map((r: any) => ({ তারিখ: r.date, ধরন: r.type, পরিমাণ: r.amount, নোট: r.note }));
        }
        case "production": {
          const { data } = await supabase.from("productions").select("*").gte("date", from).lte("date", to).order("date", { ascending: false });
          return (data || []).map((r: any) => ({ তারিখ: r.date, পূর্ণ_কার্টন: r.full_cartons, শর্ট: r.short_cartons, জোড়া: r.pairs_count }));
        }
        case "damage": {
          const { data } = await supabase.from("damage_items").select("*").gte("date", from).lte("date", to).order("date", { ascending: false });
          return (data || []).map((r: any) => ({ তারিখ: r.date, কার্টন: r.cartons, জোড়া: r.pairs, কারণ: r.reason }));
        }
        case "advance": {
          const { data } = await supabase.from("salary_advances").select("*").gte("date", from).lte("date", to).order("date", { ascending: false });
          return (data || []).map((r: any) => ({ তারিখ: r.date, পরিমাণ: r.amount, নোট: r.note }));
        }
        case "fdr": {
          const { data } = await supabase.from("fdr_transactions").select("*").gte("date", from).lte("date", to).order("date", { ascending: false });
          return (data || []).map((r: any) => ({ তারিখ: r.date, ধরন: r.type, পরিমাণ: r.amount, নোট: r.note }));
        }
        case "short_carton": {
          const { data } = await supabase.from("productions").select("*").gt("short_cartons", 0).gte("date", from).lte("date", to).order("date", { ascending: false });
          return (data || []).map((r: any) => ({ তারিখ: r.date, শর্ট_কার্টন: r.short_cartons, জোড়া: r.pairs_count, নোট: r.note }));
        }
        default: return [];
      }
    },
  });

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">📋 রেজিস্টার সমূহ</h1>

      {!active ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {registers.map((r) => (
            <Card key={r.key} className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all" onClick={() => setActive(r.key)}>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="text-2xl">{r.icon}</span>
                <span className="font-semibold text-base">{r.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setActive(null)}><ArrowLeft className="w-4 h-4 mr-1" />ফিরে যান</Button>
            <span className="font-semibold">{registers.find(r => r.key === active)?.icon} {registers.find(r => r.key === active)?.label}</span>
            <div className="flex items-center gap-2 ml-auto">
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-36" />
              <span>—</span>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-36" />
              <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="rounded-lg border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>{columns.map(c => <TableHead key={c}>{c}</TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={columns.length || 1} className="text-center py-8">লোড হচ্ছে...</TableCell></TableRow>
                ) : data.length === 0 ? (
                  <TableRow><TableCell colSpan={columns.length || 1} className="text-center text-muted-foreground py-8">কোনো তথ্য নেই</TableCell></TableRow>
                ) : (
                  data.map((row: any, i: number) => (
                    <TableRow key={i}>{columns.map(c => <TableCell key={c}>{row[c] ?? "—"}</TableCell>)}</TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
