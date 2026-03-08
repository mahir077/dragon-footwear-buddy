import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/setup/DeleteConfirmDialog";

const toBn = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);

const PurchaseListPage = () => {
  const qc = useQueryClient();
  const [suppFilter, setSuppFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: purchases, isLoading } = useQuery({
    queryKey: ["purchases", suppFilter],
    queryFn: async () => {
      let q = supabase.from("purchases").select("*, parties(name)").order("date", { ascending: false });
      if (suppFilter !== "all") q = q.eq("supplier_id", suppFilter);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data } = await supabase.from("parties").select("*").in("type", ["supplier", "both"]);
      return data || [];
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("purchase_items").delete().eq("purchase_id", id);
      const { error } = await supabase.from("purchases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("মুছে ফেলা হয়েছে"); qc.invalidateQueries({ queryKey: ["purchases"] }); },
  });

  const totals = (purchases || []).reduce((a, p) => ({
    total: a.total + (p.total || 0),
    paid: a.paid + (p.paid_amount || 0),
    baki: a.baki + ((p.total || 0) - (p.paid_amount || 0)),
  }), { total: 0, paid: 0, baki: 0 });

  return (
    <div>
      <h1 className="text-xl font-bold font-bengali mb-1">ক্রয় তালিকা</h1>
      <p className="text-xs text-muted-foreground mb-4">Purchase List</p>

      <div className="mb-4 max-w-xs">
        <Select value={suppFilter} onValueChange={setSuppFilter}>
          <SelectTrigger className="text-sm"><SelectValue placeholder="সরবরাহকারী ফিল্টার" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব সরবরাহকারী</SelectItem>
            {suppliers?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bengali">তারিখ</TableHead>
              <TableHead className="font-bengali">মেমো</TableHead>
              <TableHead className="font-bengali">সরবরাহকারী</TableHead>
              <TableHead className="font-bengali text-right">মোট</TableHead>
              <TableHead className="font-bengali text-right">পরিশোধ</TableHead>
              <TableHead className="font-bengali text-right">বাকি</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center font-bengali py-8">লোড হচ্ছে...</TableCell></TableRow>
            ) : purchases?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center font-bengali py-8">কোনো ক্রয় নেই</TableCell></TableRow>
            ) : purchases?.map((p) => {
              const baki = (p.total || 0) - (p.paid_amount || 0);
              return (
                <TableRow key={p.id}>
                  <TableCell className="text-xs">{p.date}</TableCell>
                  <TableCell className="text-xs font-mono">{p.memo_no}</TableCell>
                  <TableCell className="text-xs font-bengali">{(p as any).parties?.name || "-"}</TableCell>
                  <TableCell className="text-right text-xs">৳{toBn(p.total || 0)}</TableCell>
                  <TableCell className="text-right text-xs">৳{toBn(p.paid_amount || 0)}</TableCell>
                  <TableCell className={`text-right text-xs font-bold ${baki > 0 ? "text-destructive" : ""}`}>৳{toBn(baki)}</TableCell>
                  <TableCell><button onClick={() => setDeleteId(p.id)} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></button></TableCell>
                </TableRow>
              );
            })}
            {purchases && purchases.length > 0 && (
              <TableRow className="bg-muted font-bold">
                <TableCell colSpan={3} className="font-bengali text-sm">মোট</TableCell>
                <TableCell className="text-right text-sm">৳{toBn(totals.total)}</TableCell>
                <TableCell className="text-right text-sm">৳{toBn(totals.paid)}</TableCell>
                <TableCell className={`text-right text-sm ${totals.baki > 0 ? "text-destructive" : ""}`}>৳{toBn(totals.baki)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }}
        title="এই ক্রয় মুছে ফেলবেন?"
      />
    </div>
  );
};

export default PurchaseListPage;
