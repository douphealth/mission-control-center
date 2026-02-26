import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loadData, saveData, type Website, type Task, type GitHubRepo, type BuildProject, type LinkItem, type Note, type Payment, type Idea, type CredentialVault } from "@/lib/store";

interface DashboardState {
  userName: string;
  userRole: string;
  websites: Website[];
  tasks: Task[];
  repos: GitHubRepo[];
  buildProjects: BuildProject[];
  links: LinkItem[];
  notes: Note[];
  payments: Payment[];
  ideas: Idea[];
  credentials: CredentialVault[];
  activeSection: string;
  sidebarOpen: boolean;
  theme: "light" | "dark";
}

interface DashboardContextValue extends DashboardState {
  setActiveSection: (s: string) => void;
  setSidebarOpen: (b: boolean) => void;
  toggleTheme: () => void;
  updateData: (partial: Partial<DashboardState>) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DashboardState>(() => {
    const data = loadData();
    const theme = (localStorage.getItem("mc-theme") as "light" | "dark") || "light";
    return { ...data, activeSection: "dashboard", sidebarOpen: true, theme };
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.theme === "dark");
    localStorage.setItem("mc-theme", state.theme);
  }, [state.theme]);

  const persist = useCallback((s: DashboardState) => {
    const { activeSection, sidebarOpen, theme, ...data } = s;
    saveData(data as any);
  }, []);

  const updateData = useCallback((partial: Partial<DashboardState>) => {
    setState(prev => {
      const next = { ...prev, ...partial };
      persist(next);
      return next;
    });
  }, [persist]);

  const value: DashboardContextValue = {
    ...state,
    setActiveSection: (s) => setState(p => ({ ...p, activeSection: s })),
    setSidebarOpen: (b) => setState(p => ({ ...p, sidebarOpen: b })),
    toggleTheme: () => setState(p => ({ ...p, theme: p.theme === "light" ? "dark" : "light" })),
    updateData,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
