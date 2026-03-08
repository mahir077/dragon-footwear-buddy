import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const InvoiceNewPage = () => {
  const [saleId, setSaleId] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: sales } = useQuery({
    queryKey: ["sales-for-invoice"],
    queryFn: async () => { const { data } = await supabase.from("sales").select("*, parties(name, address, mobile)").order("date", { ascending: false }); return data || []; },
  });

  const { data: saleItems } = useQuery({
    queryKey: ["sale-items", saleId],
    queryFn: async () => {
      if (!saleId) return [];
      const { data } = await supabase.from("sale_items").select("*, articles(article_no), colors(name_bn)").eq("sale_id", saleId);
      return data || [];
    },
    enabled: !!saleId,
  });

  const { data: partyBalance } = useQuery({
    queryKey: ["invoice-party-balance", saleId],
    queryFn: async () => {
      const sale = sales?.find(s => s.id === saleId);
      if (!sale?.party_id) return null;
      const { data } = await supabase.from("v_party_balance").select("*").eq("party_id", sale.party_id).single();
      return data;
    },
    enabled: !!saleId,
  });

  const sale = sales?.find(s => s.id === saleId);
  const totalCartons = (saleItems || []).reduce((s, i) => s + (i.cartons || 0), 0);
  const totalPairs = (saleItems || []).reduce((s, i) => s + (i.pairs || 0), 0);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>Invoice</title><style>body{font-family:'Noto Sans Bengali',sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.text-right{text-align:right}.font-bold{font-weight:bold}.text-red{color:#dc2626}</style></head><body>${content.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold font-bengali">ইনভয়েস</h1><p className="text-sm text-muted-foreground">Invoice</p></div>
        {saleId && <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" />প্রিন্ট</Button>}
      </div>

      <Select value={saleId} onValueChange={setSaleId}>
        <SelectTrigger className="w-full md:w-96 font-bengali"><SelectValue placeholder="বিক্রয় নির্বাচন করুন (মেমো/পার্টি)" /></SelectTrigger>
        <SelectContent>{sales?.map(s => <SelectItem key={s.id} value={s.id}>{s.memo_no} — {(s as any).parties?.name || "N/A"} — {s.date}</SelectItem>)}</SelectContent>
      </Select>

      {sale && (
        <div ref={printRef} className="bg-card border rounded-xl p-6 space-y-4">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <h2 className="text-xl font-extrabold font-bengali">ড্রাগন পিউ ফুটওয়্যার</h2>
            <p className="text-sm text-muted-foreground">Dragon Pew Footwear</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground font-bengali">মেমো নং:</span> <strong>{sale.memo_no}</strong></div>
            <div className="text-right"><span className="text-muted-foreground font-bengali">তারিখ:</span> <strong>{sale.date}</strong></div>
            <div><span className="text-muted-foreground font-bengali">পার্টি:</span> <strong className="font-bengali">{(sale as any).parties?.name}</strong></div>
            <div className="text-right"><span className="text-muted-foreground font-bengali">সিজন:</span> <strong>{sale.season}</strong></div>
            <div className="col-span-2"><span className="text-muted-foreground font-bengali">ঠিকানা:</span> {(sale as any).parties?.address}</div>
          </div>

          {/* Items Table */}
          <table className="w-full text-sm border">
            <thead className="bg-muted"><tr className="font-bengali">
              <th className="p-2 border text-left">আর্টিকেল</th><th className="p-2 border text-left">রঙ</th>
              <th className="p-2 border text-right">কার্টন</th><th className="p-2 border text-right">জোড়া</th>
              <th className="p-2 border text-right">দর</th><th className="p-2 border text-right">টাকা</th>
            </tr></thead>
            <tbody>
              {saleItems?.map(item => (
                <tr key={item.id}>
                  <td className="p-2 border">{(item as any).articles?.article_no}</td>
                  <td className="p-2 border font-bengali">{(item as any).colors?.name_bn}</td>
                  <td className="p-2 border text-right">{item.cartons}</td>
                  <td className="p-2 border text-right">{item.pairs}</td>
                  <td className="p-2 border text-right">৳{item.rate}</td>
                  <td className="p-2 border text-right font-bold">৳{item.amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-muted font-bold">
                <td className="p-2 border font-bengali" colSpan={2}>মোট</td>
                <td className="p-2 border text-right">{totalCartons}</td>
                <td className="p-2 border text-right">{totalPairs}</td>
                <td className="p-2 border"></td>
                <td className="p-2 border text-right">৳{(sale.subtotal || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {/* Summary */}
          <div className="space-y-1 text-sm border-t pt-3">
            <div className="flex justify-between font-bengali"><span>মোট বিল:</span><span className="font-bold">৳{(sale.subtotal || 0).toLocaleString()}</span></div>
            {(sale.commission || 0) > 0 && <div className="flex justify-between font-bengali"><span>কমিশন (-):</span><span>৳{(sale.commission || 0).toLocaleString()}</span></div>}
            {(sale.transport || 0) > 0 && <div className="flex justify-between font-bengali"><span>ভাড়া:</span><span>৳{(sale.transport || 0).toLocaleString()}</span></div>}
            {(sale.deduction || 0) > 0 && <div className="flex justify-between font-bengali"><span>লেছ (-):</span><span>৳{(sale.deduction || 0).toLocaleString()}</span></div>}
            <hr />
            <div className="flex justify-between font-bengali font-bold text-lg"><span>নেট বিল:</span><span>৳{(sale.total_bill || 0).toLocaleString()}</span></div>
            {partyBalance && <div className="flex justify-between font-bengali"><span>সাবেক বাকি:</span><span className="text-destructive">৳{((partyBalance.current_balance || 0) - (sale.total_bill || 0) + (sale.paid_amount || 0)).toLocaleString()}</span></div>}
            <div className="flex justify-between font-bengali"><span>জমা:</span><span className="text-success font-bold">৳{(sale.paid_amount || 0).toLocaleString()}</span></div>
            <hr />
            <div className="flex justify-between font-bengali font-bold text-lg"><span>বর্তমান বাকি:</span><span className="text-destructive">৳{((sale.total_bill || 0) - (sale.paid_amount || 0)).toLocaleString()}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceNewPage;
