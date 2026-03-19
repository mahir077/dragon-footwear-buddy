import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

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

  // ✅ Fixed: signUp instead of auth.admin.createUser (browser-safe)
  const addUserMutation = useMutation({
   mutationFn: async () => {
  const { createClient } = await import("@supabase/supabase-js");
 const tempClient = createClient(
  (supabase as any).supabaseUrl,
  (supabase as any).supabaseKey,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
  const { data, error } = await tempClient.auth.signUp({
    email: newEmail,
    password: newPassword,
  });
  if (error) throw error;
  if (data.user) {
        // ✅ Role assign করো
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
        // User already exists
        toast({ title: "এই ইমেইল ইতিমধ্যে আছে ⚠️", description: "অন্য ইমেইল ব্যবহার করুন", variant: "destructive" });
        return;
      }
      toast({ title: "নতুন ব্যবহারকারী যোগ হয়েছে ✅", description: "Email confirmation পাঠানো হয়েছে" });
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
              ⚠️ নতুন user-এর কাছে confirmation email যাবে। Supabase Dashboard থেকে confirm করতে পারবেন।
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
                {isSuperAdmin && <TableHead className="font-bengali text-center">পরিবর্তন</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center font-bengali text-muted-foreground">লোড হচ্ছে...</TableCell></TableRow>
              ) : userRoles.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center font-bengali text-muted-foreground py-8">কোনো ব্যবহারকারী নেই</TableCell></TableRow>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesPage;