-- ── Fix: Add missing UPDATE and DELETE policies for family_memories ──
CREATE POLICY "Allow public update access on memories" 
  ON public.family_memories FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on memories" 
  ON public.family_memories FOR DELETE USING (true);

-- ── Fix: Add DELETE policies for storage objects ──
CREATE POLICY "Public Delete on family photos" 
  ON storage.objects FOR DELETE USING (bucket_id = 'family_photos');

CREATE POLICY "Public Delete on memories media" 
  ON storage.objects FOR DELETE USING (bucket_id = 'family_memories_media');

-- ── Optional: Add updated_at trigger for family_members ──
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
