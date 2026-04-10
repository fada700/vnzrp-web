
-- Police chat table
CREATE TABLE public.police_chat (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  officer_id uuid NOT NULL REFERENCES public.officers(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.police_chat ENABLE ROW LEVEL SECURITY;

-- Officers can view all chat messages
CREATE POLICY "Officers can view chat" ON public.police_chat
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

-- Officers can send chat messages
CREATE POLICY "Officers can send chat" ON public.police_chat
  FOR INSERT TO authenticated
  WITH CHECK (
    officer_id IN (
      SELECT o.id FROM officers o JOIN citizens c ON o.citizen_id = c.id WHERE c.user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.police_chat;

-- Evidence storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', true);

CREATE POLICY "Anyone can view evidence" ON storage.objects
  FOR SELECT USING (bucket_id = 'evidence');

CREATE POLICY "Authenticated users can upload evidence" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence');

-- Officers can view ALL citizens
CREATE POLICY "Officers can view all citizens" ON public.citizens
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

-- Officers can view ALL vehicles
CREATE POLICY "Officers can view all vehicles" ON public.vehicles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

-- Officers can view ALL licenses
CREATE POLICY "Officers can view all licenses" ON public.licenses
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

-- Officers can view ALL fines
CREATE POLICY "Officers can view all fines" ON public.fines
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

-- Officers can INSERT fines
CREATE POLICY "Officers can create fines" ON public.fines
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

-- Officers can view ALL arrests
CREATE POLICY "Officers can view all arrests" ON public.arrests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

-- Officers can INSERT arrests
CREATE POLICY "Officers can create arrests" ON public.arrests
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

-- Officers can view ALL emergency reports
CREATE POLICY "Officers can view all reports" ON public.emergency_reports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

-- Officers can update emergency reports (mark as en camino / resuelto)
CREATE POLICY "Officers can update reports" ON public.emergency_reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

-- Officers can view wanted list
CREATE POLICY "Officers can view wanted list" ON public.wanted_list
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

-- Officers can manage wanted list
CREATE POLICY "Officers can insert wanted" ON public.wanted_list
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers can update wanted" ON public.wanted_list
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

-- Officers can view all officers (for active list)
CREATE POLICY "Officers can view all officers" ON public.officers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

-- Officers can update own officer record (for shift status)
CREATE POLICY "Officers can update own record" ON public.officers
  FOR UPDATE TO authenticated
  USING (citizen_id IN (SELECT id FROM citizens WHERE user_id = auth.uid()));

-- Officers can view all shifts
CREATE POLICY "Officers can view all shifts" ON public.officer_shifts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));
