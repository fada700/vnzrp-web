
-- ============================================
-- RCDU DATABASE SCHEMA
-- ============================================

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- 1. CITIZENS (Ciudadanos / DNI)
-- ============================================
CREATE TABLE public.citizens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  apellido_paterno TEXT NOT NULL,
  apellido_materno TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  nacionalidad TEXT NOT NULL DEFAULT 'Chilena',
  genero TEXT NOT NULL,
  rut TEXT NOT NULL UNIQUE,
  folio_dni TEXT NOT NULL UNIQUE,
  roblox_nickname TEXT NOT NULL,
  roblox_id TEXT,
  avatar_url TEXT,
  verificado BOOLEAN NOT NULL DEFAULT false,
  balance BIGINT NOT NULL DEFAULT 1000000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.citizens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Citizens can view own data" ON public.citizens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Citizens can update own data" ON public.citizens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Citizens can insert own data" ON public.citizens FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_citizens_updated_at BEFORE UPDATE ON public.citizens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. STORE ITEMS (Tienda)
-- ============================================
CREATE TABLE public.store_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Vehículos',
  marca TEXT,
  modelo TEXT,
  anio INTEGER,
  precio BIGINT NOT NULL,
  imagen_url TEXT,
  stock INTEGER NOT NULL DEFAULT -1,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view store items" ON public.store_items FOR SELECT USING (true);

CREATE TRIGGER update_store_items_updated_at BEFORE UPDATE ON public.store_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3. VEHICLES (Vehículos)
-- ============================================
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  citizen_id UUID REFERENCES public.citizens(id) ON DELETE CASCADE NOT NULL,
  store_item_id UUID REFERENCES public.store_items(id),
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  anio INTEGER,
  color TEXT NOT NULL,
  matricula TEXT NOT NULL UNIQUE,
  vin TEXT NOT NULL UNIQUE,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'robado', 'buscado', 'destruido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Citizens can view own vehicles" ON public.vehicles FOR SELECT USING (citizen_id IN (SELECT id FROM public.citizens WHERE user_id = auth.uid()));
CREATE POLICY "Citizens can insert own vehicles" ON public.vehicles FOR INSERT WITH CHECK (citizen_id IN (SELECT id FROM public.citizens WHERE user_id = auth.uid()));

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 4. TRANSACTIONS (VersePay)
-- ============================================
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_citizen_id UUID REFERENCES public.citizens(id),
  receiver_citizen_id UUID REFERENCES public.citizens(id),
  monto BIGINT NOT NULL CHECK (monto > 0),
  tipo TEXT NOT NULL CHECK (tipo IN ('transferencia', 'compra', 'venta', 'sueldo', 'multa', 'impuesto', 'sistema')),
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Citizens can view own transactions" ON public.transactions FOR SELECT
  USING (
    sender_citizen_id IN (SELECT id FROM public.citizens WHERE user_id = auth.uid())
    OR receiver_citizen_id IN (SELECT id FROM public.citizens WHERE user_id = auth.uid())
  );
CREATE POLICY "Citizens can create transactions" ON public.transactions FOR INSERT
  WITH CHECK (sender_citizen_id IN (SELECT id FROM public.citizens WHERE user_id = auth.uid()));

-- ============================================
-- 5. FINES (Multas)
-- ============================================
CREATE TABLE public.fines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  citizen_id UUID REFERENCES public.citizens(id) ON DELETE CASCADE NOT NULL,
  officer_id UUID REFERENCES public.citizens(id),
  monto BIGINT NOT NULL,
  razon TEXT NOT NULL,
  pagada BOOLEAN NOT NULL DEFAULT false,
  evidencia_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Citizens can view own fines" ON public.fines FOR SELECT USING (citizen_id IN (SELECT id FROM public.citizens WHERE user_id = auth.uid()));
CREATE POLICY "Citizens can update own fines" ON public.fines FOR UPDATE USING (citizen_id IN (SELECT id FROM public.citizens WHERE user_id = auth.uid()));

CREATE TRIGGER update_fines_updated_at BEFORE UPDATE ON public.fines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 6. LICENSES (Licencias)
-- ============================================
CREATE TABLE public.licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  citizen_id UUID REFERENCES public.citizens(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('conducir', 'armas', 'caza')),
  fecha_emision TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_expiracion TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Citizens can view own licenses" ON public.licenses FOR SELECT USING (citizen_id IN (SELECT id FROM public.citizens WHERE user_id = auth.uid()));
CREATE POLICY "Citizens can insert own licenses" ON public.licenses FOR INSERT WITH CHECK (citizen_id IN (SELECT id FROM public.citizens WHERE user_id = auth.uid()));

-- ============================================
-- 7. PROPERTIES (Bienes Raíces)
-- ============================================
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  precio BIGINT NOT NULL,
  impuesto_mensual BIGINT NOT NULL DEFAULT 0,
  owner_citizen_id UUID REFERENCES public.citizens(id),
  disponible BOOLEAN NOT NULL DEFAULT true,
  imagen_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view properties" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Owners can update own properties" ON public.properties FOR UPDATE USING (owner_citizen_id IN (SELECT id FROM public.citizens WHERE user_id = auth.uid()));

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. EMERGENCY REPORTS (911)
-- ============================================
CREATE TABLE public.emergency_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  citizen_id UUID REFERENCES public.citizens(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  calle_sector TEXT,
  coord_x INTEGER,
  coord_y INTEGER,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'resuelto', 'cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.emergency_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Citizens can view own reports" ON public.emergency_reports FOR SELECT USING (citizen_id IN (SELECT id FROM public.citizens WHERE user_id = auth.uid()));
CREATE POLICY "Citizens can create reports" ON public.emergency_reports FOR INSERT WITH CHECK (citizen_id IN (SELECT id FROM public.citizens WHERE user_id = auth.uid()));

CREATE TRIGGER update_emergency_reports_updated_at BEFORE UPDATE ON public.emergency_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 9. NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  citizen_id UUID REFERENCES public.citizens(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'info' CHECK (tipo IN ('info', 'success', 'warning', 'error')),
  leida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Citizens can view own notifications" ON public.notifications FOR SELECT USING (citizen_id IN (SELECT id FROM public.citizens WHERE user_id = auth.uid()));
CREATE POLICY "Citizens can update own notifications" ON public.notifications FOR UPDATE USING (citizen_id IN (SELECT id FROM public.citizens WHERE user_id = auth.uid()));

-- ============================================
-- 10. OFFICERS (Oficiales MDT)
-- ============================================
CREATE TABLE public.officers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  citizen_id UUID REFERENCES public.citizens(id) ON DELETE CASCADE NOT NULL UNIQUE,
  placa TEXT NOT NULL UNIQUE,
  rango TEXT NOT NULL DEFAULT 'Cadete',
  departamento TEXT NOT NULL DEFAULT 'RCPD',
  salario BIGINT NOT NULL DEFAULT 50000,
  en_servicio BOOLEAN NOT NULL DEFAULT false,
  contrasena_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Officers can view own data" ON public.officers FOR SELECT USING (citizen_id IN (SELECT id FROM public.citizens WHERE user_id = auth.uid()));

CREATE TRIGGER update_officers_updated_at BEFORE UPDATE ON public.officers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 11. ARRESTS (Arrestos)
-- ============================================
CREATE TABLE public.arrests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  citizen_id UUID REFERENCES public.citizens(id) ON DELETE CASCADE NOT NULL,
  officer_id UUID REFERENCES public.officers(id) NOT NULL,
  cargos TEXT NOT NULL,
  evidencia_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.arrests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Citizens can view own arrests" ON public.arrests FOR SELECT USING (citizen_id IN (SELECT id FROM public.citizens WHERE user_id = auth.uid()));

-- ============================================
-- 12. WANTED LIST (Buscados)
-- ============================================
CREATE TABLE public.wanted_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  citizen_id UUID REFERENCES public.citizens(id) ON DELETE CASCADE NOT NULL,
  prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
  razon TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wanted_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to wanted list" ON public.wanted_list FOR SELECT USING (false);

-- ============================================
-- 13. OFFICER SHIFTS (Turnos)
-- ============================================
CREATE TABLE public.officer_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  officer_id UUID REFERENCES public.officers(id) ON DELETE CASCADE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'en_servicio' CHECK (estado IN ('en_servicio', 'descanso', 'finalizado')),
  inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fin TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.officer_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Officers can view own shifts" ON public.officer_shifts FOR SELECT USING (officer_id IN (SELECT o.id FROM public.officers o JOIN public.citizens c ON o.citizen_id = c.id WHERE c.user_id = auth.uid()));
CREATE POLICY "Officers can insert own shifts" ON public.officer_shifts FOR INSERT WITH CHECK (officer_id IN (SELECT o.id FROM public.officers o JOIN public.citizens c ON o.citizen_id = c.id WHERE c.user_id = auth.uid()));
CREATE POLICY "Officers can update own shifts" ON public.officer_shifts FOR UPDATE USING (officer_id IN (SELECT o.id FROM public.officers o JOIN public.citizens c ON o.citizen_id = c.id WHERE c.user_id = auth.uid()));

-- ============================================
-- 14. USER ROLES (Roles de usuario)
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'officer', 'citizen');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
