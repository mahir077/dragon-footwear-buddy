import { Link } from "react-router-dom";
import {
  Tag, Layers, FileText, Users, Palette, MapPin, Landmark, UserCheck,
} from "lucide-react";

const setupPages = [
  { bn: "ব্র্যান্ড", en: "Brands", icon: Tag, path: "/setup/brands", color: "bg-primary" },
  { bn: "মডেল", en: "Models", icon: Layers, path: "/setup/models", color: "bg-[hsl(var(--stat-teal))]" },
  { bn: "আর্টিকেল", en: "Articles", icon: FileText, path: "/setup/articles", color: "bg-[hsl(var(--stat-purple))]" },
  { bn: "পার্টি", en: "Parties", icon: Users, path: "/setup/parties", color: "bg-[hsl(var(--stat-orange))]" },
  { bn: "রঙ", en: "Colors", icon: Palette, path: "/setup/colors", color: "bg-[hsl(var(--stat-red))]" },
  { bn: "লোকেশন", en: "Locations", icon: MapPin, path: "/setup/locations", color: "bg-[hsl(var(--stat-blue))]" },
  { bn: "ব্যাংক হিসাব", en: "Bank Accounts", icon: Landmark, path: "/setup/banks", color: "bg-[hsl(var(--stat-green))]" },
  { bn: "কর্মচারী", en: "Employees", icon: UserCheck, path: "/setup/employees", color: "bg-[hsl(var(--stat-teal))]" },
];

const SetupIndex = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold font-bengali mb-1">সেটআপ</h1>
      <p className="text-sm text-muted-foreground mb-6">Master Setup</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {setupPages.map((page) => (
          <Link
            key={page.path}
            to={page.path}
            className="bg-card rounded-xl border p-5 hover:shadow-lg transition-shadow flex flex-col items-center gap-3 text-center"
          >
            <div className={`${page.color} text-white p-4 rounded-xl`}>
              <page.icon className="w-8 h-8" />
            </div>
            <div>
              <div className="text-lg font-bold font-bengali">{page.bn}</div>
              <div className="text-xs text-muted-foreground">{page.en}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SetupIndex;
