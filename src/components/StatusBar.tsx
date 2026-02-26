export default function StatusBar() {
  return (
    <footer className="sticky bottom-0 z-20 bg-card/80 backdrop-blur-md border-t border-border px-4 lg:px-6 h-8 flex items-center justify-between text-[11px] text-muted-foreground">
      <div className="flex items-center gap-3">
        <span>🔒 Unlocked</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">Mission Control v3.0</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline">Last sync: just now</span>
        <span>Storage: ~{(JSON.stringify(localStorage).length / 1024).toFixed(1)}KB</span>
      </div>
    </footer>
  );
}
