import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface SetupPageWrapperProps {
  titleBn: string;
  titleEn: string;
  children: ReactNode;
  onAdd: () => void;
}

const SetupPageWrapper = ({ titleBn, titleEn, children, onAdd }: SetupPageWrapperProps) => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Link to="/setup" className="text-primary hover:opacity-80">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold font-bengali">{titleBn}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4 ml-9">{titleEn}</p>

      <div className="mb-4">
        <button
          onClick={onAdd}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg text-base font-bengali font-semibold hover:opacity-90 transition-opacity"
        >
          + নতুন যোগ করুন
        </button>
      </div>

      {children}
    </div>
  );
};

export default SetupPageWrapper;
