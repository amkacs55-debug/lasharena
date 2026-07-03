import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Button, Input, Label, Card } from "@/components/ui/primitives";

export function LoginPage() {
  const { session, login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@lumiere.mn");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to="/admin" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F0F0F] px-4">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#FF4FA0]/20 blur-[110px]" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-[#FFC7DD]/10 blur-[110px]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="p-8 sm:p-10">
          <div className="mb-8 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#FF4FA0] to-[#d43c86] font-display text-lg text-white shadow-lg shadow-[#FF4FA0]/30">
              L
            </span>
            <h1 className="font-display text-2xl font-semibold text-white">Admin Sign In</h1>
            <p className="mt-1 text-sm text-[#B8B8B8]">Manage bookings, services & settings</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full glow-pink" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-white/30">
            Demo credentials: admin@lumiere.mn / admin123
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
