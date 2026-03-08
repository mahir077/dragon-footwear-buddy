import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Footprints } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just navigate to dashboard
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md bg-card rounded-lg shadow-2xl p-8">
        {/* Company Logo & Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary mb-4">
            <Footprints className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary font-bengali">
            ড্রাগন পিউ ফুটওয়্যার
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Dragon Pew Footwear</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Phone / Username */}
          <div className="space-y-2">
            <Label className="text-lg font-bengali font-semibold">
              ফোন নম্বর / ইউজারনেম
            </Label>
            <p className="text-xs text-muted-foreground -mt-1">Phone / Username</p>
            <Input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-14 text-lg px-4"
              placeholder="০১XXXXXXXXX"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="text-lg font-bengali font-semibold">
              পাসওয়ার্ড
            </Label>
            <p className="text-xs text-muted-foreground -mt-1">Password</p>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 text-lg px-4"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-xl font-bengali font-semibold"
          >
            লগইন করুন
          </Button>
          <p className="text-center text-xs text-muted-foreground">Login</p>
        </form>
      </div>
    </div>
  );
};

export default Login;
