import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield, Search, Plus, Trash2, Edit2, Save, X, Loader2, Users, UserPlus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type OfficerRow = {
  id: string;
  placa: string;
  rango: string;
  departamento: string;
  salario: number;
  en_servicio: boolean;
  citizen_id: string;
  citizen_name: string;
  roblox_nickname: string;
};

type CitizenOption = {
  id: string;
  nombre: string;
  apellido_paterno: string;
  roblox_nickname: string;
  folio_dni: string;
};

const RANGOS = ["Cadete", "Oficial", "Detective", "Sargento", "Teniente", "Capitán", "Comandante", "Jefe"];
const DEPARTAMENTOS = ["RCPD", "RCSD", "FBI", "DEA", "EMS"];

export default function AdminPanel() {
  const [officers, setOfficers] = useState<OfficerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<OfficerRow>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Create form
  const [citizenSearch, setCitizenSearch] = useState("");
  const [citizenResults, setCitizenResults] = useState<CitizenOption[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenOption | null>(null);
  const [newPlaca, setNewPlaca] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRango, setNewRango] = useState("Cadete");
  const [newDepto, setNewDepto] = useState("RCPD");
  const [newSalario, setNewSalario] = useState("50000");
  const [creating, setCreating] = useState(false);

  const fetchOfficers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("officers")
      .select("id, placa, rango, departamento, salario, en_servicio, citizen_id, citizens!officers_citizen_id_fkey(nombre, apellido_paterno, roblox_nickname)")
      .order("created_at", { ascending: false });

    if (error) {
      // Fallback: fetch without join
      const { data: rawOfficers } = await supabase.from("officers").select("*").order("created_at", { ascending: false });
      if (rawOfficers) {
        const citizenIds = rawOfficers.map((o: any) => o.citizen_id);
        const { data: citizens } = await supabase.from("citizens").select("id, nombre, apellido_paterno, roblox_nickname").in("id", citizenIds);
        const citizenMap = new Map((citizens || []).map((c: any) => [c.id, c]));
        setOfficers(rawOfficers.map((o: any) => {
          const c = citizenMap.get(o.citizen_id) as any;
          return {
            ...o,
            citizen_name: c ? `${c.nombre} ${c.apellido_paterno}` : "Desconocido",
            roblox_nickname: c?.roblox_nickname || "N/A",
          };
        }));
      }
    } else if (data) {
      setOfficers(data.map((o: any) => {
        const c = o.citizens;
        return {
          ...o,
          citizen_name: c ? `${c.nombre} ${c.apellido_paterno}` : "Desconocido",
          roblox_nickname: c?.roblox_nickname || "N/A",
        };
      }));
    }
    setLoading(false);
  };

  useEffect(() => { fetchOfficers(); }, []);

  const searchCitizens = async (q: string) => {
    setCitizenSearch(q);
    if (q.length < 2) { setCitizenResults([]); return; }
    const { data } = await supabase
      .from("citizens")
      .select("id, nombre, apellido_paterno, roblox_nickname, folio_dni")
      .or(`roblox_nickname.ilike.%${q}%,nombre.ilike.%${q}%,folio_dni.ilike.%${q}%`)
      .limit(5);
    setCitizenResults(data || []);
  };

  const handleCreate = async () => {
    if (!selectedCitizen || !newPlaca || !newPassword) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    setCreating(true);

    // Check if citizen is already an officer
    const { data: existing } = await supabase
      .from("officers")
      .select("id")
      .eq("citizen_id", selectedCitizen.id)
      .maybeSingle();

    if (existing) {
      toast.error("Este ciudadano ya es oficial");
      setCreating(false);
      return;
    }

    // Get user_id from citizen to assign role
    const { data: citizenData } = await supabase
      .from("citizens")
      .select("user_id")
      .eq("id", selectedCitizen.id)
      .single();

    const { error } = await supabase.from("officers").insert({
      citizen_id: selectedCitizen.id,
      placa: newPlaca,
      contrasena_hash: newPassword, // In production, hash this
      rango: newRango,
      departamento: newDepto,
      salario: parseInt(newSalario),
    });

    if (error) {
      toast.error("Error al crear oficial: " + error.message);
      setCreating(false);
      return;
    }

    // Assign officer role
    if (citizenData?.user_id) {
      await supabase.from("user_roles").insert({
        user_id: citizenData.user_id,
        role: "officer" as any,
      });
    }

    toast.success(`Oficial ${selectedCitizen.roblox_nickname} creado con placa ${newPlaca}`);
    setShowCreate(false);
    setSelectedCitizen(null);
    setCitizenSearch("");
    setNewPlaca("");
    setNewPassword("");
    setNewRango("Cadete");
    setNewDepto("RCPD");
    setNewSalario("50000");
    setCreating(false);
    fetchOfficers();
  };

  const startEdit = (o: OfficerRow) => {
    setEditingId(o.id);
    setEditData({ rango: o.rango, departamento: o.departamento, salario: o.salario, placa: o.placa });
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from("officers")
      .update({
        rango: editData.rango,
        departamento: editData.departamento,
        salario: editData.salario,
        placa: editData.placa,
      })
      .eq("id", id);

    if (error) {
      toast.error("Error: " + error.message);
      return;
    }
    toast.success("Oficial actualizado");
    setEditingId(null);
    fetchOfficers();
  };

  const deleteOfficer = async (o: OfficerRow) => {
    if (!confirm(`¿Eliminar al oficial ${o.citizen_name} (${o.placa})?`)) return;

    const { error } = await supabase.from("officers").delete().eq("id", o.id);
    if (error) {
      toast.error("Error: " + error.message);
      return;
    }

    // Remove officer role
    const { data: citizenData } = await supabase
      .from("citizens")
      .select("user_id")
      .eq("id", o.citizen_id)
      .single();

    if (citizenData?.user_id) {
      await supabase.from("user_roles").delete().eq("user_id", citizenData.user_id).eq("role", "officer");
    }

    toast.success("Oficial eliminado");
    fetchOfficers();
  };

  const filtered = officers.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.citizen_name.toLowerCase().includes(q) ||
      o.roblox_nickname.toLowerCase().includes(q) ||
      o.placa.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Panel de Administración</h1>
              <p className="text-xs text-muted-foreground">RCDU — Gestión de Policías</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{officers.length}</p>
                <p className="text-xs text-muted-foreground">Total Oficiales</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold">{officers.filter((o) => o.en_servicio).length}</p>
                <p className="text-xs text-muted-foreground">En Servicio</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-2xl font-bold">{new Set(officers.map((o) => o.departamento)).size}</p>
                <p className="text-xs text-muted-foreground">Departamentos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, Roblox o placa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Dar de Alta Oficial
          </Button>
        </div>

        {/* Create form */}
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 mb-6"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo Oficial
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Citizen search */}
              <div className="md:col-span-2">
                <label className="text-sm text-muted-foreground mb-1 block">Buscar Ciudadano</label>
                {selectedCitizen ? (
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
                    <span className="font-medium">{selectedCitizen.nombre} {selectedCitizen.apellido_paterno}</span>
                    <span className="text-muted-foreground text-sm">({selectedCitizen.roblox_nickname})</span>
                    <span className="text-xs text-muted-foreground ml-auto">DNI: {selectedCitizen.folio_dni}</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCitizen(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="Nombre, Roblox o DNI Folio..."
                      value={citizenSearch}
                      onChange={(e) => searchCitizens(e.target.value)}
                    />
                    {citizenResults.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg overflow-hidden shadow-lg">
                        {citizenResults.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => { setSelectedCitizen(c); setCitizenResults([]); setCitizenSearch(""); }}
                            className="w-full px-4 py-2 text-left hover:bg-muted/50 flex justify-between items-center"
                          >
                            <span>{c.nombre} {c.apellido_paterno}</span>
                            <span className="text-xs text-muted-foreground">{c.roblox_nickname}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Número de Placa</label>
                <Input placeholder="Ej: RC-001" value={newPlaca} onChange={(e) => setNewPlaca(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Contraseña MDT</label>
                <Input type="password" placeholder="Contraseña de acceso" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Rango</label>
                <Select value={newRango} onValueChange={setNewRango}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RANGOS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Departamento</label>
                <Select value={newDepto} onValueChange={setNewDepto}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEPARTAMENTOS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Salario</label>
                <Input type="number" value={newSalario} onChange={(e) => setNewSalario(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Crear Oficial
              </Button>
            </div>
          </motion.div>
        )}

        {/* Officers table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Roblox</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Placa</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Rango</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Depto</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Salario</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Estado</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        No se encontraron oficiales
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o) => (
                      <tr key={o.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{o.citizen_name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{o.roblox_nickname}</td>
                        <td className="px-4 py-3">
                          {editingId === o.id ? (
                            <Input value={editData.placa || ""} onChange={(e) => setEditData({ ...editData, placa: e.target.value })} className="h-8 w-24" />
                          ) : (
                            <span className="px-2 py-1 rounded bg-primary/10 text-primary text-sm font-mono">{o.placa}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingId === o.id ? (
                            <Select value={editData.rango} onValueChange={(v) => setEditData({ ...editData, rango: v })}>
                              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {RANGOS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm">{o.rango}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingId === o.id ? (
                            <Select value={editData.departamento} onValueChange={(v) => setEditData({ ...editData, departamento: v })}>
                              <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {DEPARTAMENTOS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm">{o.departamento}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingId === o.id ? (
                            <Input type="number" value={editData.salario || 0} onChange={(e) => setEditData({ ...editData, salario: parseInt(e.target.value) })} className="h-8 w-24" />
                          ) : (
                            <span className="text-sm font-mono">${o.salario.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${o.en_servicio ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${o.en_servicio ? "bg-emerald-400" : "bg-muted-foreground"}`} />
                            {o.en_servicio ? "En Servicio" : "Fuera"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editingId === o.id ? (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => saveEdit(o.id)}>
                                <Save className="h-4 w-4 text-emerald-400" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => startEdit(o)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteOfficer(o)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
