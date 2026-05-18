-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Family Members Table
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL DEFAULT 'Trehan',
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    birth_date DATE,
    death_date DATE,
    bio TEXT,
    city TEXT,
    phone TEXT,
    photo_url TEXT,
    
    -- Relationships (Self-referencing foreign keys)
    father_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
    mother_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
    spouse_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Since this is a family app with a shared passcode, we allow all authenticated users (or anonymous if setup that way)
-- We'll allow public read and write since the app itself is gated by the PasscodeGate on the frontend.
CREATE POLICY "Allow public read access" ON public.family_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.family_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.family_members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.family_members FOR DELETE USING (true);

-- Create Storage Bucket for Photos
INSERT INTO storage.buckets (id, name, public) VALUES ('family_photos', 'family_photos', true) ON CONFLICT DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'family_photos');
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'family_photos');
