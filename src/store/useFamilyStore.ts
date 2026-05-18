import { create } from 'zustand';
import type { MemberNodeData } from '@/types';

interface FamilyStoreState {
  isOpen: boolean;
  relativeToId: string | null;
  relationType: "child" | "parent" | "spouse" | "sibling" | null;
  editMemberData: MemberNodeData | null;
  openModal: (relativeToId?: string | null, relationType?: "child" | "parent" | "spouse" | "sibling" | null, editData?: MemberNodeData | null) => void;
  closeModal: () => void;
  triggerRefresh: number;
  refreshTree: () => void;
}

export const useFamilyStore = create<FamilyStoreState>((set) => ({
  isOpen: false,
  relativeToId: null,
  relationType: null,
  editMemberData: null,
  openModal: (relativeToId = null, relationType = null, editData = null) => 
    set({ isOpen: true, relativeToId, relationType, editMemberData: editData }),
  closeModal: () => 
    set({ isOpen: false, relativeToId: null, relationType: null, editMemberData: null }),
  triggerRefresh: 0,
  refreshTree: () => set((state) => ({ triggerRefresh: state.triggerRefresh + 1 })),
}));
