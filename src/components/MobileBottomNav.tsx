import { useDashboard } from '@/contexts/DashboardContext';
import { Home, CheckSquare, FileText, Globe, Grip, DollarSign, Calendar, Timer, Lightbulb, KeyRound, Settings, Search } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const primaryTabs = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'websites', label: 'Sites', icon: Globe },
  { id: 'more', label: 'More', icon: Grip },
];

const moreItems = [
  { id: 'calendar', label: 'Calendar', icon: Calendar, emoji: '📅' },
  { id: 'payments', label: 'Payments', icon: DollarSign, emoji: '💰' },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb, emoji: '💡' },
  { id: 'focus', label: 'Focus', icon: Timer, emoji: '⏱️' },
  { id: 'credentials', label: 'Vault', icon: KeyRound, emoji: '🔐' },
  { id: 'github', label: 'GitHub', icon: Search, emoji: '🐙' },
  { id: 'builds', label: 'Builds', icon: Search, emoji: '🛠️' },
  { id: 'links', label: 'Links', icon: Search, emoji: '🔗' },
  { id: 'projects', label: 'Kanban', icon: Search, emoji: '📋' },
  { id: 'habits', label: 'Habits', icon: Search, emoji: '🔥' },
  { id: 'seo', label: 'SEO', icon: Search, emoji: '🔍' },
  { id: 'settings', label: 'Settings', icon: Settings, emoji: '⚙️' },
];

export default function MobileBottomNav() {
  const { activeSection, setActiveSection, tasks } = useDashboard();
  const [moreOpen, setMoreOpen] = useState(false);

  const openTasks = tasks.filter(t => t.status !== 'done').length;

  const handleTab = (id: string) => {
    if (id === 'more') {
      setMoreOpen(!moreOpen);
    } else {
      setActiveSection(id);
      setMoreOpen(false);
    }
  };

  return (
    <>
      {/* More menu overlay */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-[72px] left-3 right-3 z-50 bg-card/95 backdrop-blur-2xl rounded-2xl border border-border/50 shadow-2xl p-3 lg:hidden"
            >
              <div className="grid grid-cols-4 gap-1">
                {moreItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleTab(item.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all active:scale-95
                      ${activeSection === item.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary active:bg-secondary'}`}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-[10px] font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="bg-card/90 backdrop-blur-2xl border-t border-border/40 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-around h-16">
            {primaryTabs.map(tab => {
              const isActive = tab.id === 'more' ? moreOpen : activeSection === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTab(tab.id)}
                  className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors active:scale-95
                    ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <div className="relative">
                    <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
                    {tab.id === 'tasks' && openTasks > 0 && (
                      <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                        {openTasks > 9 ? '9+' : openTasks}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold ${isActive ? 'text-primary' : ''}`}>{tab.label}</span>
                  {isActive && tab.id !== 'more' && (
                    <motion.div
                      layoutId="bottomTabIndicator"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
