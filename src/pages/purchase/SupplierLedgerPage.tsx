import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const toBn = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);

const SupplierLedgerPage = () => {
  const [suppId, setSuppId] = useState("");

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data } = await supabase.from("parties").select("*").in("type", ["supplier", "both"]);
      return data || [];
    },
  });

  const supplier = suppliers?.find((s) => s.id === suppId);

  const { data: purchases } = useQuery({
    queryKey: ["supplier-purchases", suppId],
    enabled: !!suppId,
    queryFn: async () => {
      const { data } = await supabase.from("purchases").select("*").eq("supplier_id", suppId).order("date");
      return data || [];
    },
  });

  let runningBal = supplier?.opening_balance || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-bengali">সরবরাহকারী লেজার</h1>
          <p className="text-xs text-muted-foreground">Supplier Ledger</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs font-bengali">
          <Printer className="w-3.5 h-3.5 mr-1" /> প্রিন্ট
        </Button>
      </div>

      <div className="max-w-sm mb-4">
        <Select value={suppId} onValueChange={setSuppId}>
          <SelectTrigger className="text-sm"><SelectValue placeholder="সরবরাহকারী নির্বাচন করুন" /></SelectTrigger>
          <SelectContent>{suppliers?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {supplier && (
        <div className="bg-muted p-3 rounded-lg mb-4 text-sm font-bengali">
          <p><strong>নাম:</strong> {supplier.name}</p>
          {supplier.address && <p><strong>ঠিকানা:</strong> {supplier.address}</p>}
          {supplier.mobile && <p><strong>মোবাইল:</strong> {supplier.mobile}</p>}
        </div>
      )}

      {suppId && (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bengali">তারিখ</TableHead>
                <TableHead className="font-bengali">মেমো</TableHead>
                <TableHead className="font-bengali text-right">ক্রয়</TableHead>
                <TableHead className="font-bengali text-right">ভাড়া</TableHead>
                <TableHead className="font-bengali text-right">পরিশোধ</TableHead>
                <TableHead className="font-bengali text-right">ব্যালেন্স</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/50">
                <TableCell colSpan={5} className="font-bengali text-sm font-semibold">Opening Balance</TableCell>
                <TableCell className="text-right font-bold text-sm">৳{toBn(runningBal)}</TableCell>
              </TableRow>
              {purchases?.map((p) => {
                runningBal += (p.total || 0) - (p.paid_amount || 0);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">{p.date}</TableCell>
                    <TableCell className="text-xs font-mono">{p.memo_no}</TableCell>
                    <TableCell className="text-right text-xs">৳{toBn(p.subtotal || 0)}</TableCell>
                    <TableCell className="text-right text-xs">৳{toBn(p.transport || 0)}</TableCell>
                    <TableCell className="text-right text-xs">৳{toBn(p.paid_amount || 0)}</TableCell>
                    <TableCell className="text-right text-xs font-bold">৳{toBn(runningBal)}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted font-bold">
                <TableCell colSpan={5} className="font-bengali">Grand Total</TableCell>
                <TableCell className="text-right text-sm">৳{toBn(runningBal)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default SupplierLedgerPage;
