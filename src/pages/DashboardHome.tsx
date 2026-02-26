import { useDashboard } from '@/contexts/DashboardContext';
import { useState, useCallback, useMemo } from 'react';
// react-grid-layout v1 — import via default to avoid Vite named-export issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
import * as RGL from 'react-grid-layout';
// @ts-ignore
const Responsive = RGL.Responsive || RGL.default?.Responsive;
// @ts-ignore
const WidthProvider = RGL.WidthProvider || RGL.default?.WidthProvider;

import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Github, Hammer, CheckSquare, TrendingUp, TrendingDown,
  Clock, ArrowRight, Zap, Calendar, FileText, Target, Sparkles, Settings2,
  DollarSign, Lightbulb, Eye, EyeOff, ArrowUpRight, ArrowDownRight,
  Pin, Lock, Unlock, ExternalLink, Activity, GripVertical, Flame
} from 'lucide-react';
import {
  widgetDefinitions,
  getDefaultLayouts,
  loadSavedLayout,
  saveLayout,
  loadWidgetVisibility,
  saveWidgetVisibility,
} from '@/lib/widgetRegistry';
import 'react-grid-layout/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay: i * 0.03 },
});

export default function DashboardHome() {
  const {
    websites, repos, buildProjects, tasks, links, notes, payments, ideas, habits,
    setActiveSection,
  } = useDashboard();

  const [layouts, setLayouts] = useState(() => loadSavedLayout() || { lg: getDefaultLayouts(12), md: getDefaultLayouts(10), sm: getDefaultLayouts(6), xs: getDefaultLayouts(4) });
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() => loadWidgetVisibility());
  const [configOpen, setConfigOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);

  const handleLayoutChange = useCallback((_current: any, allLayouts: any) => {
    setLayouts(allLayouts);
    saveLayout(allLayouts);
  }, []);

  const toggleWidgetVisibility = (id: string) => {
    const next = { ...visibility, [id]: !visibility[id] };
    setVisibility(next);
    saveWidgetVisibility(next);
  };

  // ─── Data Computations ────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const activeSites = websites.filter(w => w.status === 'active').length;
  const openTasks = tasks.filter(t => t.status !== 'done').length;
  const dueToday = tasks.filter(t => t.dueDate === today && t.status !== 'done').length;
  const activeBuilds = buildProjects.filter(b => b.status !== 'deployed').length;
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.dueDate < today).length;
  const completedToday = tasks.filter(t => t.completedAt === today).length;
  const totalIncome = payments.filter(p => p.type === 'income' && p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalExpenses = payments.filter(p => (p.type === 'expense' || p.type === 'subscription') && p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const stats = [
    { label: 'Websites', value: websites.length, sub: `${activeSites} active`, icon: Globe, trend: `+${activeSites}`, up: true, gradient: 'from-blue-500/20 to-blue-600/5', iconColor: 'text-blue-500', section: 'websites' },
    { label: 'GitHub Repos', value: repos.length, sub: `${repos.filter(r => r.status === 'active').length} active`, icon: Github, trend: '+5', up: true, gradient: 'from-purple-500/20 to-purple-600/5', iconColor: 'text-purple-500', section: 'github' },
    { label: 'Build Projects', value: buildProjects.length, sub: `${activeBuilds} in progress`, icon: Hammer, trend: `+${activeBuilds}`, up: true, gradient: 'from-amber-500/20 to-amber-600/5', iconColor: 'text-amber-500', section: 'builds' },
    { label: 'Open Tasks', value: openTasks, sub: dueToday > 0 ? `${dueToday} due today` : overdueTasks > 0 ? `${overdueTasks} overdue!` : 'All on track ✨', icon: CheckSquare, trend: dueToday > 0 ? String(dueToday) : '0', up: overdueTasks === 0, gradient: overdueTasks > 0 ? 'from-red-500/20 to-red-600/5' : 'from-emerald-500/20 to-emerald-600/5', iconColor: overdueTasks > 0 ? 'text-red-500' : 'text-emerald-500', section: 'tasks' },
  ];

  const todayTasks = tasks.filter(t => t.status !== 'done').sort((a, b) => {
    const p: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (p[a.priority] || 3) - (p[b.priority] || 3);
  }).slice(0, 6);

  const upcomingDeadlines = tasks.filter(t => t.status !== 'done' && t.dueDate >= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6);
  const pinnedNotes = notes.filter(n => n.pinned).slice(0, 3);
  const topIdeas = ideas.filter(i => i.status !== 'parked').sort((a, b) => b.votes - a.votes).slice(0, 4);
  const quickLinks = links.filter(l => l.pinned).slice(0, 6);
  const priorityColor: Record<string, string> = { critical: 'bg-red-500', high: 'bg-amber-500', medium: 'bg-blue-500', low: 'bg-emerald-500' };
  const priorityBg: Record<string, string> = { critical: 'bg-red-500/10 text-red-500', high: 'bg-amber-500/10 text-amber-500', medium: 'bg-blue-500/10 text-blue-500', low: 'bg-emerald-500/10 text-emerald-500' };

  const quotes = [
    { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
    { text: 'Ship fast, iterate faster.', author: 'Reid Hoffman' },
    { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
    { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
    { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
  ];
  const quote = quotes[new Date().getDate() % quotes.length];

  // ─── Widget Renderer ──────────────────────────────────────────────────
  const renderWidget = (widgetId: string, i: number) => {
    const widgetClass = 'h-full bg-card/80 backdrop-blur-xl rounded-2xl border border-border/40 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden';

    switch (widgetId) {
      case 'stats':
        return (
          <div className={`${widgetClass} p-0`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 h-full">
              {stats.map((s, si) => (
                <motion.div key={s.label} {...fadeUp(si)} className="p-5 cursor-pointer group hover:bg-primary/5 transition-all border-r border-border/30 last:border-r-0 flex flex-col" onClick={() => setActiveSection(s.section)}>
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                      <s.icon size={18} className={s.iconColor} />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold ${s.up ? 'text-emerald-500' : 'text-red-500'}`}>
                      {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {s.trend}
                    </div>
                  </div>
                  <div className="mt-auto pt-3">
                    <div className="text-3xl font-extrabold text-card-foreground tracking-tight">{s.value}</div>
                    <div className="text-sm font-medium text-muted-foreground">{s.label}</div>
                    <div className="text-xs text-muted-foreground/60 mt-0.5">{s.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'tasks-focus':
        return (
          <div className={`${widgetClass} p-5 flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Zap size={16} className="text-amber-500" />
                </div>
                <h3 className="font-bold text-card-foreground">Today's Focus</h3>
                {dueToday > 0 && <span className="text-[10px] font-bold bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full animate-pulse">{dueToday} due</span>}
              </div>
              <button onClick={() => setActiveSection('tasks')} className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">View All <ArrowRight size={12} /></button>
            </div>
            <div className="flex-1 overflow-auto space-y-1">
              {todayTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors group">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityColor[task.priority]} ring-2 ring-offset-2 ring-offset-card ${priorityColor[task.priority]}/30`} />
                  <span className="text-sm text-card-foreground flex-1 truncate">{task.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-semibold ${priorityBg[task.priority]}`}>{task.priority}</span>
                  <span className={`text-xs flex-shrink-0 ${task.dueDate < today ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>{task.dueDate}</span>
                </div>
              ))}
              {todayTasks.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">🎉 All caught up!</div>}
            </div>
          </div>
        );

      case 'deadlines':
        return (
          <div className={`${widgetClass} p-5 flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Calendar size={16} className="text-blue-500" />
                </div>
                <h3 className="font-bold text-card-foreground">Upcoming Deadlines</h3>
              </div>
              <button onClick={() => setActiveSection('calendar')} className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">Calendar <ArrowRight size={12} /></button>
            </div>
            <div className="flex-1 overflow-auto space-y-1">
              {upcomingDeadlines.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColor[task.priority]}`} />
                  <span className="text-sm text-card-foreground flex-1 truncate">{task.title}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">{task.dueDate}</span>
                </div>
              ))}
              {upcomingDeadlines.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">No upcoming deadlines 🌟</div>}
            </div>
          </div>
        );

      case 'finance':
        return (
          <div className={`${widgetClass} p-5 flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign size={16} className="text-emerald-500" />
                </div>
                <h3 className="font-bold text-card-foreground">Finance Summary</h3>
              </div>
              <button onClick={() => setActiveSection('payments')} className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">Details <ArrowRight size={12} /></button>
            </div>
            <div className="grid grid-cols-3 gap-3 flex-1">
              <div className="text-center p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center justify-center">
                <ArrowUpRight size={18} className="text-emerald-500 mb-1" />
                <div className="text-lg font-extrabold text-emerald-500">{fmt(totalIncome)}</div>
                <div className="text-[10px] text-muted-foreground font-medium">Income</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex flex-col items-center justify-center">
                <ArrowDownRight size={18} className="text-red-500 mb-1" />
                <div className="text-lg font-extrabold text-red-500">{fmt(totalExpenses)}</div>
                <div className="text-[10px] text-muted-foreground font-medium">Expenses</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex flex-col items-center justify-center">
                <Clock size={18} className="text-amber-500 mb-1" />
                <div className="text-lg font-extrabold text-amber-500">{fmt(pendingAmount)}</div>
                <div className="text-[10px] text-muted-foreground font-medium">Pending</div>
              </div>
            </div>
            <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 text-center border border-border/30">
              <div className={`text-2xl font-extrabold ${totalIncome - totalExpenses >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmt(totalIncome - totalExpenses)}</div>
              <div className="text-[10px] text-muted-foreground font-medium">Net Profit</div>
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className={`${widgetClass} p-5 flex flex-col`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Activity size={16} className="text-purple-500" />
              </div>
              <h3 className="font-bold text-card-foreground">Recent Activity</h3>
            </div>
            <div className="flex-1 overflow-auto space-y-0.5">
              {[
                { text: 'Deployed SaaS Landing Page to Vercel', time: '2h ago', icon: '🚀' },
                { text: 'Completed SSL certificate renewal', time: '5h ago', icon: '✅' },
                { text: 'Pushed 3 commits to ai-mission-control', time: '8h ago', icon: '🐙' },
                { text: 'Added new blog post draft', time: '1d ago', icon: '📝' },
                { text: 'Updated WooCommerce to v9.2', time: '1d ago', icon: '🔌' },
                { text: 'Fixed responsive layout on agency site', time: '2d ago', icon: '🔧' },
              ].map((a, ai) => (
                <div key={ai} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/30 transition-colors">
                  <span className="text-base flex-shrink-0">{a.icon}</span>
                  <span className="text-sm text-card-foreground flex-1 truncate">{a.text}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'quick-links':
        return (
          <div className={`${widgetClass} p-5 flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-card-foreground">Quick Access</h3>
              <button onClick={() => setActiveSection('links')} className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">All Links <ArrowRight size={12} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 flex-1 content-start">
              {quickLinks.map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-all group hover:scale-[1.02] border border-transparent hover:border-primary/10">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">{link.title.charAt(0)}</div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-card-foreground truncate block">{link.title}</span>
                    <span className="text-[10px] text-muted-foreground truncate block">{link.category}</span>
                  </div>
                </a>
              ))}
              {quickLinks.length === 0 && (
                <div className="col-span-2 text-center py-6 text-muted-foreground text-sm">
                  <button onClick={() => setActiveSection('links')} className="text-primary hover:underline">Pin some links to see them here</button>
                </div>
              )}
            </div>
          </div>
        );

      case 'platforms':
        return (
          <div className={`${widgetClass} p-5 flex flex-col`}>
            <h3 className="font-bold text-card-foreground mb-4">Platform Status</h3>
            <div className="grid grid-cols-2 gap-2.5 flex-1 content-start">
              {[
                { name: 'Cloudflare', section: 'cloudflare', status: 'Operational', ok: true, icon: '☁️' },
                { name: 'Vercel', section: 'vercel', status: 'Operational', ok: true, icon: '🚀' },
                { name: 'Google SC', section: 'seo', status: '2 warnings', ok: false, icon: '🔍' },
                { name: 'OpenClaw', section: 'openclaw', status: 'Operational', ok: true, icon: '🐙' },
              ].map(p => (
                <button key={p.name} onClick={() => setActiveSection(p.section)} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-all hover:scale-[1.02] border border-transparent hover:border-primary/10">
                  <span className="text-xl">{p.icon}</span>
                  <div className="text-left min-w-0">
                    <div className="text-xs font-semibold text-card-foreground">{p.name}</div>
                    <div className={`text-[11px] font-medium ${p.ok ? 'text-emerald-500' : 'text-amber-500'}`}>{p.ok ? '🟢' : '🟡'} {p.status}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'ideas':
        return (
          <div className={`${widgetClass} p-5 flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Lightbulb size={16} className="text-amber-500" />
                </div>
                <h3 className="font-bold text-card-foreground">Top Ideas</h3>
              </div>
              <button onClick={() => setActiveSection('ideas')} className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">View All <ArrowRight size={12} /></button>
            </div>
            <div className="flex-1 overflow-auto space-y-2">
              {topIdeas.map(idea => (
                <div key={idea.id} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{idea.votes}↑</span>
                  <span className="text-sm text-card-foreground flex-1 truncate">{idea.title}</span>
                  <span className="badge-muted text-[10px]">{idea.status}</span>
                </div>
              ))}
              {topIdeas.length === 0 && <div className="text-center py-4 text-muted-foreground text-sm">No active ideas</div>}
            </div>
          </div>
        );

      case 'notes-preview':
        return (
          <div className={`${widgetClass} p-5 flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Pin size={16} className="text-blue-500" />
                </div>
                <h3 className="font-bold text-card-foreground">Pinned Notes</h3>
              </div>
              <button onClick={() => setActiveSection('notes')} className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">All Notes <ArrowRight size={12} /></button>
            </div>
            <div className="flex-1 overflow-auto space-y-2">
              {pinnedNotes.map(note => (
                <button key={note.id} onClick={() => setActiveSection('notes')} className="w-full text-left p-3 rounded-xl hover:bg-secondary/50 transition-colors border border-border/20">
                  <div className="text-sm font-semibold text-card-foreground truncate">{note.title}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{note.content.slice(0, 60)}...</div>
                </button>
              ))}
              {pinnedNotes.length === 0 && <div className="text-center py-4 text-muted-foreground text-sm">No pinned notes</div>}
            </div>
          </div>
        );

      case 'quote':
        return (
          <div className={`${widgetClass} p-6 flex flex-col justify-center bg-gradient-to-br from-primary/5 via-transparent to-accent/5`}>
            <Sparkles size={20} className="text-primary/40 mb-3" />
            <div className="text-lg font-semibold text-card-foreground italic leading-relaxed">"{quote.text}"</div>
            <div className="text-sm text-muted-foreground mt-3 font-medium">— {quote.author}</div>
          </div>
        );

      case 'habits':
        return (
          <div className={`${widgetClass} p-5 flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Flame size={16} className="text-orange-500" />
                </div>
                <h3 className="font-bold text-card-foreground">Habit Tracker</h3>
              </div>
            </div>
            <div className="flex-1 overflow-auto space-y-2">
              {habits.length > 0 ? habits.slice(0, 5).map(h => (
                <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <span className="text-lg">{h.icon}</span>
                  <span className="text-sm text-card-foreground flex-1 truncate">{h.name}</span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-orange-500">
                    <Flame size={12} /> {h.streak}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <p>No habits tracked yet</p>
                  <p className="text-xs mt-1">Add habits in Settings</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'websites-summary':
        return (
          <div className={`${widgetClass} p-5 flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Globe size={16} className="text-blue-500" />
                </div>
                <h3 className="font-bold text-card-foreground">Websites</h3>
              </div>
              <button onClick={() => setActiveSection('websites')} className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">Manage <ArrowRight size={12} /></button>
            </div>
            <div className="flex-1 overflow-auto space-y-1.5">
              {websites.slice(0, 5).map(w => (
                <div key={w.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/50 transition-colors group">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${w.status === 'active' ? 'bg-emerald-500' : w.status === 'maintenance' ? 'bg-amber-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-card-foreground flex-1 truncate font-medium">{w.name}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{w.category}</span>
                  <a href={w.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <ExternalLink size={12} className="text-primary" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div className={`${widgetClass} p-5 flex items-center justify-center text-muted-foreground text-sm`}>Widget: {widgetId}</div>;
    }
  };

  const visibleWidgets = widgetDefinitions.filter(w => visibility[w.id] !== false);

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <motion.div {...fadeUp(0)} className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
            <Target size={12} /> {completedToday} done today
          </div>
          {overdueTasks > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 text-xs font-semibold animate-pulse">
              ⚠️ {overdueTasks} overdue
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-500 text-xs font-semibold">
            <FileText size={12} /> {notes.length} notes
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-500 text-xs font-semibold">
            <Sparkles size={12} /> {links.length} links
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all ${isLocked ? 'text-muted-foreground hover:text-foreground hover:bg-secondary' : 'text-primary bg-primary/10'}`}
            title={isLocked ? 'Unlock grid to rearrange widgets' : 'Lock grid'}
          >
            {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
            {isLocked ? 'Locked' : 'Editing'}
          </button>
          <button onClick={() => setConfigOpen(!configOpen)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl hover:bg-secondary font-medium">
            <Settings2 size={14} /> Widgets
          </button>
        </div>
      </motion.div>

      {/* Widget Configurator */}
      <AnimatePresence>
        {configOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/40 p-4 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-card-foreground">Dashboard Widgets</h3>
                <span className="text-[10px] text-muted-foreground font-medium">{visibleWidgets.length}/{widgetDefinitions.length} visible</span>
              </div>
              {['overview', 'productivity', 'business', 'platforms'].map(cat => (
                <div key={cat}>
                  <div className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-2">{cat}</div>
                  <div className="flex flex-wrap gap-2">
                    {widgetDefinitions.filter(w => w.category === cat).map(w => (
                      <button key={w.id} onClick={() => toggleWidgetVisibility(w.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${visibility[w.id] !== false ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-secondary/50 text-muted-foreground'}`}
                      >
                        {visibility[w.id] !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>{w.icon}</span>
                        <span className="truncate">{w.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag-and-Drop Grid */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
        rowHeight={50}
        isDraggable={!isLocked}
        isResizable={!isLocked}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms
      >
        {visibleWidgets.map((widget, i) => (
          <div key={widget.id} className="relative group">
            {!isLocked && (
              <div className="drag-handle absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 rounded-lg bg-card/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-border/30">
                <GripVertical size={14} className="text-muted-foreground" />
              </div>
            )}
            {renderWidget(widget.id, i)}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
