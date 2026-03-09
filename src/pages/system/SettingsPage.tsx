import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

const SettingsPage = () => {
  const [company, setCompany] = useState({ name: "ড্রাগন পিউ ফুটওয়্যার", address: "", phone: "" });
  const [lang, setLang] = useState<"bn" | "en">("bn");
  const [lockOpen, setLockOpen] = useState(false);

  const { data: activeYear } = useQuery({
    queryKey: ["active-year"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).maybeSingle();
      return data;
    },
  });

  const lockYear = async () => {
    if (!activeYear) return;
    const { error } = await supabase.from("financial_years").update({ is_locked: true }).eq("id", activeYear.id);
    if (error) toast.error("ত্রুটি হয়েছে");
    else { toast.success("বছর লক করা হয়েছে"); setLockOpen(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold">⚙️ সেটিংস</h1>

      <Card>
        <CardHeader><CardTitle>কোম্পানি তথ্য</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>কোম্পানির নাম</Label><Input value={company.name} onChange={e => setCompany(p => ({ ...p, name: e.target.value }))} /></div>
          <div><Label>ঠিকানা</Label><Input value={company.address} onChange={e => setCompany(p => ({ ...p, address: e.target.value }))} /></div>
          <div><Label>ফোন</Label><Input value={company.phone} onChange={e => setCompany(p => ({ ...p, phone: e.target.value }))} /></div>
          <Button onClick={() => toast.success("সংরক্ষিত হয়েছে")}>সংরক্ষণ করুন</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>ভাষা নির্বাচন</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          <Button variant={lang === "bn" ? "default" : "outline"} className="flex-1 text-lg py-6" onClick={() => setLang("bn")}>বাংলা</Button>
          <Button variant={lang === "en" ? "default" : "outline"} className="flex-1 text-lg py-6" onClick={() => setLang("en")}>English</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>আর্থিক বছর</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {activeYear ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{activeYear.name}</p>
                <p className="text-sm text-muted-foreground">{activeYear.start_date} → {activeYear.end_date}</p>
                {activeYear.is_locked && <p className="text-sm text-destructive font-semibold">🔒 লক করা আছে</p>}
              </div>
              {!activeYear.is_locked && (
                <Button variant="destructive" size="sm" onClick={() => setLockOpen(true)}>🔒 বছর লক করুন</Button>
              )}
            </div>
          ) : <p className="text-muted-foreground">কোনো সক্রিয় বছর নেই</p>}
        </CardContent>
      </Card>

      <Dialog open={lockOpen} onOpenChange={setLockOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" />সতর্কতা!</DialogTitle></DialogHeader>
          <p className="text-sm">বছর বন্ধ করলে আর কোনো entry করা যাবে না। নিশ্চিত?</p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setLockOpen(false)}>বাতিল</Button>
            <Button variant="destructive" onClick={lockYear}>হ্যাঁ, লক করুন</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
