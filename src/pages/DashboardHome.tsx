import { useDashboard } from '@/contexts/DashboardContext';
import { useState, useCallback } from 'react';
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
  Pin, Lock, Unlock, ExternalLink, Activity, GripVertical, Flame,
  Plus, ChevronRight, MoreHorizontal, BarChart3
} from 'lucide-react';
import {
  widgetDefinitions, getDefaultLayouts, loadSavedLayout, saveLayout,
  loadWidgetVisibility, saveWidgetVisibility,
} from '@/lib/widgetRegistry';
import 'react-grid-layout/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

const priorityConfig: Record<string, { color: string; bg: string; ring: string; label: string }> = {
  critical: { color: 'text-rose-500', bg: 'bg-rose-500/10', ring: 'ring-rose-500/20', label: 'Critical' },
  high: { color: 'text-amber-500', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20', label: 'High' },
  medium: { color: 'text-blue-500', bg: 'bg-blue-500/10', ring: 'ring-blue-500/20', label: 'Medium' },
  low: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', label: 'Low' },
};

export default function DashboardHome() {
  const {
    websites, repos, buildProjects, tasks, links, notes, payments, ideas, habits,
    setActiveSection, userName,
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

  // ─── Data ─────────────────────────────────────────────────────────────
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
    { label: 'Websites', value: websites.length, sub: `${activeSites} active`, icon: Globe, color: 'from-blue-500 to-cyan-400', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500', section: 'websites' },
    { label: 'Repositories', value: repos.length, sub: `${repos.filter(r => r.status === 'active').length} active`, icon: Github, color: 'from-violet-500 to-purple-400', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-500', section: 'github' },
    { label: 'Projects', value: buildProjects.length, sub: `${activeBuilds} in progress`, icon: Hammer, color: 'from-amber-500 to-orange-400', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500', section: 'builds' },
    { label: 'Tasks', value: openTasks, sub: dueToday > 0 ? `${dueToday} due today` : overdueTasks > 0 ? `${overdueTasks} overdue` : 'All on track ✨', icon: CheckSquare, color: overdueTasks > 0 ? 'from-rose-500 to-red-400' : 'from-emerald-500 to-green-400', iconBg: overdueTasks > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10', iconColor: overdueTasks > 0 ? 'text-rose-500' : 'text-emerald-500', section: 'tasks' },
  ];

  const todayTasks = tasks.filter(t => t.status !== 'done').sort((a, b) => {
    const p: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (p[a.priority] || 3) - (p[b.priority] || 3);
  }).slice(0, 6);

  const upcomingDeadlines = tasks.filter(t => t.status !== 'done' && t.dueDate >= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6);
  const pinnedNotes = notes.filter(n => n.pinned).slice(0, 3);
  const topIdeas = ideas.filter(i => i.status !== 'parked').sort((a, b) => b.votes - a.votes).slice(0, 4);
  const quickLinks = links.filter(l => l.pinned).slice(0, 6);

  const quotes = [
    { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
    { text: 'Ship fast, iterate faster.', author: 'Reid Hoffman' },
    { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
    { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
    { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
  ];
  const quote = quotes[new Date().getDate() % quotes.length];

  const statusColors: Record<string, string> = { 'todo': 'bg-slate-400', 'in-progress': 'bg-blue-500', 'blocked': 'bg-red-500', 'done': 'bg-emerald-500' };

  // ─── Widget Header Component ──────────────────────────────────────────
  const WidgetHeader = ({ icon: Icon, iconBg, iconColor, title, action, actionLabel, actionSection }: any) => (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={17} className={iconColor} />
        </div>
        <h3 className="font-bold text-[15px] text-card-foreground tracking-tight">{title}</h3>
      </div>
      {actionSection && (
        <button onClick={() => setActiveSection(actionSection)} className="flex items-center gap-1 text-xs text-primary/80 hover:text-primary font-semibold transition-colors group">
          {actionLabel || 'View All'} <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );

  // ─── Widgets ──────────────────────────────────────────────────────────
  const widgetClass = 'h-full rounded-[20px] border border-border/30 overflow-hidden transition-all duration-300';
  const widgetBg = 'bg-card/70 backdrop-blur-2xl hover:bg-card/85';

  const renderWidget = (widgetId: string, i: number) => {
    switch (widgetId) {
      case 'stats':
        return (
          <div className={`${widgetClass} ${widgetBg} p-0`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 h-full divide-x divide-border/20">
              {stats.map((s, si) => (
                <motion.div key={s.label} {...fadeUp(si)}
                  className="p-5 cursor-pointer group hover:bg-primary/[0.03] transition-all relative" onClick={() => setActiveSection(s.section)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-2xl ${s.iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <s.icon size={19} className={s.iconColor} />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
                      <TrendingUp size={12} />
                    </div>
                  </div>
                  <div className="text-[32px] font-extrabold text-card-foreground tracking-tighter leading-none mb-1">{s.value}</div>
                  <div className="text-[13px] font-semibold text-muted-foreground/70">{s.label}</div>
                  <div className="text-[11px] text-muted-foreground/50 mt-0.5">{s.sub}</div>
                  {/* Bottom gradient accent */}
                  <div className={`absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r ${s.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'tasks-focus':
        return (
          <div className={`${widgetClass} ${widgetBg} p-5 flex flex-col`}>
            <WidgetHeader icon={Zap} iconBg="bg-amber-500/10" iconColor="text-amber-500" title="Today's Focus" actionSection="tasks" />
            {dueToday > 0 && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-rose-500/5 border border-rose-500/10">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-semibold text-rose-500">{dueToday} task{dueToday > 1 ? 's' : ''} due today</span>
              </div>
            )}
            <div className="flex-1 overflow-auto space-y-1.5">
              {todayTasks.map((task, ti) => {
                const pc = priorityConfig[task.priority] || priorityConfig.medium;
                return (
                  <motion.div key={task.id} {...fadeUp(ti)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-all group cursor-pointer">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColors[task.status] || 'bg-slate-400'}`} />
                    <span className="text-[13px] text-card-foreground flex-1 truncate font-medium">{task.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${pc.bg} ${pc.color}`}>{pc.label}</span>
                    <span className={`text-[11px] font-mono flex-shrink-0 ${task.dueDate < today ? 'text-rose-500 font-bold' : 'text-muted-foreground/60'}`}>{task.dueDate}</span>
                  </motion.div>
                );
              })}
              {todayTasks.length === 0 && (
                <div className="text-center py-10 text-muted-foreground/60">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="text-sm font-medium">All caught up!</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'deadlines':
        return (
          <div className={`${widgetClass} ${widgetBg} p-5 flex flex-col`}>
            <WidgetHeader icon={Calendar} iconBg="bg-blue-500/10" iconColor="text-blue-500" title="Upcoming" actionLabel="Calendar" actionSection="calendar" />
            <div className="flex-1 overflow-auto space-y-1.5">
              {upcomingDeadlines.map((task, ti) => {
                const pc = priorityConfig[task.priority] || priorityConfig.medium;
                const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86400000);
                return (
                  <motion.div key={task.id} {...fadeUp(ti)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-all">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[task.status] || 'bg-slate-400'}`} />
                    <span className="text-[13px] text-card-foreground flex-1 truncate font-medium">{task.title}</span>
                    <span className={`text-[11px] px-2 py-1 rounded-lg font-semibold ${daysLeft <= 1 ? 'bg-rose-500/10 text-rose-500' : daysLeft <= 3 ? 'bg-amber-500/10 text-amber-500' : 'bg-secondary text-muted-foreground'}`}>
                      {daysLeft <= 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d`}
                    </span>
                  </motion.div>
                );
              })}
              {upcomingDeadlines.length === 0 && <div className="text-center py-10 text-muted-foreground/60 text-sm font-medium">No upcoming deadlines 🌟</div>}
            </div>
          </div>
        );

      case 'finance':
        return (
          <div className={`${widgetClass} ${widgetBg} p-5 flex flex-col`}>
            <WidgetHeader icon={DollarSign} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" title="Finance" actionLabel="Details" actionSection="payments" />
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              {[
                { label: 'Income', value: totalIncome, icon: ArrowUpRight, color: 'text-emerald-500', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
                { label: 'Expenses', value: totalExpenses, icon: ArrowDownRight, color: 'text-rose-500', bg: 'bg-rose-500/5', border: 'border-rose-500/10' },
                { label: 'Pending', value: pendingAmount, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/10' },
              ].map(d => (
                <div key={d.label} className={`text-center p-3.5 rounded-2xl ${d.bg} border ${d.border} flex flex-col items-center justify-center`}>
                  <d.icon size={16} className={`${d.color} mb-1`} />
                  <div className={`text-lg font-extrabold ${d.color} tabular-nums`}>{fmt(d.value)}</div>
                  <div className="text-[10px] text-muted-foreground/70 font-semibold mt-0.5">{d.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-auto p-4 rounded-2xl bg-gradient-to-r from-primary/[0.04] to-accent/[0.03] text-center border border-border/20">
              <div className={`text-2xl font-extrabold tabular-nums ${totalIncome - totalExpenses >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{fmt(totalIncome - totalExpenses)}</div>
              <div className="text-[10px] text-muted-foreground/60 font-semibold">Net Profit</div>
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className={`${widgetClass} ${widgetBg} p-5 flex flex-col`}>
            <WidgetHeader icon={Activity} iconBg="bg-violet-500/10" iconColor="text-violet-500" title="Activity" />
            <div className="flex-1 overflow-auto space-y-0.5">
              {[
                { text: 'Deployed SaaS Landing Page', time: '2h ago', emoji: '🚀' },
                { text: 'Completed SSL renewal', time: '5h ago', emoji: '✅' },
                { text: '3 commits to ai-mission-control', time: '8h ago', emoji: '🐙' },
                { text: 'New blog post draft added', time: '1d ago', emoji: '📝' },
                { text: 'WooCommerce v9.2 update', time: '1d ago', emoji: '🔌' },
                { text: 'Fixed responsive layout', time: '2d ago', emoji: '🔧' },
              ].map((a, ai) => (
                <motion.div key={ai} {...fadeUp(ai)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/30 transition-all">
                  <span className="text-base flex-shrink-0">{a.emoji}</span>
                  <span className="text-[13px] text-card-foreground flex-1 truncate">{a.text}</span>
                  <span className="text-[11px] text-muted-foreground/50 flex-shrink-0 tabular-nums font-medium">{a.time}</span>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'quick-links':
        return (
          <div className={`${widgetClass} ${widgetBg} p-5 flex flex-col`}>
            <WidgetHeader icon={ExternalLink} iconBg="bg-primary/10" iconColor="text-primary" title="Quick Access" actionLabel="All Links" actionSection="links" />
            <div className="grid grid-cols-2 gap-2 flex-1 content-start">
              {quickLinks.map((link, li) => (
                <motion.a key={link.id} {...fadeUp(li)} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/50 transition-all group border border-transparent hover:border-primary/10 hover:scale-[1.01]">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-[13px] font-bold flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                    {link.title.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-card-foreground truncate block">{link.title}</span>
                    <span className="text-[10px] text-muted-foreground/50 truncate block">{link.category}</span>
                  </div>
                </motion.a>
              ))}
              {quickLinks.length === 0 && (
                <div className="col-span-2 text-center py-8 text-muted-foreground/50 text-sm">
                  <button onClick={() => setActiveSection('links')} className="text-primary hover:underline font-medium">Pin some links</button>
                </div>
              )}
            </div>
          </div>
        );

      case 'platforms':
        return (
          <div className={`${widgetClass} ${widgetBg} p-5 flex flex-col`}>
            <WidgetHeader icon={BarChart3} iconBg="bg-sky-500/10" iconColor="text-sky-500" title="Platforms" />
            <div className="grid grid-cols-2 gap-2 flex-1 content-start">
              {[
                { name: 'Cloudflare', section: 'cloudflare', ok: true, emoji: '☁️' },
                { name: 'Vercel', section: 'vercel', ok: true, emoji: '🚀' },
                { name: 'Google SC', section: 'seo', ok: false, emoji: '🔍' },
                { name: 'OpenClaw', section: 'openclaw', ok: true, emoji: '🐙' },
              ].map(p => (
                <button key={p.name} onClick={() => setActiveSection(p.section)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/50 transition-all hover:scale-[1.01] border border-transparent hover:border-primary/10">
                  <span className="text-xl">{p.emoji}</span>
                  <div className="text-left min-w-0">
                    <div className="text-xs font-semibold text-card-foreground">{p.name}</div>
                    <div className={`text-[10px] font-semibold flex items-center gap-1 ${p.ok ? 'text-emerald-500' : 'text-amber-500'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${p.ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {p.ok ? 'Operational' : 'Warning'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'ideas':
        return (
          <div className={`${widgetClass} ${widgetBg} p-5 flex flex-col`}>
            <WidgetHeader icon={Lightbulb} iconBg="bg-amber-500/10" iconColor="text-amber-500" title="Top Ideas" actionSection="ideas" />
            <div className="flex-1 overflow-auto space-y-1.5">
              {topIdeas.map((idea, ii) => (
                <motion.div key={idea.id} {...fadeUp(ii)} className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-secondary/40 transition-all">
                  <span className="text-xs font-extrabold text-primary bg-primary/10 px-2 py-1 rounded-lg tabular-nums">{idea.votes}↑</span>
                  <span className="text-[13px] text-card-foreground flex-1 truncate font-medium">{idea.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-secondary text-muted-foreground font-semibold">{idea.status}</span>
                </motion.div>
              ))}
              {topIdeas.length === 0 && <div className="text-center py-8 text-muted-foreground/50 text-sm">No active ideas</div>}
            </div>
          </div>
        );

      case 'notes-preview':
        return (
          <div className={`${widgetClass} ${widgetBg} p-5 flex flex-col`}>
            <WidgetHeader icon={Pin} iconBg="bg-blue-500/10" iconColor="text-blue-500" title="Pinned Notes" actionLabel="Notes" actionSection="notes" />
            <div className="flex-1 overflow-auto space-y-2">
              {pinnedNotes.map((note, ni) => (
                <motion.button key={note.id} {...fadeUp(ni)} onClick={() => setActiveSection('notes')}
                  className="w-full text-left p-3.5 rounded-xl hover:bg-secondary/40 transition-all border border-border/15 hover:border-primary/10">
                  <div className="text-[13px] font-semibold text-card-foreground truncate">{note.title}</div>
                  <div className="text-[11px] text-muted-foreground/60 truncate mt-1 leading-relaxed">{note.content.slice(0, 80)}...</div>
                </motion.button>
              ))}
              {pinnedNotes.length === 0 && <div className="text-center py-8 text-muted-foreground/50 text-sm">No pinned notes</div>}
            </div>
          </div>
        );

      case 'quote':
        return (
          <div className={`${widgetClass} ${widgetBg} p-6 flex flex-col justify-center bg-gradient-to-br from-primary/[0.04] via-transparent to-accent/[0.03]`}>
            <Sparkles size={18} className="text-primary/30 mb-3" />
            <div className="text-[15px] font-semibold text-card-foreground/90 italic leading-relaxed">"{quote.text}"</div>
            <div className="text-[12px] text-muted-foreground/50 mt-3 font-semibold">— {quote.author}</div>
          </div>
        );

      case 'habits':
        return (
          <div className={`${widgetClass} ${widgetBg} p-5 flex flex-col`}>
            <WidgetHeader icon={Flame} iconBg="bg-orange-500/10" iconColor="text-orange-500" title="Habits" actionSection="habits" />
            <div className="flex-1 overflow-auto space-y-1.5">
              {habits.length > 0 ? habits.slice(0, 5).map((h, hi) => (
                <motion.div key={h.id} {...fadeUp(hi)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-all">
                  <span className="text-lg">{h.icon}</span>
                  <span className="text-[13px] text-card-foreground flex-1 truncate font-medium">{h.name}</span>
                  <div className="flex items-center gap-1 text-xs font-bold text-orange-500">
                    <Flame size={12} /> {h.streak}
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-10 text-muted-foreground/50 text-sm">
                  <p className="font-medium">No habits yet</p>
                  <button onClick={() => setActiveSection('habits')} className="text-primary hover:underline text-xs mt-1">Start tracking</button>
                </div>
              )}
            </div>
          </div>
        );

      case 'websites-summary':
        return (
          <div className={`${widgetClass} ${widgetBg} p-5 flex flex-col`}>
            <WidgetHeader icon={Globe} iconBg="bg-blue-500/10" iconColor="text-blue-500" title="My Websites" actionLabel="Manage" actionSection="websites" />
            <div className="flex-1 overflow-auto space-y-1">
              {websites.slice(0, 5).map((w, wi) => (
                <motion.div key={w.id} {...fadeUp(wi)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/40 transition-all group">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${w.status === 'active' ? 'bg-emerald-500' : w.status === 'maintenance' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                  <span className="text-[13px] text-card-foreground flex-1 truncate font-medium">{w.name}</span>
                  <span className="text-[10px] text-muted-foreground/50 truncate max-w-[100px] font-medium">{w.category}</span>
                  <a href={w.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <ExternalLink size={13} className="text-primary" />
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        );

      default:
        return <div className={`${widgetClass} ${widgetBg} p-5 flex items-center justify-center text-muted-foreground/40 text-sm`}>Widget: {widgetId}</div>;
    }
  };

  const visibleWidgets = widgetDefinitions.filter(w => visibility[w.id] !== false);

  return (
    <div className="space-y-5">
      {/* Welcome + Controls */}
      <motion.div {...fadeUp(0)} className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/8 border border-emerald-500/10 text-emerald-500 text-xs font-bold tracking-tight">
            <Target size={13} /> {completedToday} done today
          </div>
          {overdueTasks > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/8 border border-rose-500/10 text-rose-500 text-xs font-bold animate-pulse tracking-tight">
              ⚠️ {overdueTasks} overdue
            </div>
          )}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/8 border border-blue-500/10 text-blue-500 text-xs font-bold tracking-tight">
            <FileText size={13} /> {notes.length} notes
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-500/8 border border-violet-500/10 text-violet-500 text-xs font-bold tracking-tight">
            <Sparkles size={13} /> {links.length} links
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsLocked(!isLocked)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all ${isLocked ? 'text-muted-foreground/50 hover:text-foreground hover:bg-secondary' : 'text-primary bg-primary/10 ring-1 ring-primary/15'}`}>
            {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
            {isLocked ? 'Locked' : 'Editing'}
          </button>
          <button onClick={() => setConfigOpen(!configOpen)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-foreground transition-colors px-3.5 py-2 rounded-xl hover:bg-secondary font-semibold">
            <Settings2 size={14} /> Widgets
          </button>
        </div>
      </motion.div>

      {/* Widget Configurator */}
      <AnimatePresence>
        {configOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className={`${widgetBg} rounded-[20px] border border-border/30 p-5 shadow-xl space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-card-foreground">Customize Dashboard</h3>
                <span className="text-[10px] text-muted-foreground/50 font-semibold">{visibleWidgets.length}/{widgetDefinitions.length} visible</span>
              </div>
              {['overview', 'productivity', 'business', 'platforms'].map(cat => (
                <div key={cat}>
                  <div className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[2px] mb-2">{cat}</div>
                  <div className="flex flex-wrap gap-2">
                    {widgetDefinitions.filter(w => w.category === cat).map(w => (
                      <button key={w.id} onClick={() => toggleWidgetVisibility(w.id)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${visibility[w.id] !== false ? 'bg-primary/10 text-primary ring-1 ring-primary/15' : 'bg-secondary/40 text-muted-foreground/50 hover:text-muted-foreground'}`}>
                        {visibility[w.id] !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>{w.icon}</span> {w.title}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
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
        margin={[14, 14]}
        containerPadding={[0, 0]}
        useCSSTransforms
      >
        {visibleWidgets.map((widget, i) => (
          <div key={widget.id} className="relative group">
            {!isLocked && (
              <div className="drag-handle absolute top-2.5 left-2.5 z-10 cursor-grab active:cursor-grabbing p-1.5 rounded-xl bg-card/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-border/20">
                <GripVertical size={13} className="text-muted-foreground/60" />
              </div>
            )}
            {renderWidget(widget.id, i)}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
