"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useReactFlow } from "@xyflow/react";

interface SearchBarProps {
  nodes: any[];
}

export function SearchBar({ nodes }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { setCenter } = useReactFlow();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) { setIsOpen(false); setNotFound(false); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setNotFound(false);

    const lowerQuery = query.toLowerCase();
    const foundNode = nodes.find(
      (n) =>
        n.data.label.toLowerCase().includes(lowerQuery) ||
        (n.data.city && n.data.city.toLowerCase().includes(lowerQuery)) ||
        (n.data.relation && n.data.relation.toLowerCase().includes(lowerQuery))
    );

    if (foundNode) {
      setCenter(foundNode.position.x + 110, foundNode.position.y + 40, { zoom: 1.2, duration: 800 });
      setIsOpen(false);
      setQuery("");
    } else {
      setNotFound(true);
    }
  };

  return (
    <div className="absolute bottom-6 left-16 md:top-4 md:bottom-auto md:left-4 z-10">
      {!isOpen ? (
        <button onClick={() => setIsOpen(true)}
          className="bg-card p-3 rounded-xl shadow-sm border border-border text-primary hover:bg-muted transition-colors flex items-center gap-2">
          <Search className="w-5 h-5" />
          <span className="font-medium text-sm pr-2">Search Tree</span>
        </button>
      ) : (
        <div>
          <form onSubmit={handleSearch}
            className="bg-card p-2 rounded-xl shadow-md border border-border flex items-center gap-2">
            <Search className="w-5 h-5 text-muted-foreground ml-2" />
            <input type="text" autoFocus value={query}
              onChange={(e) => { setQuery(e.target.value); setNotFound(false); }}
              placeholder="Search name, city..."
              className="bg-transparent border-none focus:outline-none w-48 px-2 py-1 text-foreground" />
            <button type="button" onClick={() => { setIsOpen(false); setNotFound(false); }}
              className="p-1 hover:bg-muted rounded-full text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </form>
          {notFound && (
            <div className="mt-2 bg-card px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground shadow-sm">
              No family member found matching &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
