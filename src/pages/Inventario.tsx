import { Package, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useVehicles } from "@/hooks/useData";

export default function Inventario() {
  const { data: vehicles, isLoading } = useVehicles();

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" /> Inventario
        </h1>
        <p className="text-sm text-muted-foreground">{vehicles?.length ?? 0} items en tu inventario</p>
      </div>

      {!vehicles || vehicles.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold text-foreground">Inventario vacío</h2>
          <p className="text-sm text-muted-foreground mt-1">Compra items en la tienda para verlos aquí</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {vehicles.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-4 card-hover"
            >
              <div className="aspect-square rounded-lg bg-surface-3 flex items-center justify-center mb-3">
                <Package className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{v.marca} {v.modelo}</h3>
              <p className="text-xs text-muted-foreground">Color: {v.color} · {v.anio}</p>
              <p className="mt-1 text-xs font-mono text-primary">VIN: {v.vin}</p>
              <p className="text-xs font-mono text-muted-foreground">Matrícula: {v.matricula}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
