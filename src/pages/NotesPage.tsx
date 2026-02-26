import { useDashboard } from "@/contexts/DashboardContext";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Pin, Trash2, Search } from "lucide-react";

const noteColors = ["blue", "amber", "green", "rose", "purple", "teal"];
const colorBorder: Record<string, string> = {
  blue: "border-l-blue-400",
  amber: "border-l-amber-400",
  green: "border-l-green-400",
  rose: "border-l-rose-400",
  purple: "border-l-purple-400",
  teal: "border-l-teal-400",
};

export default function NotesPage() {
  const { notes, updateData } = useDashboard();
  const [selectedId, setSelectedId] = useState<string | null>(notes[0]?.id ?? null);
  const [search, setSearch] = useState("");

  const selected = notes.find(n => n.id === selectedId);
  const filtered = notes
    .filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const updateNote = useCallback((field: string, value: string) => {
    updateData({
      notes: notes.map(n =>
        n.id === selectedId ? { ...n, [field]: value, updatedAt: new Date().toISOString().split("T")[0] } : n
      ),
    });
  }, [notes, selectedId, updateData]);

  const addNote = () => {
    const id = Math.random().toString(36).slice(2, 10);
    const now = new Date().toISOString().split("T")[0];
    updateData({
      notes: [{ id, title: "Untitled Note", content: "", color: "blue", pinned: false, tags: [], createdAt: now, updatedAt: now }, ...notes],
    });
    setSelectedId(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Notes</h1>
        <button onClick={addNote} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
          <Plus size={16} /> New Note
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: 500 }}>
        {/* List */}
        <div className="space-y-2">
          <div className="flex items-center bg-secondary rounded-xl px-3 py-1.5 gap-2">
            <Search size={14} className="text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" />
          </div>
          {filtered.map(note => (
            <button
              key={note.id}
              onClick={() => setSelectedId(note.id)}
              className={`w-full text-left card-elevated p-3 border-l-4 ${colorBorder[note.color] || "border-l-transparent"} ${selectedId === note.id ? "ring-1 ring-primary/30" : ""}`}
            >
              <div className="flex items-center gap-1">
                {note.pinned && <Pin size={10} className="text-warning" />}
                <span className="text-sm font-medium text-card-foreground truncate">{note.title}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{note.content.slice(0, 60)}</p>
              <span className="text-[10px] text-muted-foreground/60">{note.updatedAt}</span>
            </button>
          ))}
        </div>
        {/* Editor */}
        <div className="lg:col-span-2 card-elevated p-5 flex flex-col">
          {selected ? (
            <>
              <input
                value={selected.title}
                onChange={e => updateNote("title", e.target.value)}
                className="text-xl font-bold text-card-foreground bg-transparent outline-none mb-3"
              />
              <textarea
                value={selected.content}
                onChange={e => updateNote("content", e.target.value)}
                className="flex-1 bg-transparent text-sm text-card-foreground outline-none resize-none leading-relaxed"
                placeholder="Start writing..."
              />
              <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
                <span className="text-xs text-muted-foreground">{selected.content.split(/\s+/).filter(Boolean).length} words</span>
                <div className="flex gap-1">
                  {noteColors.map(c => (
                    <button key={c} onClick={() => updateNote("color", c)} className={`w-4 h-4 rounded-full border-2 ${selected.color === c ? "border-foreground" : "border-transparent"}`} style={{ background: c === "blue" ? "#60a5fa" : c === "amber" ? "#fbbf24" : c === "green" ? "#34d399" : c === "rose" ? "#fb7185" : c === "purple" ? "#a78bfa" : "#2dd4bf" }} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Select a note or create a new one</div>
          )}
        </div>
      </div>
    </div>
  );
}
