"use client";

import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow, MiniMap, Controls, Background,
  useNodesState, useEdgesState, BackgroundVariant,
  NodeMouseHandler, Node, Edge, Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FamilyNode } from './FamilyNode';
import { NodeDetailsDrawer } from './NodeDetailsDrawer';
import { SearchBar } from './SearchBar';
import { useFamilyStore } from '@/store/useFamilyStore';
import { supabase } from '@/utils/supabase/client';
import dagre from 'dagre';
import { Loader2 } from 'lucide-react';
import type { FamilyMember, MemberNodeData } from '@/types';

const nodeTypes = { familyNode: FamilyNode };

function capitalizeWords(s: string): string {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100 });
  nodes.forEach((node) => dagreGraph.setNode(node.id, { width: 220, height: 80 }));
  edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
  dagre.layout(dagreGraph);
  nodes.forEach((node) => {
    const np = dagreGraph.node(node.id);
    const isH = direction === 'LR';
    node.targetPosition = isH ? Position.Left : Position.Top;
    node.sourcePosition = isH ? Position.Right : Position.Bottom;
    node.position = { x: np.x - 110, y: np.y - 40 };
  });
  return { nodes, edges };
};

export function FamilyTreeCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedMember, setSelectedMember] = useState<MemberNodeData | null>(null);
  const [allMembers, setAllMembers] = useState<FamilyMember[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const triggerRefresh = useFamilyStore((state) => state.triggerRefresh);

  const fetchFamilyData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: members, error } = await supabase.from('family_members').select('*');
      if (error) throw error;
      setAllMembers((members as FamilyMember[]) || []);

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      members?.forEach((member: FamilyMember) => {
        let fatherId = member.father_id;
        let motherId = member.mother_id;

        // Auto-infer missing parent from spouse if available
        if (fatherId && !motherId) {
          const father = members.find(m => m.id === fatherId);
          if (father?.spouse_id) {
            const spouse = members.find(m => m.id === father.spouse_id);
            if (spouse && spouse.gender === 'female') motherId = spouse.id;
          }
        } else if (motherId && !fatherId) {
          const mother = members.find(m => m.id === motherId);
          if (mother?.spouse_id) {
            const spouse = members.find(m => m.id === mother.spouse_id);
            if (spouse && spouse.gender === 'male') fatherId = spouse.id;
          }
        }

        newNodes.push({
          id: member.id,
          type: 'familyNode',
          position: { x: 0, y: 0 },
          data: {
            label: capitalizeWords(`${member.first_name} ${member.last_name}`),
            relation: member.relation_title || member.gender,
            photoUrl: member.photo_url,
            dob: member.birth_date,
            deathDate: member.death_date,
            marriageDate: member.marriage_date,
            city: member.city,
            bio: member.bio,
            gender: member.gender,
            fatherId: fatherId,
            motherId: motherId,
            spouseId: member.spouse_id,
          }
        });

        if (fatherId) {
          newEdges.push({
            id: `e-father-${fatherId}-${member.id}`,
            source: fatherId, target: member.id,
            animated: true,
            style: { stroke: '#9CB4A6', strokeWidth: 2 }
          });
        }
        if (motherId) {
          newEdges.push({
            id: `e-mother-${motherId}-${member.id}`,
            source: motherId, target: member.id,
            animated: true,
            style: { stroke: '#FFDAB9', strokeWidth: 2 }
          });
        }
        if (member.spouse_id) {
          const exists = newEdges.find(
            e => (e.source === member.id && e.target === member.spouse_id) ||
                 (e.source === member.spouse_id && e.target === member.id)
          );
          if (!exists) {
            newEdges.push({
              id: `e-spouse-${member.spouse_id}-${member.id}`,
              source: member.spouse_id, target: member.id,
              animated: false,
              label: '💍',
              labelStyle: { fontSize: 14 },
              labelBgStyle: { fill: '#FDF8F5', fillOpacity: 0.8 },
              labelBgPadding: [4, 4] as [number, number],
              labelBgBorderRadius: 4,
              style: { stroke: '#C3B1E1', strokeWidth: 2, strokeDasharray: '5, 5' }
            });
          }
        }
      });

      // ── Sibling edges ──
      // Detect siblings (share at least one parent) and draw a distinct link
      const siblingPairsAdded = new Set<string>();
      if (members && members.length > 1) {
        for (let i = 0; i < members.length; i++) {
          for (let j = i + 1; j < members.length; j++) {
            const a = members[i];
            const b = members[j];
            const sharesFather = a.father_id && b.father_id && a.father_id === b.father_id;
            const sharesMother = a.mother_id && b.mother_id && a.mother_id === b.mother_id;
            if (sharesFather || sharesMother) {
              const pairKey = [a.id, b.id].sort().join('-');
              if (!siblingPairsAdded.has(pairKey)) {
                siblingPairsAdded.add(pairKey);
                newEdges.push({
                  id: `e-sibling-${pairKey}`,
                  source: a.id,
                  target: b.id,
                  animated: false,
                  label: '👫',
                  labelStyle: { fontSize: 12 },
                  labelBgStyle: { fill: '#FDF8F5', fillOpacity: 0.8 },
                  labelBgPadding: [3, 3] as [number, number],
                  labelBgBorderRadius: 4,
                  style: { stroke: '#87CEEB', strokeWidth: 1.5, strokeDasharray: '4, 4' },
                });
              }
            }
          }
        }
      }

      if (newNodes.length > 0) {
        const { nodes: ln, edges: le } = getLayoutedElements(newNodes, newEdges);
        setNodes([...ln]);
        setEdges([...le]);
      } else {
        setNodes([]);
        setEdges([]);
      }
    } catch (err) {
      console.error("Error fetching family tree:", err);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    fetchFamilyData();
  }, [triggerRefresh, fetchFamilyData]);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedMember({
      id: node.id,
      name: node.data.label as string,
      relation: node.data.relation as string | undefined,
      photoUrl: node.data.photoUrl as string | undefined,
      dob: node.data.dob as string | undefined,
      deathDate: node.data.deathDate as string | undefined,
      marriageDate: node.data.marriageDate as string | undefined,
      city: node.data.city as string | undefined,
      bio: node.data.bio as string | undefined,
      gender: node.data.gender as string | undefined,
      fatherId: node.data.fatherId as string | undefined,
      motherId: node.data.motherId as string | undefined,
      spouseId: node.data.spouseId as string | undefined,
    });
    setIsDrawerOpen(true);
  }, []);

  return (
    <div className="w-full h-full min-h-[calc(100vh-100px)] bg-background relative flex items-center justify-center">
      {loading && nodes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 text-primary">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="font-medium">Loading Family Tree...</p>
        </div>
      ) : nodes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 text-muted-foreground text-center max-w-sm">
          <p className="font-medium text-lg">The tree is empty.</p>
          <p className="text-sm">Click &quot;Add Member&quot; at the top to start building your family tree.</p>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick} nodeTypes={nodeTypes}
          fitView minZoom={0.2} className="bg-background"
        >
          <Controls className="bg-card border-border fill-primary" />
          <MiniMap nodeColor="#9CB4A6" maskColor="rgba(253, 248, 245, 0.7)" className="bg-card border-border" />
          <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#DCDCDD" />
        </ReactFlow>
      )}
      <SearchBar nodes={nodes} />
      <NodeDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        member={selectedMember}
        allMembers={allMembers}
      />
    </div>
  );
}
