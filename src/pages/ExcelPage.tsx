import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload, Search, FileSpreadsheet, Trash2, Download, Eye, X, Plus } from "lucide-react";

const modules = [
  "বিক্রয়", "ক্রয়", "উৎপাদন", "দৈনিক খাতা", "পার্টি লেজার",
  "ক্যাশ/ব্যাংক", "কর্মচারী", "লোন", "বীমা", "ভাড়া",
  "স্টক", "সারসংক্ষেপ", "অন্যান্য"
];

const years = ["2020-2021", "2021-2022", "2022-2023", "2023-2024", "2024-2025", "2025-2026"];

const ExcelPage = () => {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formModule, setFormModule] = useState("");
  const [formYear, setFormYear] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["document_files", search, filterModule, filterYear],
    queryFn: async () => {
      let q = (supabase as any).from("document_files").select("*").order("created_at", { ascending: false });
      if (filterModule) q = q.eq("module", filterModule);
      if (filterYear) q = q.eq("year_label", filterYear);
      if (search) q = q.or(`file_name.ilike.%${search}%,description.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, file_path }: { id: string; file_path: string }) => {
      await supabase.storage.from("documents").remove([file_path]);
      const { error } = await (supabase as any).from("document_files").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document_files"] });
      toast({ title: "ফাইল মুছে ফেলা হয়েছে" });
    },
  });

  const handleUpload = async () => {
    if (!formFile) return toast({ title: "ফাইল নির্বাচন করুন", variant: "destructive" });
    if (!formModule) return toast({ title: "মডিউল নির্বাচন করুন", variant: "destructive" });

    setUploading(true);
    try {
      const ext = formFile.name.split(".").pop();
      const filePath = `${Date.now()}_${formFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents").upload(filePath, formFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);

      const { error } = await (supabase as any).from("document_files").insert({
        file_name: formFile.name,
        file_url: urlData.publicUrl,
        file_path: filePath,
        file_size: formFile.size,
        module: formModule,
        year_label: formYear || null,
        description: formDesc || null,
      });
      if (error) throw error;

      qc.invalidateQueries({ queryKey: ["document_files"] });
      toast({ title: "ফাইল আপলোড হয়েছে ✅" });
      setShowUpload(false);
      setFormFile(null);
      setFormModule("");
      setFormYear("");
      setFormDesc("");
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "📊";
    if (name.endsWith(".pdf")) return "📄";
    if (name.endsWith(".jpg") || name.endsWith(".png")) return "🖼️";
    return "📎";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-bengali">এক্সেল ও ডকুমেন্ট</h1>
          <p className="text-sm text-muted-foreground">File Manager — সব পুরনো ফাইল এখানে রাখুন</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-[hsl(var(--stat-green))] text-white px-4 py-2.5 rounded-xl font-bengali font-bold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          <span>ফাইল যোগ করুন</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ফাইলের নাম বা বিবরণ দিয়ে খুঁজুন..."
            className="w-full border rounded-xl pl-9 pr-4 py-2.5 text-base font-bengali" />
        </div>
        <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)}
          className="border rounded-xl px-4 py-2.5 text-base font-bengali min-w-[150px]">
          <option value="">সব মডিউল</option>
          {modules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
          className="border rounded-xl px-4 py-2.5 text-base min-w-[140px]">
          <option value="">সব বছর</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Stats bar */}
      <div className="bg-card border rounded-xl px-5 py-3 flex items-center gap-6">
        <div className="text-center">
          <p className="text-2xl font-bold">{files.length}</p>
          <p className="text-xs font-bengali text-muted-foreground">মোট ফাইল</p>
        </div>
        <div className="h-8 w-px bg-border" />
        {modules.slice(0, 5).map(m => {
          const count = files.filter(f => f.module === m).length;
          if (!count) return null;
          return (
            <div key={m} className="text-center">
              <p className="text-lg font-bold">{count}</p>
              <p className="text-xs font-bengali text-muted-foreground">{m}</p>
            </div>
          );
        })}
      </div>

      {/* File list */}
      {isLoading ? (
        <p className="font-bengali text-muted-foreground text-center py-8">লোড হচ্ছে...</p>
      ) : files.length === 0 ? (
        <div className="bg-card border rounded-xl py-16 text-center">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-bengali text-muted-foreground text-lg">কোনো ফাইল নেই</p>
          <p className="text-sm text-muted-foreground mt-1">উপরে "ফাইল যোগ করুন" বাটনে ক্লিক করুন</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.map((f: any) => (
            <div key={f.id} className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{getFileIcon(f.file_name)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" title={f.file_name}>{f.file_name}</p>
                  {f.description && <p className="text-xs text-muted-foreground font-bengali mt-0.5 line-clamp-2">{f.description}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {f.module && <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-bengali">{f.module}</span>}
                    {f.year_label && <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">{f.year_label}</span>}
                    <span className="text-xs text-muted-foreground">{formatSize(f.file_size)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <a href={f.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium transition-colors">
                  <Eye className="w-3.5 h-3.5" />
                  <span>দেখুন</span>
                </a>
                <a href={f.file_url} download={f.file_name}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-sm font-medium transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  <span>নামান</span>
                </a>
                <button onClick={() => deleteMutation.mutate({ id: f.id, file_path: f.file_path })}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-bengali">নতুন ফাইল আপলোড</h2>
              <button onClick={() => setShowUpload(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File picker */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-primary/40 rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
              <Upload className="w-8 h-8 mx-auto text-primary mb-2" />
              {formFile ? (
                <p className="font-medium text-sm">{formFile.name}</p>
              ) : (
                <p className="font-bengali text-muted-foreground">ক্লিক করে ফাইল নির্বাচন করুন</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Excel, PDF, Image সব ধরনের ফাইল</p>
              <input ref={fileInputRef} type="file"
                accept=".xlsx,.xls,.pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={(e) => setFormFile(e.target.files?.[0] || null)} />
            </div>

            <div>
              <label className="font-bengali text-sm font-medium block mb-1">মডিউল *</label>
              <select value={formModule} onChange={(e) => setFormModule(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 text-base font-bengali">
                <option value="">নির্বাচন করুন</option>
                {modules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="font-bengali text-sm font-medium block mb-1">বছর</label>
              <select value={formYear} onChange={(e) => setFormYear(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 text-base">
                <option value="">নির্বাচন করুন</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="font-bengali text-sm font-medium block mb-1">বিবরণ</label>
              <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                placeholder="যেমন: এপ্রিল-মার্চ ২০২৫-২৬ এর ক্যাশ সেল"
                className="w-full border rounded-xl px-4 py-3 text-base font-bengali" />
            </div>

            <button onClick={handleUpload} disabled={uploading || !formFile || !formModule}
              className="w-full bg-[hsl(var(--stat-green))] text-white py-3 rounded-xl font-bengali font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
              {uploading ? "আপলোড হচ্ছে..." : "আপলোড করুন ✅"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelPage;