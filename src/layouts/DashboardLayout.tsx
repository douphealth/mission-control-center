import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import StatusBar from "@/components/StatusBar";
import { useDashboard } from "@/contexts/DashboardContext";
import { motion, AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";

const DashboardHome = lazy(() => import("@/pages/DashboardHome"));
const TasksPage = lazy(() => import("@/pages/TasksPage"));
const WebsitesPage = lazy(() => import("@/pages/WebsitesPage"));
const GitHubPage = lazy(() => import("@/pages/GitHubPage"));
const BuildsPage = lazy(() => import("@/pages/BuildsPage"));
const LinksPage = lazy(() => import("@/pages/LinksPage"));
const NotesPage = lazy(() => import("@/pages/NotesPage"));
const FocusPage = lazy(() => import("@/pages/FocusPage"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const PlaceholderPage = lazy(() => import("@/pages/PlaceholderPage"));

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
  seo: PlaceholderPage,
  cloudflare: PlaceholderPage,
  vercel: PlaceholderPage,
  openclaw: PlaceholderPage,
};

export default function DashboardLayout() {
  const { activeSection } = useDashboard();
  const Section = sectionMap[activeSection] || DashboardHome;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-4 lg:p-6">
            <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded-xl w-48" /><div className="h-40 bg-muted rounded-2xl" /></div>}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                
                >
                  <Section sectionId={activeSection} key={activeSection} {...({sectionId: activeSection} as any)} />
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </div>
        </main>
        <StatusBar />
      </div>
    </div>
  );
}
