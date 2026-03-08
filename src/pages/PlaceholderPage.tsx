import { useLocation } from "react-router-dom";

const pageNames: Record<string, { bn: string; en: string }> = {
  "/setup": { bn: "সেটআপ", en: "Setup" },
  "/fiscal-year": { bn: "আর্থিক বছর", en: "Fiscal Year" },
  "/daily-ledger": { bn: "দৈনিক খাতা", en: "Daily Ledger" },
  "/purchase": { bn: "ক্রয়", en: "Purchase" },
  "/production": { bn: "উৎপাদন", en: "Production" },
  "/sales": { bn: "বিক্রয়", en: "Sales" },
  "/cash-bank-loan": { bn: "ক্যাশ/ব্যাংক/লোন", en: "Cash/Bank/Loan" },
  "/employee": { bn: "কর্মচারী", en: "Employee" },
  "/rent-commission": { bn: "ভাড়া ও কমিশন", en: "Rent & Commission" },
  "/capital-insurance": { bn: "মূলধন ও বীমা", en: "Capital & Insurance" },
  "/waste-sales": { bn: "বর্জ্য বিক্রি", en: "Waste Sales" },
  "/register": { bn: "রেজিস্টার", en: "Register" },
  "/excel": { bn: "এক্সেল", en: "Excel" },
  "/summary": { bn: "সারসংক্ষেপ", en: "Summary" },
  "/invoice": { bn: "ইনভয়েস", en: "Invoice" },
  "/system": { bn: "সিস্টেম", en: "System" },
};

const PlaceholderPage = () => {
  const location = useLocation();
  const page = pageNames[location.pathname] || { bn: "পৃষ্ঠা", en: "Page" };

  return (
    <div>
      <h1 className="text-2xl font-bold font-bengali mb-1">{page.bn}</h1>
      <p className="text-sm text-muted-foreground mb-6">{page.en}</p>

      <div className="bg-card rounded-xl border p-8 text-center">
        <p className="text-lg font-bengali text-muted-foreground">
          এই পৃষ্ঠা শীঘ্রই তৈরি হবে
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          This page will be built soon
        </p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
