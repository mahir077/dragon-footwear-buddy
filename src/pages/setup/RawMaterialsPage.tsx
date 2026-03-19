import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Pencil, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";

const RawMaterialsPage = () => {
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [nameBn, setNameBn] = useState("");
  const [unit, setUnit] = useState("");

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: async () => {
      const { data } = await supabase.from("raw_materials").select("*").order("name_bn"); // ✅ fixed
      return data || [];
    },
  });

  const resetForm = () => {
    setNameBn(""); setUnit("");
    setEditId(null); setShowForm(false);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!nameBn.trim()) throw new Error("কাঁচামালের নাম দিন");
      if (!unit.trim()) throw new Error("ইউনিট দিন");

      if (editId) {
        // ✅ fixed: name column বাদ
        const { error } = await supabase.from("raw_materials").update({
          name_bn: nameBn,
          unit,
        }).eq("id", editId);
        if (error) throw error;
      } else {
        // ✅ fixed: name column বাদ
        const { error } = await supabase.from("raw_materials").insert({
          name_bn: nameBn,
          unit,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "আপডেট হয়েছে ✅" : "যোগ করা হয়েছে ✅");
      qc.invalidateQueries({ queryKey: ["raw-materials"] });
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("raw_materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: ["raw-materials"] });
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (m: any) => {
    setEditId(m.id);
    setNameBn(m.name_bn || "");
    setUnit(m.unit || "");
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-bengali">কাঁচামাল</h1>
          <p className="text-xs text-muted-foreground">Raw Materials</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-1.5 bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4" />
            <span className="font-bengali">নতুন যোগ করুন</span>
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="border rounded-xl p-4 mb-4 bg-muted/30 space-y-3">
          <h2 className="font-bengali font-semibold text-sm">
            {editId ? "কাঁচামাল সম্পাদনা" : "নতুন কাঁচামাল"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="font-bengali text-xs">নাম *</Label>
              <Input
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                placeholder="যেমন: চামড়া, রাবার, সুতা"
                className="font-bengali"
              />
            </div>
            <div>
              <Label className="font-bengali text-xs">ইউনিট *</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="যেমন: কেজি, পিস, মিটার"
                className="font-bengali"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="bg-green-600 hover:bg-green-700 font-bengali"
            >
              {editId ? "আপডেট করুন" : "সংরক্ষণ করুন"}
            </Button>
            <Button variant="outline" onClick={resetForm} className="font-bengali">
              বাতিল
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bengali">#</TableHead>
              <TableHead className="font-bengali">নাম</TableHead>
              <TableHead className="font-bengali">ইউনিট</TableHead>
              <TableHead className="text-center font-bengali">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center font-bengali py-8">লোড হচ্ছে...</TableCell></TableRow>
            ) : materials.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center font-bengali py-8 text-muted-foreground">কোনো কাঁচামাল নেই</TableCell></TableRow>
            ) : materials.map((m: any, i: number) => (
              <TableRow key={m.id}>
                <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-bengali font-medium">{m.name_bn || "-"}</TableCell>
                <TableCell className="font-bengali text-xs">{m.unit || "-"}</TableCell>
                <TableCell className="text-center">
                  {deleteId === m.id ? (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs font-bengali text-destructive">মুছবো?</span>
                      <button onClick={() => deleteMut.mutate(m.id)}
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
                      <button onClick={() => startEdit(m)}
                        className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(m.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RawMaterialsPage;