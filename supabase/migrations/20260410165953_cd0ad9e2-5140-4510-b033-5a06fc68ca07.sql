
-- Admin can manage store_items
CREATE POLICY "Admins can insert store items" ON public.store_items FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update store items" ON public.store_items FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete store items" ON public.store_items FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can manage properties
CREATE POLICY "Admins can insert properties" ON public.properties FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete properties" ON public.properties FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can insert notifications
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
