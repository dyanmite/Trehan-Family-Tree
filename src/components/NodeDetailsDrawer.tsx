"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, MapPin, User as UserIcon, Heart, Users, UserPlus, Skull, Gem, Trash2, Search, Clock } from "lucide-react";
import Image from "next/image";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useToast } from "@/components/Toast";
import { supabase } from "@/utils/supabase/client";
import { getAllRelationships, getRelation, computeAge, categoryLabels } from "@/utils/relationshipEngine";
import type { FamilyMember, MemberNodeData } from "@/types";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberNodeData | null;
  allMembers: FamilyMember[];
}

export function NodeDetailsDrawer({ isOpen, onClose, member, allMembers }: DrawerProps) {
  const { openModal, refreshTree } = useFamilyStore();
  const { addToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [finderTargetId, setFinderTargetId] = useState<string>("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) { setShowDeleteConfirm(false); setFinderTargetId(""); }
  }, [isOpen]);

  const selfMember = member ? allMembers.find(m => m.id === member.id) : null;
  const relationships = selfMember ? getAllRelationships(selfMember.id, allMembers) : [];

  const grouped: Record<string, typeof relationships> = {};
  for (const r of relationships) {
    const cat = r.relation.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(r);
  }

  const finderResult = selfMember && finderTargetId
    ? (() => {
        const target = allMembers.find(m => m.id === finderTargetId);
        if (!target) return null;
        const rel = getRelation(selfMember, target, allMembers);
        return rel ? { member: target, relation: rel } : null;
      })()
    : null;

  const age = member ? computeAge(member.dob || null, member.deathDate || null) : null;

  const handleDelete = useCallback(async () => {
    if (!member) return;
    setDeleting(true);
    try {
      await supabase.from("family_members").update({ spouse_id: null }).eq("spouse_id", member.id);
      await supabase.from("family_members").update({ father_id: null }).eq("father_id", member.id);
      await supabase.from("family_members").update({ mother_id: null }).eq("mother_id", member.id);
      const { error } = await supabase.from("family_members").delete().eq("id", member.id);
      if (error) throw error;
      addToast("success", `${member.name} has been removed from the tree.`);
      refreshTree();
      onClose();
    } catch (err) {
      console.error("Error deleting member:", err);
      addToast("error", "Failed to delete member.");
    } finally { setDeleting(false); }
  }, [member, addToast, refreshTree, onClose]);

  return (
    <AnimatePresence>
      {isOpen && member && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40" />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card shadow-2xl z-50 overflow-y-auto border-l border-border"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <button onClick={onClose} className="p-2 bg-muted hover:bg-border rounded-full transition-colors text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { onClose(); openModal(null, null, member); }}
                    className="px-4 py-2 text-sm font-medium border border-border rounded-xl hover:bg-muted transition-colors text-foreground">
                    Edit Profile
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-2 text-sm font-medium border border-red-200 rounded-xl hover:bg-red-50 transition-colors text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl overflow-hidden">
                    <p className="text-sm font-medium text-red-700 mb-3">
                      Are you sure you want to remove <strong>{member.name}</strong> from the family tree? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={handleDelete} disabled={deleting}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                        {deleting ? "Removing..." : "Yes, Remove"}
                      </button>
                      <button onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 bg-white border border-border py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col items-center text-center mb-6">
                <div className={`w-28 h-28 rounded-full overflow-hidden flex items-center justify-center border-4 shadow-sm mb-4 relative ${member.deathDate ? 'bg-muted border-muted-foreground/30 grayscale' : 'bg-primary/10 border-white'}`}>
                  {member.photoUrl ? (
                    <Image src={member.photoUrl} alt={member.name} fill className="object-cover" />
                  ) : (
                    <UserIcon className="text-primary w-10 h-10" />
                  )}
                </div>
                <h2 className="text-2xl font-heading font-semibold text-foreground mb-1">{member.name}</h2>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {member.relation && (
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold uppercase tracking-wide">{member.relation}</span>
                  )}
                  {age && (
                    <span className="px-3 py-1 bg-secondary/30 text-secondary-foreground rounded-full text-xs font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {age}
                    </span>
                  )}
                  {member.deathDate && (
                    <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-semibold">🕊️ Deceased</span>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 mb-6">
                <div className="flex items-center gap-3 p-3.5 bg-background rounded-xl border border-border">
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase">Date of Birth</span>
                    <span className="text-sm font-medium">{member.dob ? new Date(member.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "Unknown"}</span>
                  </div>
                </div>
                {member.deathDate && (
                  <div className="flex items-center gap-3 p-3.5 bg-background rounded-xl border border-border">
                    <Skull className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-medium uppercase">Date of Death</span>
                      <span className="text-sm font-medium">{new Date(member.deathDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                )}
                {member.marriageDate && (
                  <div className="flex items-center gap-3 p-3.5 bg-background rounded-xl border border-border">
                    <Gem className="w-5 h-5 text-accent flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-medium uppercase">Marriage Date</span>
                      <span className="text-sm font-medium">{new Date(member.marriageDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3.5 bg-background rounded-xl border border-border">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase">City</span>
                    <span className="text-sm font-medium">{member.city || "Unknown"}</span>
                  </div>
                </div>
                {member.bio && (
                  <div className="p-3.5 bg-background rounded-xl border border-border">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase block mb-1">About</span>
                    <p className="text-sm text-foreground leading-relaxed">{member.bio}</p>
                  </div>
                )}
              </div>

              {/* Relationship Finder */}
              <div className="mb-6 p-4 bg-gradient-to-br from-accent/10 to-secondary/10 rounded-2xl border border-accent/20">
                <h3 className="font-heading font-medium text-sm mb-3 text-foreground flex items-center gap-2">
                  <Search className="w-4 h-4 text-accent" /> Relationship Finder
                </h3>
                <select value={finderTargetId} onChange={(e) => setFinderTargetId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                  <option value="">Select a family member…</option>
                  {allMembers.filter(m => m.id !== member.id).map(m => (
                    <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                  ))}
                </select>
                <AnimatePresence>
                  {finderResult && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-3 p-3 bg-card rounded-xl border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{finderResult.relation.emoji}</span>
                        <span className="font-heading font-semibold text-foreground">{finderResult.relation.hindiLabel}</span>
                        <span className="text-xs text-muted-foreground">({finderResult.relation.englishLabel})</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <strong>{finderResult.member.first_name}</strong> is {member.name}&apos;s <strong>{finderResult.relation.hindiLabel}</strong> — {finderResult.relation.path}
                      </p>
                    </motion.div>
                  )}
                  {finderTargetId && !finderResult && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="mt-3 p-3 bg-card rounded-xl border border-border text-sm text-muted-foreground">
                      No direct relationship found. They may be distantly related.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* All Relations grouped */}
              {relationships.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-heading font-medium text-sm mb-3 text-foreground">
                    Family Relations ({relationships.length})
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(grouped).map(([cat, rels]) => (
                      <div key={cat}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          {categoryLabels[cat] || cat}
                        </p>
                        <div className="space-y-1.5">
                          {rels.map(({ member: rel, relation }) => (
                            <div key={rel.id} className="flex items-center gap-3 p-2.5 bg-background rounded-xl border border-border hover:shadow-sm transition-shadow">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                                {rel.photo_url ? (
                                  <Image src={rel.photo_url} alt={`${rel.first_name} ${rel.last_name}`} fill className="object-cover" />
                                ) : (
                                  <span className="text-sm">{relation.emoji}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-foreground truncate block">{rel.first_name} {rel.last_name}</span>
                                <span className="text-[10px] text-muted-foreground">{relation.path}</span>
                              </div>
                              <span className="text-xs bg-accent/15 text-accent-foreground px-2 py-1 rounded-full font-semibold flex-shrink-0">
                                {relation.hindiLabel}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <h3 className="font-heading font-medium text-sm mb-3 text-foreground">Add Family</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => openModal(member.id, "parent")}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 bg-muted hover:bg-border rounded-xl transition-colors border border-border">
                  <UserIcon className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">Add Parent</span>
                </button>
                <button onClick={() => openModal(member.id, "spouse")}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 bg-muted hover:bg-border rounded-xl transition-colors border border-border">
                  <Heart className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">Add Spouse</span>
                </button>
                <button onClick={() => openModal(member.id, "child")}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 bg-muted hover:bg-border rounded-xl transition-colors border border-border">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">Add Child</span>
                </button>
                <button onClick={() => openModal(member.id, "sibling")}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 bg-muted hover:bg-border rounded-xl transition-colors border border-border">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">Add Sibling</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
