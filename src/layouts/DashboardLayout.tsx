import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import StatusBar from '@/components/StatusBar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDashboard } from '@/contexts/DashboardContext';
import { motion, AnimatePresence } from 'framer-motion';
import React, { lazy, Suspense } from 'react';

const DashboardHome = lazy(() => import('@/pages/DashboardHome'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const WebsitesPage = lazy(() => import('@/pages/WebsitesPage'));
const GitHubPage = lazy(() => import('@/pages/GitHubPage'));
const BuildsPage = lazy(() => import('@/pages/BuildsPage'));
const LinksPage = lazy(() => import('@/pages/LinksPage'));
const NotesPage = lazy(() => import('@/pages/NotesPage'));
const FocusPage = lazy(() => import('@/pages/FocusPage'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const PaymentsPage = lazy(() => import('@/pages/PaymentsPage'));
const IdeasPage = lazy(() => import('@/pages/IdeasPage'));
const CredentialsPage = lazy(() => import('@/pages/CredentialsPage'));
const SEOPage = lazy(() => import('@/pages/SEOPage'));
const CloudflarePage = lazy(() => import('@/pages/CloudflarePage'));
const VercelPage = lazy(() => import('@/pages/VercelPage'));
const OpenClawPage = lazy(() => import('@/pages/OpenClawPage'));
const HabitsPage = lazy(() => import('@/pages/HabitsPage'));

const sectionMap: Record<string, React.LazyExoticComponent<any>> = {
  dashboard: DashboardHome,
  tasks: TasksPage,
  websites: WebsitesPage,
  github: GitHubPage,
  builds: BuildsPage,
  links: LinksPage,
  notes: NotesPage,
  focus: FocusPage,
  calendar: CalendarPage,
  projects: ProjectsPage,
  settings: SettingsPage,
  payments: PaymentsPage,
  ideas: IdeasPage,
  credentials: CredentialsPage,
  seo: SEOPage,
  cloudflare: CloudflarePage,
  vercel: VercelPage,
  openclaw: OpenClawPage,
  habits: HabitsPage,
};

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-2">
      <div className="h-8 bg-muted/50 rounded-xl w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted/30 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 bg-muted/30 rounded-2xl" />
        <div className="h-64 bg-muted/30 rounded-2xl" />
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const { activeSection, isLoading } = useDashboard();
  const Section = sectionMap[activeSection] || DashboardHome;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div className="text-sm text-muted-foreground">Loading Mission Control...</div>
        </div>
      </div>
    );
  }

  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Hide sidebar on mobile — use bottom nav instead */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="max-w-[1600px] mx-auto p-3 sm:p-4 lg:p-6">
            <Suspense fallback={<LoadingSkeleton />}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Section sectionId={activeSection} key={activeSection} {...({ sectionId: activeSection } as any)} />
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </div>
        </main>
        {!isMobile && <StatusBar />}
      </div>
      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
