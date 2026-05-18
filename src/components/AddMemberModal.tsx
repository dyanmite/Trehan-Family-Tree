"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/components/Toast";
import Image from "next/image";
import type { FamilyMember, MemberNodeData } from "@/types";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  relativeToId?: string | null;
  relationType?: "child" | "parent" | "spouse" | "sibling" | null;
  editMemberData?: MemberNodeData | null;
}

export function AddMemberModal({ isOpen, onClose, onSuccess, relativeToId, relationType, editMemberData }: AddMemberModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [existingMembers, setExistingMembers] = useState<FamilyMember[]>([]);
  const [relativeName, setRelativeName] = useState<string>("");
  const [isDeceased, setIsDeceased] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    first_name: "", last_name: "Trehan", relation_title: "", gender: "male",
    birth_date: "", death_date: "", marriage_date: "", city: "", bio: "",
    father_id: "", mother_id: "", spouse_id: "", sibling_id: "",
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      supabase.from("family_members").select("*").then(({ data }) => {
        setExistingMembers((data as FamilyMember[]) || []);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && editMemberData) {
      const [first_name = "", ...lastNames] = (editMemberData.name || "").split(" ");
      setFormData({
        first_name, last_name: lastNames.join(" ") || "Trehan",
        relation_title: editMemberData.relation || "", gender: editMemberData.gender || "male",
        birth_date: editMemberData.dob || "", death_date: editMemberData.deathDate || "",
        marriage_date: editMemberData.marriageDate || "", city: editMemberData.city || "",
        bio: editMemberData.bio || "", father_id: editMemberData.fatherId || "",
        mother_id: editMemberData.motherId || "", spouse_id: editMemberData.spouseId || "", sibling_id: "",
      });
      setIsDeceased(!!editMemberData.deathDate);
      setPhotoPreview(editMemberData.photoUrl || null);
    } else if (isOpen && !editMemberData) {
      setFormData({ first_name: "", last_name: "Trehan", relation_title: "", gender: "male", birth_date: "", death_date: "", marriage_date: "", city: "", bio: "", father_id: "", mother_id: "", spouse_id: "", sibling_id: "" });
      setIsDeceased(false); setPhotoPreview(null); setPhotoFile(null);
    }
  }, [isOpen, editMemberData]);

  useEffect(() => {
    return () => { if (photoPreview && photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview); };
  }, [photoPreview]);

  useEffect(() => {
    if (relativeToId && existingMembers.length > 0) {
      const rel = existingMembers.find(m => m.id === relativeToId);
      if (rel) setRelativeName(`${rel.first_name} ${rel.last_name}`);
    } else { setRelativeName(""); }
  }, [relativeToId, existingMembers]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (photoPreview && photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
      setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;
    setUploadingImage(true);
    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    try {
      const { error: uploadError } = await supabase.storage.from('family_photos').upload(fileName, photoFile);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('family_photos').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) { console.error('Error uploading image: ', error); return null; }
    finally { setUploadingImage(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      let photo_url = null;
      if (photoFile) photo_url = await uploadPhoto();
      const payload: Record<string, unknown> = {
        first_name: formData.first_name, last_name: formData.last_name,
        relation_title: formData.relation_title || null, gender: formData.gender,
        birth_date: formData.birth_date || null,
        death_date: isDeceased && formData.death_date ? formData.death_date : null,
        marriage_date: formData.marriage_date || null, city: formData.city || null, bio: formData.bio || null,
      };
      if (photo_url) payload.photo_url = photo_url;
      if (formData.father_id) payload.father_id = formData.father_id;
      if (formData.mother_id) payload.mother_id = formData.mother_id;
      if (formData.spouse_id) payload.spouse_id = formData.spouse_id;
      if (formData.sibling_id) {
        const sibling = existingMembers.find(m => m.id === formData.sibling_id);
        if (sibling) {
          if (sibling.father_id && !payload.father_id) payload.father_id = sibling.father_id;
          if (sibling.mother_id && !payload.mother_id) payload.mother_id = sibling.mother_id;
        }
      }

      if (!editMemberData && relativeToId && relationType) {
        if (relationType === "child") {
          const parent = existingMembers.find(m => m.id === relativeToId);
          if (parent?.gender === 'female') payload.mother_id = relativeToId;
          else payload.father_id = relativeToId;
        } else if (relationType === "spouse") { payload.spouse_id = relativeToId; }
        else if (relationType === "sibling") {
          const siblingData = existingMembers.find(m => m.id === relativeToId);
          if (siblingData) {
            if (siblingData.father_id) payload.father_id = siblingData.father_id;
            if (siblingData.mother_id) payload.mother_id = siblingData.mother_id;
          }
        }
      }

      // Auto-link spouse of a selected parent
      if (payload.father_id && !payload.mother_id) {
        const father = existingMembers.find(m => m.id === payload.father_id);
        if (father && father.spouse_id) payload.mother_id = father.spouse_id;
      }
      if (payload.mother_id && !payload.father_id) {
        const mother = existingMembers.find(m => m.id === payload.mother_id);
        if (mother && mother.spouse_id) payload.father_id = mother.spouse_id;
      }
      
      if (editMemberData) {
        const { error } = await supabase.from("family_members").update(payload).eq("id", editMemberData.id);
        if (error) throw error;
        addToast("success", `${formData.first_name} updated successfully!`);
      } else {
        const { data: newMember, error } = await supabase.from("family_members").insert([payload]).select().single();
        if (error) throw error;
        if (relativeToId && relationType === "parent" && newMember) {
          const updatePayload: Record<string, unknown> = {};
          if (payload.gender === 'female') updatePayload.mother_id = newMember.id;
          else updatePayload.father_id = newMember.id;
          await supabase.from("family_members").update(updatePayload).eq("id", relativeToId);
        }
        if (relativeToId && relationType === "spouse" && newMember) {
          await supabase.from("family_members").update({ spouse_id: newMember.id }).eq("id", relativeToId);
        }
        addToast("success", `${formData.first_name} added to the family tree!`);
      }
      onSuccess(); onClose();
    } catch (error) { console.error("Error adding member:", error); addToast("error", "Failed to save family member. Please try again."); }
    finally { setLoading(false); }
  };

  const modalTitle = editMemberData ? "Edit Family Member" : relationType ? `Add ${relationType.charAt(0).toUpperCase() + relationType.slice(1)}` : "Add Family Member";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="bg-card w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center p-6 border-b border-border">
                <h2 className="text-xl font-heading font-semibold text-foreground">{modalTitle}</h2>
                <button onClick={onClose} className="p-2 bg-muted hover:bg-border rounded-full transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              {relativeToId && relativeName && !editMemberData && (
                <div className="px-6 py-3 bg-accent/10 border-b border-border text-sm font-medium text-accent-foreground">
                  Adding {relationType} of <strong>{relativeName}</strong>
                </div>
              )}
              <div className="overflow-y-auto p-6 flex-1">
                <form id="add-member-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex justify-center mb-4">
                    <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageSelect} />
                    <div onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-primary/50 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors overflow-hidden relative group">
                      {photoPreview ? (<><Image src={photoPreview} alt="Preview" fill className="object-cover" /><div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center"><Upload className="w-6 h-6 text-white" /></div></>) : (<><Upload className="w-6 h-6 text-primary mb-1" /><span className="text-[10px] text-muted-foreground uppercase font-medium">Add Photo</span></>)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-sm font-medium text-foreground">First Name</label><input required type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Ramesh" /></div>
                    <div className="space-y-1"><label className="text-sm font-medium text-foreground">Last Name</label><input required type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Relation Title</label>
                      <input type="text" value={formData.relation_title} onChange={(e) => setFormData({...formData, relation_title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Dada, Mamu, Son" list="relation-suggestions" />
                      <datalist id="relation-suggestions">
                        <option value="Dada (Paternal Grandfather)" /><option value="Dadi (Paternal Grandmother)" />
                        <option value="Nana (Maternal Grandfather)" /><option value="Nani (Maternal Grandmother)" />
                        <option value="Papa (Father)" /><option value="Mummy (Mother)" />
                        <option value="Tauji (Father's Elder Brother)" /><option value="Taiji (Tauji's Wife)" />
                        <option value="Chacha (Father's Younger Brother)" /><option value="Chachi (Chacha's Wife)" />
                        <option value="Mama (Maternal Uncle)" /><option value="Mami (Mama's Wife)" />
                        <option value="Bua (Paternal Aunt)" /><option value="Fufaji (Bua's Husband)" />
                        <option value="Maasi (Maternal Aunt)" /><option value="Mausa (Maasi's Husband)" />
                        <option value="Bhai (Brother)" /><option value="Behen (Sister)" />
                        <option value="Beta (Son)" /><option value="Beti (Daughter)" />
                        <option value="Bhabhi (Brother's Wife)" /><option value="Jijaji (Sister's Husband)" />
                        <option value="Husband" /><option value="Wife" />
                      </datalist>
                    </div>
                    <div className="space-y-1"><label className="text-sm font-medium text-foreground">Gender</label><select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-sm font-medium text-foreground">Birth Date</label><input type="date" value={formData.birth_date} onChange={(e) => setFormData({...formData, birth_date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                    <div className="space-y-1"><label className="text-sm font-medium text-foreground">Marriage Date</label><input type="date" value={formData.marriage_date} onChange={(e) => setFormData({...formData, marriage_date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input type="checkbox" checked={isDeceased} onChange={(e) => { setIsDeceased(e.target.checked); if (!e.target.checked) setFormData({...formData, death_date: ""}); }} className="w-4 h-4 rounded border-input text-primary focus:ring-primary accent-primary" />
                      <span className="text-sm font-medium text-foreground">This person is deceased</span>
                    </label>
                    {isDeceased && (<div className="space-y-1"><label className="text-sm font-medium text-muted-foreground">Date of Death</label><input type="date" value={formData.death_date} onChange={(e) => setFormData({...formData, death_date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary" /></div>)}
                  </div>
                  <div className="space-y-1"><label className="text-sm font-medium text-foreground">City (Optional)</label><input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. New Delhi" /></div>
                  {!relativeToId && !editMemberData && existingMembers.length > 0 && (
                    <div className="border border-border rounded-xl p-4 space-y-3 bg-background">
                      <h4 className="text-sm font-semibold text-foreground">Link to Existing Members</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">Father</label><select value={formData.father_id} onChange={(e) => setFormData({...formData, father_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary text-sm"><option value="">— None —</option>{existingMembers.filter(m => m.gender === 'male').map(m => (<option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>))}</select></div>
                        <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">Mother</label><select value={formData.mother_id} onChange={(e) => setFormData({...formData, mother_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary text-sm"><option value="">— None —</option>{existingMembers.filter(m => m.gender === 'female').map(m => (<option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>))}</select></div>
                        <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">Spouse</label><select value={formData.spouse_id} onChange={(e) => setFormData({...formData, spouse_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary text-sm"><option value="">— None —</option>{existingMembers.map(m => (<option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>))}</select></div>
                        <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">Sibling (auto-links parents)</label><select value={formData.sibling_id} onChange={(e) => setFormData({...formData, sibling_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary text-sm"><option value="">— None —</option>{existingMembers.map(m => (<option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>))}</select></div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1"><label className="text-sm font-medium text-foreground">Short Bio (Optional)</label><textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={3} className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="A short note about them..." /></div>
                </form>
              </div>
              <div className="p-6 border-t border-border bg-background">
                <button type="submit" form="add-member-form" disabled={loading || uploadingImage}
                  className="w-full bg-primary hover:bg-[#8AA496] text-primary-foreground py-3 rounded-xl text-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {(loading || uploadingImage) ? <Loader2 className="w-5 h-5 animate-spin" /> : (editMemberData ? "Update Member" : "Save Member")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
