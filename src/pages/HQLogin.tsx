import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HQLogin() {
  const navigate = useNavigate();
  const [placa, setPlaca] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const normalizedPlaca = placa.trim().toUpperCase();
  const normalizedPassword = password.trim();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!normalizedPlaca || !normalizedPassword) {
      setError("Ingresa tu placa y contraseña");
      return;
    }

    setLoading(true);

    try {
      const { data, error: fnErr } = await supabase.functions.invoke("hq-login", {
        body: { placa: normalizedPlaca, password: normalizedPassword },
      });

      if (fnErr) throw fnErr;
      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      sessionStorage.setItem("hq_officer", JSON.stringify(data.officer));
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
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="Ej: PDI-009"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 uppercase"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Contraseña</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white/5 border-white/10 pr-11 text-white placeholder:text-slate-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-white"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Acceder al HQ"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
