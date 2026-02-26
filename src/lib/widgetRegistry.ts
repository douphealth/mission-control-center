// SOTA Widget Registry — config-driven, extensible, dynamic widget system
// Each widget is a self-contained, draggable, resizable unit

export interface WidgetDefinition {
  id: string;
  type: string;
  title: string;
  icon: string;
  category: 'overview' | 'productivity' | 'business' | 'platforms' | 'personal' | 'custom';
  defaultLayout: { w: number; h: number; minW?: number; minH?: number };
  description: string;
}

export const widgetDefinitions: WidgetDefinition[] = [
  // Overview
  { id: 'stats', type: 'stats', title: 'Overview Stats', icon: '📊', category: 'overview', defaultLayout: { w: 12, h: 3, minW: 6, minH: 2 }, description: 'Key metrics at a glance' },
  { id: 'activity', type: 'activity', title: 'Recent Activity', icon: '🕐', category: 'overview', defaultLayout: { w: 6, h: 5, minW: 4, minH: 3 }, description: 'Latest actions and events' },
  { id: 'quick-links', type: 'quick-links', title: 'Quick Access', icon: '🔗', category: 'overview', defaultLayout: { w: 6, h: 5, minW: 4, minH: 3 }, description: 'Pinned links for fast access' },
  { id: 'quote', type: 'quote', title: 'Daily Inspiration', icon: '✨', category: 'overview', defaultLayout: { w: 4, h: 3, minW: 3, minH: 2 }, description: 'Daily motivational quote' },

  // Productivity
  { id: 'tasks-focus', type: 'tasks-focus', title: "Today's Focus", icon: '⚡', category: 'productivity', defaultLayout: { w: 6, h: 6, minW: 4, minH: 4 }, description: 'Priority tasks for today' },
  { id: 'deadlines', type: 'deadlines', title: 'Upcoming Deadlines', icon: '📅', category: 'productivity', defaultLayout: { w: 6, h: 6, minW: 4, minH: 4 }, description: 'Approaching due dates' },
  { id: 'habits', type: 'habits', title: 'Habit Tracker', icon: '🎯', category: 'productivity', defaultLayout: { w: 6, h: 4, minW: 4, minH: 3 }, description: 'Track daily habits and streaks' },

  // Business
  { id: 'finance', type: 'finance', title: 'Finance Summary', icon: '💰', category: 'business', defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 }, description: 'Income, expenses, and profit' },
  { id: 'ideas', type: 'ideas', title: 'Top Ideas', icon: '💡', category: 'business', defaultLayout: { w: 6, h: 5, minW: 4, minH: 3 }, description: 'Most voted ideas' },
  { id: 'notes-preview', type: 'notes-preview', title: 'Pinned Notes', icon: '📝', category: 'business', defaultLayout: { w: 4, h: 4, minW: 3, minH: 3 }, description: 'Quick note access' },

  // Platforms
  { id: 'platforms', type: 'platforms', title: 'Platform Status', icon: '🖥️', category: 'platforms', defaultLayout: { w: 4, h: 4, minW: 3, minH: 3 }, description: 'Service status overview' },
  { id: 'websites-summary', type: 'websites-summary', title: 'Websites Overview', icon: '🌐', category: 'platforms', defaultLayout: { w: 8, h: 4, minW: 6, minH: 3 }, description: 'Website status and quick access' },
];

export function getDefaultLayouts(cols: number = 12): Array<{ i: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number }> {
  const layouts: Array<{ i: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number }> = [];
  let x = 0;
  let y = 0;

  for (const def of widgetDefinitions) {
    const w = Math.min(def.defaultLayout.w, cols);
    if (x + w > cols) {
      x = 0;
      y += 1;
    }
    layouts.push({
      i: def.id,
      x,
      y,
      w,
      h: def.defaultLayout.h,
      minW: def.defaultLayout.minW,
      minH: def.defaultLayout.minH,
    });
    x += w;
    if (x >= cols) {
      x = 0;
      y += 1;
    }
  }

  return layouts;
}

const LAYOUT_KEY = 'mc-grid-layout-v7';
const VISIBILITY_KEY = 'mc-widget-visibility-v7';

export function loadSavedLayout() {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (raw) return JSON.parse(raw);
  } catch { }
  return null;
}

export function saveLayout(layouts: any) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layouts));
  } catch { }
}

export function loadWidgetVisibility(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(VISIBILITY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { }
  // All visible by default
  const defaults: Record<string, boolean> = {};
  widgetDefinitions.forEach(w => { defaults[w.id] = true; });
  return defaults;
}

export function saveWidgetVisibility(visibility: Record<string, boolean>) {
  try {
    localStorage.setItem(VISIBILITY_KEY, JSON.stringify(visibility));
  } catch { }
}
