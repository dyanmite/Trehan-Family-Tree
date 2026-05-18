CREATE TABLE IF NOT EXISTS public.family_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video', 'story')),
    uploaded_by UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.family_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on memories" ON public.family_memories FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on memories" ON public.family_memories FOR INSERT WITH CHECK (true);

-- Create Storage Bucket for Memories Media
INSERT INTO storage.buckets (id, name, public) VALUES ('family_memories_media', 'family_memories_media', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public Access on memories media" ON storage.objects FOR SELECT USING (bucket_id = 'family_memories_media');
CREATE POLICY "Public Insert on memories media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'family_memories_media');
