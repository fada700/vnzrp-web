
-- Enable realtime for emergency_reports
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_reports;

-- Allow officers/admins to delete from wanted_list
CREATE POLICY "Officers can delete wanted"
ON public.wanted_list
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'officer'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
