import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { tasks } = useDashboard();
  const [current, setCurrent] = useState(new Date());

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const prev = () => setCurrent(new Date(year, month - 1, 1));
  const next = () => setCurrent(new Date(year, month + 1, 1));
  const goToday = () => setCurrent(new Date());

  const tasksByDate: Record<string, typeof tasks> = {};
  tasks.forEach(t => {
    if (!tasksByDate[t.dueDate]) tasksByDate[t.dueDate] = [];
    tasksByDate[t.dueDate].push(t);
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthName = current.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Calendar</h1>

      <div className="card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><ChevronLeft size={18} className="text-muted-foreground" /></button>
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-card-foreground">{monthName}</h2>
            <button onClick={goToday} className="text-xs text-primary hover:underline">Today</button>
          </div>
          <button onClick={next} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><ChevronRight size={18} className="text-muted-foreground" /></button>
        </div>

        <div className="grid grid-cols-7 gap-px">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayTasks = tasksByDate[dateStr] || [];
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            return (
              <div key={dateStr} className={`min-h-[80px] p-1.5 rounded-xl border border-transparent hover:border-border transition-colors ${isToday ? "bg-primary/5 ring-1 ring-primary/30" : ""}`}>
                <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-card-foreground"}`}>{day}</span>
                <div className="mt-1 space-y-0.5">
                  {dayTasks.slice(0, 2).map(t => (
                    <div key={t.id} className={`text-[9px] px-1 py-0.5 rounded truncate ${t.priority === "critical" ? "bg-destructive/10 text-destructive" : t.priority === "high" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && <div className="text-[9px] text-muted-foreground">+{dayTasks.length - 2} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="card-elevated p-5">
        <h3 className="font-semibold text-card-foreground mb-3">Upcoming Deadlines</h3>
        <div className="space-y-2">
          {tasks
            .filter(t => t.status !== "done" && t.dueDate >= new Date().toISOString().split("T")[0])
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            .slice(0, 7)
            .map(t => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${t.priority === "critical" ? "bg-destructive" : t.priority === "high" ? "bg-warning" : "bg-primary"}`} />
                <span className="text-card-foreground flex-1 truncate">{t.title}</span>
                <span className="text-xs text-muted-foreground">{t.dueDate}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
