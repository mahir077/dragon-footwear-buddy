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
    queryFn: async () => {
      const { data } = await supabase.from("sales")
        .select("*, parties(name, address, mobile)")
        .order("date", { ascending: false });
      return data || [];
    },
  });

  const { data: saleItems } = useQuery({
    queryKey: ["sale-items", saleId],
    queryFn: async () => {
      if (!saleId) return [];
      const { data } = await supabase.from("sale_items")
        .select("*, articles(article_no), colors(name_bn)")
        .eq("sale_id", saleId);
      return data || [];
    },
    enabled: !!saleId,
  });

  const { data: partyBalance } = useQuery({
    queryKey: ["invoice-party-balance", saleId],
    queryFn: async () => {
      const sale = sales?.find(s => s.id === saleId);
      if (!sale?.party_id) return null;
      const { data } = await supabase.from("v_party_balance")
        .select("*").eq("party_id", sale.party_id).single();
      return data;
    },
    enabled: !!saleId,
  });

  const sale = sales?.find(s => s.id === saleId);
  const totalCartons = (saleItems || []).reduce((s, i) => s + (i.cartons || 0), 0);
  const totalPairs = (saleItems || []).reduce((s, i) => s + (i.pairs || 0), 0);
  const previousDue = partyBalance
    ? ((partyBalance.current_balance || 0) - (sale?.total_bill || 0) + (sale?.paid_amount || 0))
    : 0;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
      <head>
        <title>Invoice — ${sale?.memo_no || ""}</title>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Noto Sans Bengali', sans-serif;
            font-size: 13px;
            color: #000;
            background: #fff;
            padding: 20px;
          }
          .invoice-wrapper { max-width: 780px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 12px; }
          .header h1 { font-size: 20px; font-weight: 700; }
          .header p { font-size: 12px; color: #555; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin-bottom: 14px; font-size: 13px; }
          .meta-grid .label { color: #555; }
          .meta-grid .full-row { grid-column: 1 / -1; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 13px; }
          th, td { border: 1px solid #aaa; padding: 6px 8px; }
          th { background: #f0f0f0; font-weight: 600; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .summary { margin-left: auto; width: 300px; font-size: 13px; }
          .summary-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #ccc; }
          .summary-row.total { border-bottom: 2px solid #000; border-top: 2px solid #000; padding: 6px 0; font-weight: 700; font-size: 15px; }
          .summary-row.red { color: #dc2626; }
          .summary-row.green { color: #16a34a; }
          .footer { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; gap: 20px; }
          .footer div { border-top: 1px solid #000; padding-top: 6px; font-size: 12px; }
          @media print {
            body { padding: 10px; }
            @page { margin: 10mm; size: A4; }
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-bengali">ইনভয়েস</h1>
          <p className="text-sm text-muted-foreground">Invoice / Memo</p>
        </div>
        {saleId && (
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" />প্রিন্ট / PDF
          </Button>
        )}
      </div>

      {/* Sale selector */}
      <Select value={saleId} onValueChange={setSaleId}>
        <SelectTrigger className="w-full md:w-96 font-bengali">
          <SelectValue placeholder="বিক্রয় নির্বাচন করুন (মেমো/পার্টি)" />
        </SelectTrigger>
        <SelectContent>
          {sales?.map(s => (
            <SelectItem key={s.id} value={s.id}>
              {s.memo_no} — {(s as any).parties?.name || "N/A"} — {s.date}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Invoice Preview */}
      {sale && (
        <div ref={printRef} className="invoice-wrapper bg-white border rounded-xl p-6 space-y-4 text-black">

          {/* Header */}
          <div className="header text-center border-b-2 border-black pb-3">
            <h1 className="text-xl font-extrabold font-bengali">ড্রাগন পিউ ফুটওয়্যার</h1>
            <p className="text-sm text-gray-500">Dragon Pew Footwear — Savar, Dhaka</p>
          </div>

          {/* Meta info */}
          <div className="meta-grid grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <div>
              <span className="label text-gray-500 font-bengali">মেমো নং: </span>
              <strong>{sale.memo_no}</strong>
            </div>
            <div className="text-right">
              <span className="label text-gray-500 font-bengali">তারিখ: </span>
              <strong>{sale.date}</strong>
            </div>
            <div>
              <span className="label text-gray-500 font-bengali">পার্টি: </span>
              <strong className="font-bengali">{(sale as any).parties?.name}</strong>
            </div>
            <div className="text-right">
              <span className="label text-gray-500 font-bengali">সিজন: </span>
              <strong className="font-bengali">{sale.season || "—"}</strong>
            </div>
            {(sale as any).parties?.mobile && (
              <div>
                <span className="label text-gray-500 font-bengali">মোবাইল: </span>
                {(sale as any).parties?.mobile}
              </div>
            )}
            {(sale as any).parties?.address && (
              <div className="col-span-2">
                <span className="label text-gray-500 font-bengali">ঠিকানা: </span>
                <span className="font-bengali">{(sale as any).parties?.address}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <table className="w-full text-sm border border-gray-300">
            <thead className="bg-gray-100">
              <tr className="font-bengali">
                <th className="p-2 border border-gray-300 text-left">#</th>
                <th className="p-2 border border-gray-300 text-left">আর্টিকেল</th>
                <th className="p-2 border border-gray-300 text-left">রঙ</th>
                <th className="p-2 border border-gray-300 text-right">কার্টন</th>
                <th className="p-2 border border-gray-300 text-right">জোড়া</th>
                <th className="p-2 border border-gray-300 text-right">দর (৳)</th>
                <th className="p-2 border border-gray-300 text-right">মোট (৳)</th>
              </tr>
            </thead>
            <tbody>
              {saleItems?.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="p-2 border border-gray-300 text-center text-gray-500">{idx + 1}</td>
                  <td className="p-2 border border-gray-300 font-mono">{(item as any).articles?.article_no || "—"}</td>
                  <td className="p-2 border border-gray-300 font-bengali">{(item as any).colors?.name_bn || "—"}</td>
                  <td className="p-2 border border-gray-300 text-right">{item.cartons || 0}</td>
                  <td className="p-2 border border-gray-300 text-right">{item.pairs || 0}</td>
                  <td className="p-2 border border-gray-300 text-right">{(item.rate || 0).toLocaleString()}</td>
                  <td className="p-2 border border-gray-300 text-right font-bold">{(item.amount || 0).toLocaleString()}</td>
                </tr>
              ))}

              {/* Total row */}
              <tr className="bg-gray-100 font-bold">
                <td className="p-2 border border-gray-300 font-bengali text-center" colSpan={3}>মোট</td>
                <td className="p-2 border border-gray-300 text-right">{totalCartons}</td>
                <td className="p-2 border border-gray-300 text-right">{totalPairs}</td>
                <td className="p-2 border border-gray-300"></td>
                <td className="p-2 border border-gray-300 text-right">৳{(sale.subtotal || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {/* Summary */}
          <div className="summary ml-auto w-72 space-y-1 text-sm">
            <div className="summary-row flex justify-between py-1 border-b border-dashed border-gray-300">
              <span className="font-bengali">মোট বিল:</span>
              <span className="font-bold">৳{(sale.subtotal || 0).toLocaleString()}</span>
            </div>
            {(sale.commission || 0) > 0 && (
              <div className="summary-row flex justify-between py-1 border-b border-dashed border-gray-300 text-red-600">
                <span className="font-bengali">কমিশন (−):</span>
                <span>৳{(sale.commission || 0).toLocaleString()}</span>
              </div>
            )}
            {(sale.transport || 0) > 0 && (
              <div className="summary-row flex justify-between py-1 border-b border-dashed border-gray-300">
                <span className="font-bengali">ভাড়া:</span>
                <span>৳{(sale.transport || 0).toLocaleString()}</span>
              </div>
            )}
            {(sale.deduction || 0) > 0 && (
              <div className="summary-row flex justify-between py-1 border-b border-dashed border-gray-300 text-red-600">
                <span className="font-bengali">ছেড় / লেছ (−):</span>
                <span>৳{(sale.deduction || 0).toLocaleString()}</span>
              </div>
            )}

            {/* Net Bill */}
            <div className="flex justify-between py-2 border-t-2 border-b-2 border-black font-bold text-base">
              <span className="font-bengali">নেট বিল:</span>
              <span>৳{(sale.total_bill || 0).toLocaleString()}</span>
            </div>

            {/* Previous due */}
            {previousDue > 0 && (
              <div className="flex justify-between py-1 border-b border-dashed border-gray-300 text-red-600">
                <span className="font-bengali">সাবেক বাকি:</span>
                <span className="font-bold">৳{previousDue.toLocaleString()}</span>
              </div>
            )}

            {/* Paid */}
            <div className="flex justify-between py-1 border-b border-dashed border-gray-300 text-green-700">
              <span className="font-bengali">জমা:</span>
              <span className="font-bold">৳{(sale.paid_amount || 0).toLocaleString()}</span>
            </div>

            {/* Current due */}
            <div className="flex justify-between py-2 border-t-2 border-b-2 border-black font-bold text-base text-red-600">
              <span className="font-bengali">বর্তমান বাকি:</span>
              <span>৳{((sale.total_bill || 0) - (sale.paid_amount || 0)).toLocaleString()}</span>
            </div>
          </div>

          {/* Footer signatures */}
          <div className="footer grid grid-cols-3 gap-8 mt-8 pt-2">
            <div className="border-t border-black pt-2 text-center text-xs font-bengali">
              গ্রহণকারীর স্বাক্ষর
            </div>
            <div className="border-t border-black pt-2 text-center text-xs font-bengali">
              হিসাবরক্ষকের স্বাক্ষর
            </div>
            <div className="border-t border-black pt-2 text-center text-xs font-bengali">
              কর্তৃপক্ষের স্বাক্ষর
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceNewPage;