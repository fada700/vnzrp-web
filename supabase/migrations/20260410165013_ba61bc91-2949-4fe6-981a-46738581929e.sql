
-- Change default balance to 2000
ALTER TABLE public.citizens ALTER COLUMN balance SET DEFAULT 2000;

-- Add subcategoria to store_items
ALTER TABLE public.store_items ADD COLUMN IF NOT EXISTS subcategoria text DEFAULT 'General';

-- Create purchases table for inventory tracking
CREATE TABLE public.purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  citizen_id uuid NOT NULL REFERENCES public.citizens(id) ON DELETE CASCADE,
  store_item_id uuid REFERENCES public.store_items(id),
  nombre text NOT NULL,
  categoria text NOT NULL DEFAULT 'Objetos',
  precio_pagado bigint NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Citizens can view own purchases"
  ON public.purchases FOR SELECT
  USING (citizen_id IN (SELECT id FROM citizens WHERE user_id = auth.uid()));

CREATE POLICY "Citizens can create own purchases"
  ON public.purchases FOR INSERT
  WITH CHECK (citizen_id IN (SELECT id FROM citizens WHERE user_id = auth.uid()));

-- Update store_items default categoria
ALTER TABLE public.store_items ALTER COLUMN categoria SET DEFAULT 'Concesionario';
