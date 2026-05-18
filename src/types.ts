// ── Shared TypeScript types for the Trehan Family Tree ──

export interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  gender: "male" | "female" | "other";
  birth_date: string | null;
  death_date: string | null;
  marriage_date: string | null;
  relation_title: string | null;
  bio: string | null;
  city: string | null;
  phone: string | null;
  photo_url: string | null;
  father_id: string | null;
  mother_id: string | null;
  spouse_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  title: string;
  description: string | null;
  date: string;
  media_url: string | null;
  media_type: "image" | "video" | "story" | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface MemberNodeData {
  id: string;
  name: string;
  relation?: string;
  photoUrl?: string;
  dob?: string;
  deathDate?: string;
  marriageDate?: string;
  city?: string;
  bio?: string;
  gender?: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  phone?: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}
