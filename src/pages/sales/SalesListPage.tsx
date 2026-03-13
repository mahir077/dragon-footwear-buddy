import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Printer, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const SalesListPage = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [partyFilter, setPartyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: sales = [] } = useQuery({
    queryKey: ["sales-list", partyFilter, typeFilter],
    queryFn: async () => {
      let q = supabase.from("sales").select("*, parties(name)").order("date", { ascending: false });
      if (partyFilter !== "all") q = q.eq("party_id", partyFilter);
      if (typeFilter !== "all") q = q.eq("sale_type", typeFilter);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: parties = [] } = useQuery({
    queryKey: ["parties-all"],
    queryFn: async () => {
      const { data } = await supabase.from("parties").select("*");
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("sale_items").delete().eq("sale_id", id);
      await supabase.from("stock_movements").delete().eq("reference_id", id);
      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-list"] });
      setDeleteId(null);
      toast({ title: "বিক্রয় মুছে ফেলা হয়েছে" });
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const totals = sales.reduce((acc, s) => ({
    totalBill: acc.totalBill + (s.total_bill || 0),
    totalPaid: acc.totalPaid + (s.paid_amount || 0),
    totalDue: acc.totalDue + ((s.total_bill || 0) - (s.paid_amount || 0)),
  }), { totalBill: 0, totalPaid: 0, totalDue: 0 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-bengali">বিক্রয় তালিকা</h1>
          <p className="text-sm text-muted-foreground">Sales List</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-1" />প্রিন্ট
        </Button>
      </div>

      <div className="flex gap-3">
        <select value={partyFilter} onChange={(e) => setPartyFilter(e.target.value)}
          className="border rounded-xl px-4 py-2 text-base font-bengali">
          <option value="all">সব পার্টি</option>
          {parties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded-xl px-4 py-2 text-base font-bengali">
          <option value="all">সব ধরন</option>
          <option value="cash">নগদ</option>
          <option value="credit">বাকি</option>
          <option value="lot">লট</option>
          <option value="cut_size">কাটসাইজ</option>
          <option value="single_pair">একপা</option>
          <option value="b_grade">বি-মাল</option>
        </select>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="font-bengali">
              <th className="p-3 text-left">তারিখ</th>
              <th className="p-3 text-left">মেমো</th>
              <th className="p-3 text-left">পার্টি</th>
              <th className="p-3 text-left">ধরন</th>
              <th className="p-3 text-right">মোট বিল</th>
              <th className="p-3 text-right">জমা</th>
              <th className="p-3 text-right">বাকি</th>
              <th className="p-3 text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center font-bengali text-muted-foreground">কোনো বিক্রয় নেই</td></tr>
            )}
            {sales.map((s: any) => {
              const due = (s.total_bill || 0) - (s.paid_amount || 0);
              return (
                <tr key={s.id} className={`border-t ${due > 0 ? "bg-destructive/5" : ""}`}>
                  <td className="p-3">{s.date}</td>
                  <td className="p-3">{s.memo_no}</td>
                  <td className="p-3 font-bengali">{s.parties?.name || "—"}</td>
                  <td className="p-3 font-bengali">{s.sale_type}</td>
                  <td className="p-3 text-right font-bold">৳{(s.total_bill || 0).toLocaleString()}</td>
                  <td className="p-3 text-right font-bold text-green-600">৳{(s.paid_amount || 0).toLocaleString()}</td>
                  <td className={`p-3 text-right font-bold ${due > 0 ? "text-destructive" : ""}`}>৳{due.toLocaleString()}</td>
                  <td className="p-3 text-center">
                    {deleteId === s.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs font-bengali text-destructive">মুছবো?</span>
                        <button onClick={() => deleteMutation.mutate(s.id)}
                          className="p-1 rounded bg-destructive text-white hover:opacity-80">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => setDeleteId(null)}
                          className="p-1 rounded bg-muted hover:opacity-80">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => navigate(`/sales/new?edit=${s.id}`)}
                          className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(s.id)}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-muted font-bold font-bengali">
            <tr>
              <td colSpan={4} className="p-3">মোট ({sales.length} টি)</td>
              <td className="p-3 text-right">৳{totals.totalBill.toLocaleString()}</td>
              <td className="p-3 text-right text-green-600">৳{totals.totalPaid.toLocaleString()}</td>
              <td className="p-3 text-right text-destructive">৳{totals.totalDue.toLocaleString()}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default SalesListPage;