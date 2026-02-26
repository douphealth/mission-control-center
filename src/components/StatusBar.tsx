import { useState, useEffect } from "react";

export default function StatusBar() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const storageKB = (JSON.stringify(localStorage).length / 1024).toFixed(1);

  return (
    <footer className="sticky bottom-0 z-20 bg-card/80 backdrop-blur-md border-t border-border px-4 lg:px-6 h-8 flex items-center justify-between text-[11px] text-muted-foreground">
      <div className="flex items-center gap-3">
        {online ? (
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success" /> Online</span>
        ) : (
          <span className="flex items-center gap-1 text-destructive"><span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" /> Offline</span>
        )}
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">Mission Control v6.0</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline">⌘K Search</span>
        <span>Storage: ~{storageKB}KB</span>
      </div>
    </footer>
  );
}
