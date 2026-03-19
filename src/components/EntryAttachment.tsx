import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Paperclip, Upload, Eye, Trash2, X, Check, FileSpreadsheet, FileText, Image, Plus, Tag } from "lucide-react";
import { toast } from "sonner";

const db = supabase as any;

interface EntryAttachmentProps {
  module: string;
  entryId: string;
  entryLabel?: string;
}

const moduleLabels: Record<string, string> = {
  sales: "বিক্রয়",
  purchase: "ক্রয়",
  production: "উৎপাদন",
  khata: "দৈনিক খাতা",
  salary: "বেতন",
  supplier_advance: "সরবরাহকারী অগ্রিম",
  loan: "লোন",
  rent: "ভাড়া",
  asset: "সম্পদ",
  insurance: "বীমা",
  capital: "মূলধন",
  waste: "বর্জ্য বিক্রি",
  party: "পার্টি",
};

const getFileIcon = (name: string) => {
  if (name.match(/\.(xlsx|xls)$/)) return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
  if (name.endsWith(".pdf")) return <FileText className="w-4 h-4 text-red-600" />;
  if (name.match(/\.(jpg|jpeg|png|gif)$/)) return <Image className="w-4 h-4 text-blue-600" />;
  return <Paperclip className="w-4 h-4 text-gray-500" />;
};

