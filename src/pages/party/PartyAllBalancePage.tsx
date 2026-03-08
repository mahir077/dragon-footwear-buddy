import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const PartyAllBalancePage = () => {
  const { data: balances } = useQuery({
    queryKey: ["all-party-balances"],
    queryFn: async () => {
      const { data } = await supabase.from("v_party_balance").select("*").order("current_balance", { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div><h1 className="text-2xl font-extrabold font-bengali">সব পার্টি ব্যালেন্স</h1><p className="text-sm text-muted-foreground">All Party Balances</p></div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr className="font-bengali">
            <th className="p-3 text-left">নাম</th><th className="p-3 text-right">Opening</th>
            <th className="p-3 text-right">মোট বিক্রি</th><th className="p-3 text-right">মোট জমা</th><th className="p-3 text-right">বর্তমান বাকি</th>
          </tr></thead>
          <tbody>
            {balances?.map(b => (
              <tr key={b.party_id} className={`border-t ${(b.current_balance || 0) > 0 ? "bg-destructive/5" : ""}`}>
                <td className="p-3 font-bengali font-bold">{b.name}</td>
                <td className="p-3 text-right">৳{(b.opening_balance || 0).toLocaleString()}</td>
                <td className="p-3 text-right">৳{(b.total_sales || 0).toLocaleString()}</td>
                <td className="p-3 text-right text-success">৳{(b.total_paid || 0).toLocaleString()}</td>
                <td className={`p-3 text-right font-bold ${(b.current_balance || 0) > 0 ? "text-destructive" : "text-success"}`}>৳{(b.current_balance || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartyAllBalancePage;
