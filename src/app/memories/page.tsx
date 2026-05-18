"use client";

import Link from "next/link";
import { ArrowLeft, Plus, Image as ImageIcon, Calendar as CalendarIcon, Lock, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/components/Toast";
import Image from "next/image";
import type { Memory } from "@/types";
import { AddMemoryModal } from "@/components/AddMemoryModal";

export default function MemoriesPage() {
  const { addToast } = useToast();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMemory, setEditMemory] = useState<Memory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchMemories(); }, []);

  const fetchMemories = async () => {
    try {
      const { data, error } = await supabase.from("family_memories").select("*").order("date", { ascending: false });
      if (error) throw error;
      setMemories((data as Memory[]) || []);
    } catch (error) { console.error("Error fetching memories:", error); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("family_memories").delete().eq("id", id);
      if (error) throw error;
      addToast("success", "Memory deleted.");
      setDeletingId(null);
      fetchMemories();
    } catch (error) { console.error("Error deleting memory:", error); addToast("error", "Failed to delete memory."); }
  };

  const handleLock = () => { localStorage.removeItem("family_auth"); window.location.reload(); };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border p-4 flex justify-between items-center z-10 shadow-sm sticky top-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-foreground" /></Link>
          <h1 className="font-heading text-lg sm:text-xl font-semibold text-foreground">Family Memories</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditMemory(null); setIsModalOpen(true); }} className="bg-primary hover:bg-[#8AA496] text-primary-foreground px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Memory</span>
          </button>
          <button onClick={handleLock} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground" title="Lock app"><Lock className="w-5 h-5" /></button>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 py-12 relative">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : memories.length === 0 ? (
          <div className="text-center py-32">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"><ImageIcon className="w-10 h-10 text-primary" /></div>
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-2">No Memories Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Start preserving your family&apos;s history by adding your first memory.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {(() => {
              const grouped: Record<string, Record<string, Memory[]>> = memories.reduce((acc: Record<string, Record<string, Memory[]>>, memory) => {
                const date = new Date(memory.date);
                const year = date.getFullYear().toString();
                const month = date.toLocaleString('default', { month: 'long' });
                if (!acc[year]) acc[year] = {};
                if (!acc[year][month]) acc[year][month] = [];
                acc[year][month].push(memory);
                return acc;
              }, {});
              return Object.entries(grouped).sort(([a], [b]) => Number(b) - Number(a)).map(([year, months]) => (
                <div key={year} className="space-y-8">
                  <div className="flex justify-center"><div className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-heading font-semibold shadow-md">{year}</div></div>
                  {Object.entries(months).map(([month, monthMemories]) => (
                    <div key={`${year}-${month}`} className="space-y-6">
                      <div className="flex justify-center"><div className="bg-muted text-muted-foreground px-4 py-1 rounded-full text-sm font-medium border border-border shadow-sm">{month}</div></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {monthMemories.map((memory) => (
                          <div key={memory.id} className="bg-card p-5 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow group relative">
                            <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditMemory(memory); setIsModalOpen(true); }} className="p-1.5 bg-white/80 backdrop-blur-sm border border-border rounded-lg hover:bg-muted transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                              <button onClick={() => setDeletingId(memory.id)} className="p-1.5 bg-white/80 backdrop-blur-sm border border-red-200 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                            </div>
                            {deletingId === memory.id && (
                              <div className="absolute inset-0 bg-card/95 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center p-4">
                                <p className="text-sm font-medium text-foreground mb-3 text-center">Delete this memory?</p>
                                <div className="flex gap-2">
                                  <button onClick={() => handleDelete(memory.id)} className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">Delete</button>
                                  <button onClick={() => setDeletingId(null)} className="px-4 py-1.5 bg-muted border border-border rounded-lg text-sm font-medium hover:bg-border transition-colors">Cancel</button>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-primary text-sm font-medium mb-3"><CalendarIcon className="w-4 h-4" />{new Date(memory.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            <h3 className="text-lg font-heading font-semibold mb-2">{memory.title}</h3>
                            {memory.description && <p className="text-muted-foreground text-sm mb-3 line-clamp-3">{memory.description}</p>}
                            {memory.media_url && memory.media_type === 'image' && (<div className="relative w-full h-44 rounded-xl overflow-hidden"><Image src={memory.media_url} alt={memory.title} fill className="object-cover" /></div>)}
                            {memory.media_type === 'story' && !memory.media_url && (<div className="flex items-center gap-2 text-xs text-accent-foreground bg-accent/10 px-3 py-1.5 rounded-full w-fit font-medium">📖 Family Story</div>)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        )}
      </main>
      <AddMemoryModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditMemory(null); }} onSuccess={fetchMemories} editMemoryData={editMemory} />
    </div>
  );
}
