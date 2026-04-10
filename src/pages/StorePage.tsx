import { motion } from "framer-motion";
import { Store as StoreIcon, Search, Car, Loader2 } from "lucide-react";
import { useState } from "react";
import { useStoreItems, formatMoney } from "@/hooks/useData";

const categories = ["Todos", "Vehículos", "Armas", "Tecnología", "Licencias"];

export default function StorePage() {
  const { data: items, isLoading } = useStoreItems();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [search, setSearch] = useState("");

  const filtered = (items || []).filter(item => {
    const matchSearch = item.nombre.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "Todos" || item.categoria === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <StoreIcon className="h-6 w-6 text-primary" /> Store
        </h1>
        <p className="text-sm text-muted-foreground">{filtered.length} items disponibles</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar item..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground hover:bg-surface-3"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Car className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold text-foreground">Sin items disponibles</h2>
          <p className="text-sm text-muted-foreground mt-1">La tienda está vacía por ahora</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl border border-border bg-card overflow-hidden card-hover"
            >
              <div className="relative aspect-video bg-surface-3 flex items-center justify-center">
                {item.imagen_url ? (
                  <img src={item.imagen_url} alt={item.nombre} className="h-full w-full object-cover" />
                ) : (
                  <Car className="h-12 w-12 text-muted-foreground/30" />
                )}
                <span className="absolute top-2 right-2 rounded px-2 py-0.5 text-[10px] font-bold bg-primary/80 text-primary-foreground">
                  {item.categoria}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-foreground">{item.nombre}</h3>
                <p className="text-xs text-muted-foreground">{item.marca} {item.modelo ? `· ${item.modelo}` : ""} {item.anio ? `· ${item.anio}` : ""}</p>
                <p className="mt-2 text-lg font-bold text-accent">{formatMoney(item.precio)}</p>
                <button className="mt-3 w-full rounded-lg bg-primary/10 border border-primary/30 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                  Comprar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
