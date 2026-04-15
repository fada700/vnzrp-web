
ALTER TABLE public.arrests
ADD COLUMN duracion_minutos integer NOT NULL DEFAULT 60,
ADD COLUMN expira_en timestamp with time zone NOT NULL DEFAULT (now() + interval '1 hour');

CREATE POLICY "Officers can delete arrests"
ON public.arrests
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'officer'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
