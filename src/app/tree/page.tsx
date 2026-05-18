"use client";

import { FamilyTreeCanvas } from "@/components/FamilyTreeCanvas";
import { AddMemberModal } from "@/components/AddMemberModal";
import { useFamilyStore } from "@/store/useFamilyStore";
import { ReactFlowProvider } from "@xyflow/react";
import Link from "next/link";
import { ArrowLeft, Plus, Lock } from "lucide-react";

export default function TreePage() {
  const { isOpen, closeModal, openModal, relativeToId, relationType, editMemberData, refreshTree } = useFamilyStore();

  const handleLock = () => { localStorage.removeItem("family_auth"); window.location.reload(); };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-card border-b border-border p-4 flex justify-between items-center z-10 shadow-sm relative">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-foreground" /></Link>
          <h1 className="font-heading text-lg sm:text-xl font-semibold text-foreground">Trehan Family Tree</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openModal()} className="bg-primary hover:bg-[#8AA496] text-primary-foreground px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Member</span>
          </button>
          <button onClick={handleLock} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground" title="Lock app"><Lock className="w-5 h-5" /></button>
        </div>
      </header>
      <main className="flex-1 relative w-full h-full overflow-hidden">
        <ReactFlowProvider><FamilyTreeCanvas /></ReactFlowProvider>
      </main>
      <AddMemberModal isOpen={isOpen} onClose={closeModal} onSuccess={refreshTree} relativeToId={relativeToId} relationType={relationType} editMemberData={editMemberData} />
    </div>
  );
}
