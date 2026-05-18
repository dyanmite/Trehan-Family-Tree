"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2, Image as ImageIcon, BookOpen, Camera } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/components/Toast";
import Image from "next/image";
import type { Memory } from "@/types";

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMemoryData?: Memory | null;
}

export function AddMemoryModal({ isOpen, onClose, onSuccess, editMemoryData }: AddMemoryModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [mediaType, setMediaType] = useState<"image" | "story">("image");
  const [formData, setFormData] = useState({ title: "", description: "", date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && editMemoryData) {
      setFormData({ title: editMemoryData.title, description: editMemoryData.description || "", date: editMemoryData.date });
      setMediaType(editMemoryData.media_type === "story" ? "story" : "image");
      if (editMemoryData.media_url) setPhotoPreview(editMemoryData.media_url);
    } else if (isOpen) {
      setFormData({ title: "", description: "", date: new Date().toISOString().split('T')[0] });
      setMediaType("image"); setPhotoPreview(null); setPhotoFile(null);
    }
  }, [isOpen, editMemoryData]);

  useEffect(() => {
    return () => { if (photoPreview && photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview); };
  }, [photoPreview]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (photoPreview && photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
      setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); setMediaType("image");
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;
    setUploadingImage(true);
    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    try {
      const { error: uploadError } = await supabase.storage.from('family_memories_media').upload(fileName, photoFile);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('family_memories_media').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) { console.error('Error uploading image: ', error); return null; }
    finally { setUploadingImage(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      let media_url = editMemoryData?.media_url || null;
      if (photoFile && mediaType === "image") media_url = await uploadPhoto();
      const payload = { ...formData, media_url, media_type: mediaType };
      if (editMemoryData) {
        const { error } = await supabase.from("family_memories").update(payload).eq("id", editMemoryData.id);
        if (error) throw error;
        addToast("success", "Memory updated!");
      } else {
        const { error } = await supabase.from("family_memories").insert([payload]);
        if (error) throw error;
        addToast("success", "Memory saved!");
      }
      onSuccess(); onClose();
      setFormData({ title: "", description: "", date: new Date().toISOString().split('T')[0] });
      setPhotoFile(null); setPhotoPreview(null); setMediaType("image");
    } catch (error) { console.error("Error saving memory:", error); addToast("error", "Failed to save memory."); }
    finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()} className="bg-card w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-heading font-semibold text-foreground">{editMemoryData ? "Edit Memory" : "Add a Memory"}</h2>
              <button onClick={onClose} className="p-2 bg-muted hover:bg-border rounded-full transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="overflow-y-auto p-6 flex-1">
              <div className="flex gap-4 mb-6">
                <button onClick={() => setMediaType("image")} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border ${mediaType === 'image' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted'} transition-colors font-medium`}><ImageIcon className="w-5 h-5" /> Photo</button>
                <button onClick={() => setMediaType("story")} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border ${mediaType === 'story' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted'} transition-colors font-medium`}><BookOpen className="w-5 h-5" /> Story</button>
              </div>
              <form id="add-memory-form" onSubmit={handleSubmit} className="space-y-4">
                {mediaType === "image" && (
                  <div className="flex flex-col items-center mb-6 gap-3">
                    <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageSelect} />
                    <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleImageSelect} />
                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 rounded-2xl bg-muted border-2 border-dashed border-primary/50 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors overflow-hidden relative group">
                      {photoPreview ? (<><Image src={photoPreview} alt="Preview" fill className="object-cover" /><div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center"><Upload className="w-8 h-8 text-white" /></div></>) : (<><Upload className="w-8 h-8 text-primary mb-2" /><span className="text-sm text-muted-foreground font-medium">Click to upload a photo</span></>)}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs bg-muted hover:bg-border text-foreground px-4 py-2 rounded-full transition-colors border border-border shadow-sm flex items-center gap-1.5"><Upload className="w-3.5 h-3.5 text-primary" /> Upload File</button>
                      <button type="button" onClick={() => cameraInputRef.current?.click()} className="text-xs bg-muted hover:bg-border text-foreground px-4 py-2 rounded-full transition-colors border border-border shadow-sm flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-primary" /> Take Photo</button>
                    </div>
                  </div>
                )}
                <div className="space-y-1"><label className="text-sm font-medium text-foreground">Memory Title</label><input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary" placeholder={mediaType === 'image' ? "e.g. Diwali 2015" : "e.g. How Grandma and Grandpa met"} /></div>
                <div className="space-y-1"><label className="text-sm font-medium text-foreground">Date</label><input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                <div className="space-y-1"><label className="text-sm font-medium text-foreground">{mediaType === 'image' ? 'Description (Optional)' : 'The Story'}</label><textarea required={mediaType === 'story'} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={5} className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder={mediaType === 'image' ? "Who is in the photo?" : "Write your story here..."} /></div>
              </form>
            </div>
            <div className="p-6 border-t border-border bg-background">
              <button type="submit" form="add-memory-form" disabled={loading || uploadingImage}
                className="w-full bg-primary hover:bg-[#8AA496] text-primary-foreground py-3 rounded-xl text-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {(loading || uploadingImage) ? <Loader2 className="w-5 h-5 animate-spin" /> : (editMemoryData ? "Update Memory" : "Save Memory")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