const formatSize = (bytes: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const EntryAttachment = ({ module, entryId, entryLabel }: EntryAttachmentProps) => {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteAttachId, setDeleteAttachId] = useState<string | null>(null);
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);

  // Custom field form state
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [fieldValue, setFieldValue] = useState("");

  // Attachments
  const { data: attachments = [] } = useQuery({
    queryKey: ["attachments", module, entryId],
    queryFn: async () => {
      const { data } = await db.from("entry_attachments")
        .select("*")
        .eq("module", module)
        .eq("entry_id", entryId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!entryId,
  });

  // Custom fields
  const { data: customFields = [] } = useQuery({
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

  // Delete attachment
  const deleteAttachMut = useMutation({
    mutationFn: async ({ id, filePath, docFileId }: { id: string; filePath: string; docFileId?: string }) => {
      await supabase.storage.from("documents").remove([filePath]);
      await db.from("entry_attachments").delete().eq("id", id);
      if (docFileId) await db.from("document_files").delete().eq("id", docFileId);
    },
    onSuccess: () => {
      toast.success("ফাইল মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: ["attachments", module, entryId] });
      qc.invalidateQueries({ queryKey: ["document_files"] });
      setDeleteAttachId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Add custom field
  const addFieldMut = useMutation({
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
      setFieldName(""); setFieldValue(""); setShowFieldForm(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Delete custom field
  const deleteFieldMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("entry_custom_fields").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: ["custom_fields", module, entryId] });
      setDeleteFieldId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Upload file
  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const filePath = `${module}/${entryId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // document_files — Excel archive
      const { data: docFile } = await db.from("document_files").insert({
        file_name: file.name,
        file_url: publicUrl,
        file_path: filePath,
        file_size: file.size,
        module: moduleLabels[module] || module,
        description: entryLabel
          ? `${moduleLabels[module] || module} — ${entryLabel}`
          : moduleLabels[module] || module,
      }).select().single();

      // entry_attachments
      const { error } = await db.from("entry_attachments").insert({
        module,
        entry_id: entryId,
        file_name: file.name,
        file_url: publicUrl,
        file_path: filePath,
        file_size: file.size,
        doc_file_id: docFile?.id || null,
      });
      if (error) throw error;

      qc.invalidateQueries({ queryKey: ["attachments", module, entryId] });
      qc.invalidateQueries({ queryKey: ["document_files"] });
      toast.success("ফাইল যোগ করা হয়েছে ✅");
      setExpanded(true);
    } catch (e: any) {
      toast.error(e.message);
    }
    setUploading(false);
  };

  const totalCount = attachments.length + customFields.length;

  return (
    <div className="mt-2">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Paperclip className="w-3.5 h-3.5" />
        <span className="font-bengali">
          {totalCount > 0 ? `${attachments.length}টি ফাইল, ${customFields.length}টি ফিল্ড` : "ফাইল / তথ্য যোগ করুন"}
        </span>
        {totalCount > 0 && (
          <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-bold">
            {totalCount}
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-2 border rounded-lg p-3 bg-muted/20 space-y-3">

          {/* ===== ATTACHMENTS ===== */}
          <div>
            <p className="text-xs font-bengali font-semibold text-muted-foreground mb-2">📎 ফাইল সংযুক্তি</p>

            {attachments.length === 0 ? (
              <p className="text-xs font-bengali text-muted-foreground text-center py-1">কোনো ফাইল নেই</p>
            ) : attachments.map((f: any) => (
              <div key={f.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border mb-1">
                {getFileIcon(f.file_name)}
                <span className="flex-1 text-xs truncate" title={f.file_name}>{f.file_name}</span>
                {f.file_size && <span className="text-xs text-muted-foreground shrink-0">{formatSize(f.file_size)}</span>}
                <a href={f.file_url} target="_blank" rel="noopener noreferrer"
                  className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors shrink-0">
                  <Eye className="w-3.5 h-3.5" />
                </a>
                {deleteAttachId === f.id ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => deleteAttachMut.mutate({ id: f.id, filePath: f.file_path, docFileId: f.doc_file_id })}
                      className="p-1 rounded bg-destructive text-white hover:opacity-80">
                      <Check className="w-3 h-3" />
                    </button>
                    <button onClick={() => setDeleteAttachId(null)} className="p-1 rounded bg-muted hover:opacity-80">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteAttachId(f.id)}
                    className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 w-full justify-center py-2 border-2 border-dashed border-primary/30 rounded-lg text-xs font-bengali text-primary hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50 mt-1"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? "আপলোড হচ্ছে..." : "ফাইল যোগ করুন (Excel, PDF, Image)"}
            </button>
            <input ref={fileInputRef} type="file" className="hidden"
              accept=".xlsx,.xls,.pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); e.target.value = ""; }} />
          </div>

          {/* ===== CUSTOM FIELDS ===== */}
          <div className="border-t pt-3">
            <p className="text-xs font-bengali font-semibold text-muted-foreground mb-2">🏷️ অতিরিক্ত তথ্য</p>

            {/* Existing fields */}
            {customFields.length > 0 && (
              <div className="space-y-1 mb-2">
                {customFields.map((f: any) => (
                  <div key={f.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border">
                    <Tag className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs font-bengali font-semibold shrink-0">{f.field_name}:</span>
                    <span className="text-xs font-bengali flex-1 truncate">{f.field_value || "—"}</span>
                    {deleteFieldId === f.id ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => deleteFieldMut.mutate(f.id)}
                          className="p-1 rounded bg-destructive text-white hover:opacity-80">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => setDeleteFieldId(null)} className="p-1 rounded bg-muted hover:opacity-80">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteFieldId(f.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add custom field form */}
            {showFieldForm ? (
              <div className="bg-white border rounded-lg p-3 space-y-2">
                <input
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="ফিল্ডের নাম (যেমন: গাড়ি নং, ড্রাইভার, মন্তব্য)"
                  className="w-full border rounded-lg px-3 py-2 text-xs font-bengali"
                />
                <input
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder="মান (যেকোনো text, number)"
                  className="w-full border rounded-lg px-3 py-2 text-xs font-bengali"
                />
                <div className="flex gap-2">
                  <button onClick={() => addFieldMut.mutate()} disabled={addFieldMut.isPending}
                    className="flex-1 py-1.5 bg-primary text-white rounded-lg text-xs font-bengali hover:opacity-90">
                    যোগ করুন
                  </button>
                  <button onClick={() => { setShowFieldForm(false); setFieldName(""); setFieldValue(""); }}
                    className="px-3 py-1.5 bg-muted rounded-lg text-xs font-bengali hover:opacity-80">
                    বাতিল
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowFieldForm(true)}
                className="flex items-center gap-2 w-full justify-center py-2 border-2 border-dashed border-primary/30 rounded-lg text-xs font-bengali text-primary hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                অতিরিক্ত তথ্য যোগ করুন
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryAttachment;