"use client";

import Link from "next/link";
import { Users, Heart, Image as ImageIcon, Lock, TreePine } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";

export default function Home() {
  const [stats, setStats] = useState({ members: 0, memories: 0, generations: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [membersRes, memoriesRes] = await Promise.all([
          supabase.from("family_members").select("id, father_id, mother_id", { count: "exact" }),
          supabase.from("family_memories").select("id", { count: "exact" }),
        ]);
        const memberCount = membersRes.count || 0;
        const memoryCount = memoriesRes.count || 0;
        let gens = 0;
        if (membersRes.data && membersRes.data.length > 0) {
          const members = membersRes.data;
          const roots = members.filter(m => !m.father_id && !m.mother_id);
          if (roots.length > 0) {
            const childrenMap: Record<string, string[]> = {};
            for (const m of members) {
              if (m.father_id) { if (!childrenMap[m.father_id]) childrenMap[m.father_id] = []; childrenMap[m.father_id].push(m.id); }
              if (m.mother_id) { if (!childrenMap[m.mother_id]) childrenMap[m.mother_id] = []; childrenMap[m.mother_id].push(m.id); }
            }
            let queue = roots.map(r => ({ id: r.id, depth: 1 }));
            const visited = new Set<string>();
            let maxDepth = 1;
            while (queue.length > 0) {
              const next: typeof queue = [];
              for (const node of queue) {
                if (visited.has(node.id)) continue;
                visited.add(node.id);
                if (node.depth > maxDepth) maxDepth = node.depth;
                for (const childId of (childrenMap[node.id] || [])) {
                  if (!visited.has(childId)) next.push({ id: childId, depth: node.depth + 1 });
                }
              }
              queue = next;
            }
            gens = maxDepth;
          } else { gens = 1; }
        }
        setStats({ members: memberCount, memories: memoryCount, generations: gens });
      } catch (err) { console.error("Error fetching stats:", err); }
    }
    fetchStats();
  }, []);

  const handleLock = () => { localStorage.removeItem("family_auth"); window.location.reload(); };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="font-heading font-semibold text-2xl text-primary flex items-center gap-2">
          <TreePine className="w-6 h-6" /> Trehan Family
        </div>
        <nav className="flex items-center gap-4 text-muted-foreground font-medium">
          <Link href="/tree" className="hover:text-primary transition-colors hidden sm:block">Family Tree</Link>
          <Link href="/memories" className="hover:text-primary transition-colors hidden sm:block">Memories</Link>
          <button onClick={handleLock} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground" title="Lock app">
            <Lock className="w-5 h-5" />
          </button>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/30 rounded-full blur-3xl -z-10" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl -z-10" />
        <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}
          className="inline-flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full text-primary border border-primary/20 mb-8 shadow-sm">
          <Heart className="w-4 h-4" /><span className="text-sm font-medium">Our Digital Home</span>
        </motion.div>
        <motion.h1 custom={1} initial="hidden" animate="visible" variants={fadeUp}
          className="text-5xl md:text-7xl font-heading font-semibold mb-6 max-w-4xl text-foreground leading-tight">
          Preserving Generations <br className="hidden md:block" /> Together
        </motion.h1>
        <motion.p custom={2} initial="hidden" animate="visible" variants={fadeUp}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 font-medium">
          Build the Trehan family tree, share precious memories, and stay connected across generations in a space that feels like home.
        </motion.p>
        {stats.members > 0 && (
          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp} className="flex items-center gap-6 mb-10 text-muted-foreground">
            <div className="flex flex-col items-center"><span className="text-3xl font-heading font-bold text-foreground">{stats.members}</span><span className="text-xs font-medium uppercase tracking-wider">Members</span></div>
            <div className="w-px h-10 bg-border" />
            <div className="flex flex-col items-center"><span className="text-3xl font-heading font-bold text-foreground">{stats.generations}</span><span className="text-xs font-medium uppercase tracking-wider">Generations</span></div>
            <div className="w-px h-10 bg-border" />
            <div className="flex flex-col items-center"><span className="text-3xl font-heading font-bold text-foreground">{stats.memories}</span><span className="text-xs font-medium uppercase tracking-wider">Memories</span></div>
          </motion.div>
        )}
        <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/tree" className="bg-primary hover:bg-[#8AA496] text-primary-foreground px-8 py-4 rounded-xl text-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"><Users className="w-5 h-5" /> Explore Family Tree</Link>
          <Link href="/memories" className="bg-card hover:bg-muted text-foreground px-8 py-4 rounded-xl text-lg font-medium transition-all shadow-sm border border-border flex items-center justify-center gap-2"><ImageIcon className="w-5 h-5" /> Family Memories</Link>
        </motion.div>
      </main>
      <footer className="py-8 text-center text-muted-foreground text-sm font-medium">Made with love for the Trehan Family</footer>
    </div>
  );
}
