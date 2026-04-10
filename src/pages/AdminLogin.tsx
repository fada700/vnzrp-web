import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ADMIN_EMAIL = "venezuela@roleplay.com";
const ADMIN_PASSWORD = "vnzrp@MCK!";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        sessionStorage.setItem("admin_auth", "true");
        navigate("/admin");
      } else {
        setError("Credenciales incorrectas");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Panel Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Venezuela Roleplay — Acceso Administrador</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 rounded-2xl border border-border bg-card p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@roleplay.com" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Contraseña</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Acceder"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
