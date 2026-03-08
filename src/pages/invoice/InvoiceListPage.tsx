import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";

const InvoiceListPage = () => {
  const navigate = useNavigate();
  const { data: sales } = useQuery({
    queryKey: ["sales-invoices"],
    queryFn: async () => { const { data } = await supabase.from("sales").select("*, parties(name)").order("date", { ascending: false }); return data || []; },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div><h1 className="text-2xl font-extrabold font-bengali">ইনভয়েস তালিকা</h1><p className="text-sm text-muted-foreground">Invoice List</p></div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr className="font-bengali">
            <th className="p-3 text-left">তারিখ</th><th className="p-3 text-left">মেমো</th><th className="p-3 text-left">পার্টি</th>
            <th className="p-3 text-right">মোট বিল</th><th className="p-3 text-center">অ্যাকশন</th>
          </tr></thead>
          <tbody>
            {sales?.map(s => (
              <tr key={s.id} className="border-t">
                <td className="p-3">{s.date}</td><td className="p-3">{s.memo_no}</td>
                <td className="p-3 font-bengali">{(s as any).parties?.name || "-"}</td>
                <td className="p-3 text-right font-bold">৳{(s.total_bill || 0).toLocaleString()}</td>
                <td className="p-3 text-center">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/invoice/new?sale=${s.id}`)}><Printer className="w-3 h-3 mr-1" />দেখুন</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceListPage;
