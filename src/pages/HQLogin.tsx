import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const hqSupabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: "hq-login-anon",
    },
  },
);

export default function HQLogin() {
  const navigate = useNavigate();
  const [placa, setPlaca] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Find officer by placa
      const { data: officer, error: fetchErr } = await hqSupabase
        .from("officers")
        .select("*, citizens(*)")
        .eq("placa", placa.trim().toUpperCase())
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      if (!officer) {
        setError("Placa no encontrada");
        setLoading(false);
        return;
      }

      // Verify password (simple hash comparison - in production use bcrypt edge function)
      if (officer.contrasena_hash !== password) {
        setError("Credenciales incorrectas");
        setLoading(false);
        return;
      }

      // Store officer session in sessionStorage
      sessionStorage.setItem("hq_officer", JSON.stringify({
        id: officer.id,
        placa: officer.placa,
        rango: officer.rango,
        departamento: officer.departamento,
        citizen_id: officer.citizen_id,
        nombre: officer.citizens?.nombre + " " + officer.citizens?.apellido_paterno,
        roblox_nickname: officer.citizens?.roblox_nickname,
      }));

      navigate("/hq-dashboard");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/30">
            <Shield className="h-10 w-10 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">MDT Policial</h1>
          <p className="text-sm text-slate-400 mt-1">RC District United — Acceso HQ</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Número de Placa</label>
            <Input
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              placeholder="Ej: RCPD-001"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 uppercase"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Contraseña</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Acceder al HQ"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
