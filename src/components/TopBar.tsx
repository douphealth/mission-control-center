import { useDashboard } from "@/contexts/DashboardContext";
import { Search, Bell, Plus, Menu } from "lucide-react";
import { useState, useEffect } from "react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "short", day: "numeric",
  });
}

function formatTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export default function TopBar() {
  const { userName, setSidebarOpen } = useDashboard();
  const [time, setTime] = useState(formatTime());

  useEffect(() => {
    const i = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-6 h-16 flex items-center gap-4">
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
        <Menu size={22} />
      </button>

      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold truncate">
          {getGreeting()}, {userName} 👋
        </h2>
        <div className="text-xs text-muted-foreground hidden sm:block">{formatDate()} · {time}</div>
      </div>

      <div className="hidden md:flex items-center bg-secondary rounded-xl px-3 py-2 gap-2 w-64 lg:w-80">
        <Search size={16} className="text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          placeholder="Search everything... (Ctrl+K)"
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
        />
      </div>

      <button className="relative text-muted-foreground hover:text-foreground transition-colors">
        <Bell size={20} />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">3</span>
      </button>

      <button className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity">
        <Plus size={18} />
      </button>
    </header>
  );
}
