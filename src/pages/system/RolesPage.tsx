import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const roles = [
  { icon: "👑", title: "সুপার অ্যাডমিন", desc: "সব কিছু করতে পারবে (delete সহ)", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { icon: "🔑", title: "অ্যাডমিন", desc: "যোগ, সম্পাদনা, দেখা", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { icon: "👁️", title: "ব্যবহারকারী", desc: "শুধু যোগ ও দেখা", color: "bg-green-100 text-green-800 border-green-300" },
];

const RolesPage = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold">👥 রোল ও পারমিশন</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {roles.map((r) => (
          <Card key={r.title} className={`border-2 ${r.color}`}>
            <CardContent className="p-4 text-center space-y-1">
              <span className="text-3xl">{r.icon}</span>
              <p className="font-bold">{r.title}</p>
              <p className="text-xs">{r.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>ব্যবহারকারী তালিকা</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>নাম</TableHead>
                <TableHead>ইমেইল</TableHead>
                <TableHead>রোল</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-muted-foreground text-center py-8" colSpan={3}>
                  রোল সিস্টেম সক্রিয় করতে Authentication সেটআপ প্রয়োজন
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesPage;
