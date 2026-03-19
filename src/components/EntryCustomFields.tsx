import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, X, Check, Tag } from "lucide-react";
import { toast } from "sonner";

const db = supabase as any;

interface EntryCustomFieldsProps {
  module: string;
  entryId: string;
}

const EntryCustomFields = ({ module, entryId }: EntryCustomFieldsProps) => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: fields = [] } = useQuery({
    queryKey: ["custom_fields", module, entryId],
    queryFn: async () => {
      const { data } = await db.from("entry_custom_fields")
        .select("*")
        .eq("module", module)
        .eq("entry_id", entryId)
        .order("created_at");
      return data || [];
    },
    enabled: !!entryId,
  });

  const addMut = useMutation({
    mutationFn: async () => {
      if (!fieldName.trim()) throw new Error("ফিল্ডের নাম দিন");
      const { error } = await db.from("entry_custom_fields").insert({
        module,
        entry_id: entryId,
        field_name: fieldName.trim(),
        field_value: fieldValue.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("যোগ হয়েছে ✅");
      qc.invalidateQueries({ queryKey: ["custom_fields", module, entryId] });
      setFieldName(""); setFieldValue(""); setShowForm(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("entry_custom_fields").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: ["custom_fields", module, entryId] });
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-bengali text-sm font-medium flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5" />
          অতিরিক্ত তথ্য
        </p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs font-bengali text-primary hover:opacity-80"
          >
            <Plus className="w-3.5 h-3.5" />
            যোগ করুন
          </button>
        )}
      </div>

      {/* Existing fields */}
      {fields.map((f: any) => (
        <div key={f.id} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 border">
          <Tag className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-sm font-bengali font-semibold shrink-0">{f.field_name}:</span>
          <span className="text-sm font-bengali flex-1 truncate">{f.field_value || "—"}</span>
          {deleteId === f.id ? (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => deleteMut.mutate(f.id)}
                className="p-1 rounded bg-destructive text-white hover:opacity-80">
                <Check className="w-3 h-3" />
              </button>
              <button onClick={() => setDeleteId(null)} className="p-1 rounded bg-muted hover:opacity-80">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button onClick={() => setDeleteId(f.id)}
              className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}

      {/* Add form */}
      {showForm && (
        <div className="bg-muted/30 border rounded-lg p-3 space-y-2">
          <input
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="ফিল্ডের নাম (যেমন: গাড়ি নং, ড্রাইভার, পরিমাণ)"
            className="w-full border rounded-lg px-3 py-2 text-sm font-bengali bg-white"
            autoFocus
          />
          <input
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            placeholder="মান (যেকোনো text, number)"
            className="w-full border rounded-lg px-3 py-2 text-sm font-bengali bg-white"
          />
          <div className="flex gap-2">
            <button onClick={() => addMut.mutate()} disabled={addMut.isPending}
              className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-bengali hover:opacity-90 disabled:opacity-50">
              যোগ করুন
            </button>
            <button onClick={() => { setShowForm(false); setFieldName(""); setFieldValue(""); }}
              className="px-4 py-2 bg-muted rounded-lg text-sm font-bengali hover:opacity-80">
              বাতিল
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryCustomFields;