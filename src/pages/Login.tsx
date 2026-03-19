import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Footprints } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "ইমেইল ও পাসওয়ার্ড দিন", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "লগইন ব্যর্থ হয়েছে ❌", description: "ইমেইল বা পাসওয়ার্ড সঠিক নয়", variant: "destructive" });
    } else {
      toast({ title: "লগইন সফল ✅" });
      navigate("/dashboard");
    }
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
          {/* Email */}
          <div className="space-y-2">
            <Label className="text-lg font-bengali font-semibold">ইমেইল</Label>
            <p className="text-xs text-muted-foreground -mt-1">Email Address</p>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 text-lg px-4"
              placeholder="example@gmail.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="text-lg font-bengali font-semibold">পাসওয়ার্ড</Label>
            <p className="text-xs text-muted-foreground -mt-1">Password</p>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 text-lg px-4"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" disabled={loading}
            className="w-full h-14 text-xl font-bengali font-semibold">
            {loading ? "লগইন হচ্ছে..." : "লগইন করুন"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Login</p>
        </form>
      </div>
    </div>
  );
};

export default Login;