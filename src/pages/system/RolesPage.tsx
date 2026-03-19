import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

const db = supabase as any;

const roleConfig: Record<string, { icon: string; bn: string; color: string }> = {
  super_admin: { icon: "👑", bn: "সুপার অ্যাডমিন", color: "bg-amber-100 text-amber-800 border-amber-300" },
  admin: { icon: "🔑", bn: "অ্যাডমিন", color: "bg-blue-100 text-blue-800 border-blue-300" },
  user: { icon: "👁️", bn: "ব্যবহারকারী", color: "bg-green-100 text-green-800 border-green-300" },
};

const roles = [
  { key: "super_admin", icon: "👑", title: "সুপার অ্যাডমিন", desc: "সব কিছু করতে পারবে (delete সহ)", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { key: "admin", icon: "🔑", title: "অ্যাডমিন", desc: "যোগ, সম্পাদনা, দেখা", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { key: "user", icon: "👁️", title: "ব্যবহারকারী", desc: "শুধু যোগ ও দেখা", color: "bg-green-100 text-green-800 border-green-300" },
];

const RolesPage = () => {
  const qc = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: userRoles = [], isLoading } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data } = await db.from("user_roles").select("*").order("created_at");
      return data || [];
    },
  });

  const { data: myRole } = useQuery({
    queryKey: ["my-role", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      const { data } = await db.from("user_roles").select("role").eq("user_id", currentUser.id).single();
      return data?.role || "user";
    },
    enabled: !!currentUser?.id,
  });

  const isSuperAdmin = myRole === "super_admin";

  // Update role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await db.from("user_roles").upsert(
        { user_id: userId, role },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "রোল আপডেট হয়েছে ✅" });
      qc.invalidateQueries({ queryKey: ["user-roles"] });
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  // ✅ Edit password (only own password via Supabase Auth)
  const editUserMutation = useMutation({
    mutationFn: async () => {
      if (!editPassword || editPassword.length < 6) throw new Error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে");
      const { error } = await supabase.auth.updateUser({ password: editPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "পাসওয়ার্ড আপডেট হয়েছে ✅" });
      setEditUserId(null);
      setEditPassword("");
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  // ✅ Delete user from user_roles
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await db.from("user_roles").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "ব্যবহারকারী মুছে ফেলা হয়েছে ✅", description: "Supabase Auth থেকে manually delete করুন" });
      qc.invalidateQueries({ queryKey: ["user-roles"] });
      setDeleteUserId(null);
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  // Add new user
  const addUserMutation = useMutation({
    mutationFn: async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const tempClient = createClient(
        (supabase as any).supabaseUrl,
        (supabase as any).supabaseKey,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      const { data, error } = await tempClient.auth.signUp({ email: newEmail, password: newPassword });
      if (error) throw error;
      if (data.user) {
        const { error: roleError } = await db.from("user_roles").upsert(
          { user_id: data.user.id, role: newRole },
          { onConflict: "user_id" }
        );
        if (roleError) throw roleError;
      }
      return data.user;
    },
    onSuccess: (user) => {
      if (user?.identities?.length === 0) {
        toast({ title: "এই ইমেইল ইতিমধ্যে আছে ⚠️", description: "অন্য ইমেইল ব্যবহার করুন", variant: "destructive" });
        return;
      }
      toast({ title: "নতুন ব্যবহারকারী যোগ হয়েছে ✅" });
      qc.invalidateQueries({ queryKey: ["user-roles"] });
      setNewEmail(""); setNewPassword(""); setNewRole("user");
      setShowAddForm(false);
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-bengali">👥 রোল ও পারমিশন</h1>
        {isSuperAdmin && (
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-1" />নতুন ব্যবহারকারী
          </Button>
        )}
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {roles.map((r) => (
          <Card key={r.title} className={`border-2 ${r.color}`}>
            <CardContent className="p-4 text-center space-y-1">
              <span className="text-3xl">{r.icon}</span>
              <p className="font-bold font-bengali">{r.title}</p>
              <p className="text-xs font-bengali">{r.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current user role */}
      {myRole && (
        <div className={`px-4 py-2 rounded-lg border-2 text-sm font-bengali font-bold ${roleConfig[myRole]?.color}`}>
          {roleConfig[myRole]?.icon} আপনার রোল: {roleConfig[myRole]?.bn}
        </div>
      )}

      {/* Add user form */}
      {showAddForm && isSuperAdmin && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="font-bengali text-base">নতুন ব্যবহারকারী যোগ করুন</CardTitle>
            <p className="text-xs text-muted-foreground font-bengali">
              ⚠️ Email confirmation OFF থাকলে সাথে সাথে login করতে পারবে।
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bengali text-muted-foreground">ইমেইল</label>
                <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@example.com" />
              </div>
              <div>
                <label className="text-xs font-bengali text-muted-foreground">পাসওয়ার্ড</label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="কমপক্ষে ৬ অক্ষর" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bengali text-muted-foreground">রোল</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">👑 সুপার অ্যাডমিন</SelectItem>
                  <SelectItem value="admin">🔑 অ্যাডমিন</SelectItem>
                  <SelectItem value="user">👁️ ব্যবহারকারী</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => addUserMutation.mutate()}
                disabled={!newEmail || !newPassword || newPassword.length < 6 || addUserMutation.isPending}
                className="font-bengali">
                {addUserMutation.isPending ? "যোগ হচ্ছে..." : "যোগ করুন"}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="font-bengali">বাতিল</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User list */}
      <Card>
        <CardHeader><CardTitle className="font-bengali">ব্যবহারকারী তালিকা ({userRoles.length} জন)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bengali">ইউজার আইডি</TableHead>
                <TableHead className="font-bengali">রোল</TableHead>
                {isSuperAdmin && <TableHead className="font-bengali text-center">রোল পরিবর্তন</TableHead>}
                {isSuperAdmin && <TableHead className="font-bengali text-center">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center font-bengali text-muted-foreground">লোড হচ্ছে...</TableCell></TableRow>
              ) : userRoles.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center font-bengali text-muted-foreground py-8">কোনো ব্যবহারকারী নেই</TableCell></TableRow>
              ) : userRoles.map((ur: any) => (
                <TableRow key={ur.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {ur.user_id === currentUser?.id ? (
                      <span className="text-primary font-bold">আপনি ({ur.user_id.substring(0, 8)}...)</span>
                    ) : `${ur.user_id.substring(0, 8)}...`}
                  </TableCell>
                  <TableCell>
                    <Badge className={`font-bengali ${roleConfig[ur.role]?.color}`}>
                      {roleConfig[ur.role]?.icon} {roleConfig[ur.role]?.bn}
                    </Badge>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="text-center">
                      {ur.user_id !== currentUser?.id ? (
                        <Select value={ur.role} onValueChange={(role) => updateRoleMutation.mutate({ userId: ur.user_id, role })}>
                          <SelectTrigger className="w-40 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="super_admin">👑 সুপার অ্যাডমিন</SelectItem>
                            <SelectItem value="admin">🔑 অ্যাডমিন</SelectItem>
                            <SelectItem value="user">👁️ ব্যবহারকারী</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground font-bengali">নিজে পরিবর্তন করা যাবে না</span>
                      )}
                    </TableCell>
                  )}
                  {isSuperAdmin && (
                    <TableCell className="text-center">
                      {ur.user_id !== currentUser?.id ? (
                        <div className="flex items-center justify-center gap-2">
                          {/* ✅ Edit password */}
                          <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50"
                            title="পাসওয়ার্ড পরিবর্তন"
                            onClick={() => { setEditUserId(ur.user_id); setEditPassword(""); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {/* ✅ Delete */}
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10"
                            title="মুছুন"
                            onClick={() => setDeleteUserId(ur.user_id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ✅ Edit Password Dialog */}
      <Dialog open={!!editUserId} onOpenChange={(v) => { if (!v) { setEditUserId(null); setEditPassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-bengali flex items-center gap-2">
              <Pencil className="w-4 h-4" /> পাসওয়ার্ড পরিবর্তন
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-bengali bg-muted/50 p-2 rounded">
              ⚠️ Supabase limitation: শুধু currently logged-in user-এর নিজের password update করা যায়। অন্যের password পরিবর্তন করতে Supabase Dashboard ব্যবহার করুন।
            </p>
            <div>
              <label className="text-xs font-bengali text-muted-foreground">নতুন পাসওয়ার্ড</label>
              <Input type="password" value={editPassword}
                onChange={e => setEditPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষর" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => editUserMutation.mutate()}
                disabled={editPassword.length < 6 || editUserMutation.isPending}
                className="flex-1 font-bengali">
                {editUserMutation.isPending ? "আপডেট হচ্ছে..." : "আপডেট করুন"}
              </Button>
              <Button variant="outline" onClick={() => { setEditUserId(null); setEditPassword(""); }}
                className="font-bengali">বাতিল</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ Delete Confirmation Dialog */}
      <Dialog open={!!deleteUserId} onOpenChange={(v) => { if (!v) setDeleteUserId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-bengali text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> ব্যবহারকারী মুছবেন?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm font-bengali">
              User: <span className="font-mono text-xs">{deleteUserId?.substring(0, 8)}...</span>
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs font-bengali text-amber-700">
              ⚠️ এটি role তালিকা থেকে মুছবে — login করতে পারবে না।
              Supabase Auth থেকে পুরোপুরি মুছতে Dashboard ব্যবহার করুন।
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteUserId(null)} className="flex-1 font-bengali">বাতিল</Button>
              <Button variant="destructive"
                onClick={() => deleteUserId && deleteUserMutation.mutate(deleteUserId)}
                disabled={deleteUserMutation.isPending}
                className="flex-1 font-bengali">
                {deleteUserMutation.isPending ? "মুছছে..." : "হ্যাঁ, মুছুন"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesPage;