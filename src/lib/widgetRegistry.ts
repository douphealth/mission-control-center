// Widget Registry — config-driven, extensible widget system for Mission Control
// Each widget is a self-contained unit with metadata for rendering on the dashboard

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  icon: string; // emoji
  section: string; // which page section it links to
  visible: boolean;
  order: number;
  size: "sm" | "md" | "lg" | "full"; // grid sizing
}

const STORAGE_KEY = "mc-widget-config";

export const defaultWidgets: WidgetConfig[] = [
  { id: "stats", type: "stats", title: "Overview Stats", icon: "📊", section: "dashboard", visible: true, order: 0, size: "full" },
  { id: "tasks-focus", type: "tasks-focus", title: "Today's Focus", icon: "⚡", section: "tasks", visible: true, order: 1, size: "md" },
  { id: "deadlines", type: "deadlines", title: "Upcoming Deadlines", icon: "📅", section: "calendar", visible: true, order: 2, size: "md" },
  { id: "activity", type: "activity", title: "Recent Activity", icon: "🕐", section: "dashboard", visible: true, order: 3, size: "md" },
  { id: "quick-links", type: "quick-links", title: "Quick Access", icon: "🔗", section: "links", visible: true, order: 4, size: "md" },
  { id: "platforms", type: "platforms", title: "Platform Status", icon: "🖥️", section: "dashboard", visible: true, order: 5, size: "md" },
  { id: "finance", type: "finance", title: "Finance Summary", icon: "💰", section: "payments", visible: true, order: 6, size: "md" },
  { id: "ideas", type: "ideas", title: "Top Ideas", icon: "💡", section: "ideas", visible: true, order: 7, size: "sm" },
  { id: "quote", type: "quote", title: "Daily Quote", icon: "✨", section: "dashboard", visible: true, order: 8, size: "sm" },
  { id: "notes-preview", type: "notes-preview", title: "Pinned Notes", icon: "📝", section: "notes", visible: true, order: 9, size: "sm" },
];

export function loadWidgetConfig(): WidgetConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WidgetConfig[];
      // Merge with defaults to add new widgets
      const ids = new Set(parsed.map(w => w.id));
      const merged = [...parsed];
      for (const dw of defaultWidgets) {
        if (!ids.has(dw.id)) merged.push(dw);
      }
      return merged.sort((a, b) => a.order - b.order);
    }
  } catch {}
  return [...defaultWidgets];
}

export function saveWidgetConfig(widgets: WidgetConfig[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  } catch {}
}

export function toggleWidget(widgets: WidgetConfig[], id: string): WidgetConfig[] {
  return widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
}

export function reorderWidgets(widgets: WidgetConfig[], fromIndex: number, toIndex: number): WidgetConfig[] {
  const result = [...widgets];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result.map((w, i) => ({ ...w, order: i }));
}
