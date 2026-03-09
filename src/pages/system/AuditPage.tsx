import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AuditPage = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-xl font-bold">📝 অডিট লগ</h1>

      <div className="flex gap-3">
        <Input type="date" className="w-40" />
        <Input type="date" className="w-40" />
        <Input placeholder="অনুসন্ধান..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>সময়</TableHead>
              <TableHead>ব্যবহারকারী</TableHead>
              <TableHead>কাজ</TableHead>
              <TableHead>বিভাগ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                অডিট লগ সক্রিয় করতে Authentication এবং Database Triggers সেটআপ প্রয়োজন
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AuditPage;
