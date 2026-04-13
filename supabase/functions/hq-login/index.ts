import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const normalizePlate = (value: string) => value.trim().toUpperCase();
const normalizePassword = (value: string) => value.trim();
const compactPlate = (value: string) => normalizePlate(value).replace(/\s+/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { placa, password } = await req.json();
    const normalizedPlaca = typeof placa === "string" ? normalizePlate(placa) : "";
    const normalizedPassword = typeof password === "string" ? normalizePassword(password) : "";

    if (!normalizedPlaca || !normalizedPassword) {
      return new Response(JSON.stringify({ error: "Placa y contraseña requeridos" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const targetPlate = compactPlate(normalizedPlaca);

    const { data: officers, error: fetchErr } = await supabase
      .from("officers")
      .select("*, citizens(*)")
      .ilike("placa", normalizedPlaca);

    if (fetchErr) throw fetchErr;

    const officer = officers?.find((row) => compactPlate(row.placa ?? "") === targetPlate);

    if (!officer) {
      return new Response(JSON.stringify({ error: "Placa no encontrada" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (normalizePassword(officer.contrasena_hash ?? "") !== normalizedPassword) {
      return new Response(JSON.stringify({ error: "Credenciales incorrectas" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const session = {
      id: officer.id,
      placa: officer.placa,
      rango: officer.rango,
      departamento: officer.departamento,
      citizen_id: officer.citizen_id,
      nombre: [officer.citizens?.nombre, officer.citizens?.apellido_paterno].filter(Boolean).join(" "),
      roblox_nickname: officer.citizens?.roblox_nickname,
    };

    return new Response(JSON.stringify({ officer: session }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error interno" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
