import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, AlertTriangle, CheckCircle2, ArrowRight, Download } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";

type ImportTarget = "websites" | "links" | "tasks" | "repos" | "buildProjects";

const targetLabels: Record<ImportTarget, { label: string; emoji: string; requiredFields: string[]; optionalFields: string[] }> = {
  websites: {
    label: "Websites",
    emoji: "🌐",
    requiredFields: ["name", "url"],
    optionalFields: ["wpAdminUrl", "wpUsername", "wpPassword", "hostingProvider", "hostingLoginUrl", "hostingUsername", "hostingPassword", "category", "status", "notes", "plugins"],
  },
  links: {
    label: "Links",
    emoji: "🔗",
    requiredFields: ["title", "url"],
    optionalFields: ["category", "description", "status", "pinned"],
  },
  tasks: {
    label: "Tasks",
    emoji: "✅",
    requiredFields: ["title"],
    optionalFields: ["priority", "status", "dueDate", "category", "description", "linkedProject"],
  },
  repos: {
    label: "GitHub Repos",
    emoji: "🐙",
    requiredFields: ["name"],
    optionalFields: ["url", "description", "language", "stars", "forks", "status", "demoUrl", "progress", "topics"],
  },
  buildProjects: {
    label: "Build Projects",
    emoji: "🛠️",
    requiredFields: ["name"],
    optionalFields: ["platform", "projectUrl", "deployedUrl", "description", "techStack", "status", "nextSteps", "githubRepo"],
  },
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
  return lines.slice(1).map(line => {
    const values = line.match(/("([^"]|"")*"|[^,]*)/g) || [];
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (values[i] || "").trim().replace(/^["']|["']$/g, "").replace(/""/g, '"');
    });
    return obj;
  });
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function BulkImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { websites, links, tasks, repos, buildProjects, updateData } = useDashboard();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [target, setTarget] = useState<ImportTarget>("websites");
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
  const [importCount, setImportCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep(1);
    setRawData([]);
    setFieldMap({});
    setImportCount(0);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          setRawData(arr.map(item => {
            const obj: Record<string, string> = {};
            Object.entries(item).forEach(([k, v]) => {
              obj[k] = Array.isArray(v) ? v.join(", ") : String(v ?? "");
            });
            return obj;
          }));
        } else {
          setRawData(parseCSV(text));
        }
        // Auto-map fields
        if (rawData.length === 0) {
          setTimeout(() => autoMap(), 100);
        }
        setStep(2);
      } catch {
        alert("Failed to parse file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  const autoMap = () => {
    if (rawData.length === 0) return;
    const sourceFields = Object.keys(rawData[0]);
    const info = targetLabels[target];
    const allTargetFields = [...info.requiredFields, ...info.optionalFields];
    const map: Record<string, string> = {};
    allTargetFields.forEach(tf => {
      const match = sourceFields.find(sf =>
        sf.toLowerCase().replace(/[_\s-]/g, "") === tf.toLowerCase().replace(/[_\s-]/g, "") ||
        sf.toLowerCase().includes(tf.toLowerCase()) ||
        tf.toLowerCase().includes(sf.toLowerCase())
      );
      if (match) map[tf] = match;
    });
    setFieldMap(map);
  };

  // Re-run automap when rawData changes
  const sourceFields = rawData.length > 0 ? Object.keys(rawData[0]) : [];

  const handleImport = () => {
    const now = new Date().toISOString().split("T")[0];
    const info = targetLabels[target];
    let count = 0;

    if (target === "websites") {
      const newItems = rawData.map(row => ({
        id: generateId(),
        name: row[fieldMap.name || "name"] || "Unnamed",
        url: row[fieldMap.url || "url"] || "",
        wpAdminUrl: row[fieldMap.wpAdminUrl || ""] || "",
        wpUsername: row[fieldMap.wpUsername || ""] || "",
        wpPassword: row[fieldMap.wpPassword || ""] || "",
        hostingProvider: row[fieldMap.hostingProvider || ""] || "",
        hostingLoginUrl: row[fieldMap.hostingLoginUrl || ""] || "",
        hostingUsername: row[fieldMap.hostingUsername || ""] || "",
        hostingPassword: row[fieldMap.hostingPassword || ""] || "",
        category: row[fieldMap.category || ""] || "Personal",
        status: (row[fieldMap.status || ""] as any) || "active",
        notes: row[fieldMap.notes || ""] || "",
        plugins: (row[fieldMap.plugins || ""] || "").split(",").map(s => s.trim()).filter(Boolean),
        dateAdded: now,
        lastUpdated: now,
      })).filter(w => w.name || w.url);
      count = newItems.length;
      updateData({ websites: [...newItems, ...websites] });
    } else if (target === "links") {
      const newItems = rawData.map(row => ({
        id: generateId(),
        title: row[fieldMap.title || "title"] || "Untitled",
        url: row[fieldMap.url || "url"] || "",
        category: row[fieldMap.category || ""] || "Other",
        status: (row[fieldMap.status || ""] as any) || "active",
        description: row[fieldMap.description || ""] || "",
        dateAdded: now,
        pinned: false,
      })).filter(l => l.title || l.url);
      count = newItems.length;
      updateData({ links: [...newItems, ...links] });
    } else if (target === "tasks") {
      const newItems = rawData.map(row => ({
        id: generateId(),
        title: row[fieldMap.title || "title"] || "Untitled",
        priority: (row[fieldMap.priority || ""] as any) || "medium",
        status: (row[fieldMap.status || ""] as any) || "todo",
        dueDate: row[fieldMap.dueDate || ""] || now,
        category: row[fieldMap.category || ""] || "General",
        description: row[fieldMap.description || ""] || "",
        linkedProject: row[fieldMap.linkedProject || ""] || "",
        subtasks: [],
        createdAt: now,
      })).filter(t => t.title);
      count = newItems.length;
      updateData({ tasks: [...newItems, ...tasks] });
    } else if (target === "repos") {
      const newItems = rawData.map(row => ({
        id: generateId(),
        name: row[fieldMap.name || "name"] || "unnamed-repo",
        url: row[fieldMap.url || "url"] || "",
        description: row[fieldMap.description || ""] || "",
        language: row[fieldMap.language || ""] || "TypeScript",
        stars: parseInt(row[fieldMap.stars || ""] || "0") || 0,
        forks: parseInt(row[fieldMap.forks || ""] || "0") || 0,
        status: (row[fieldMap.status || ""] as any) || "active",
        demoUrl: row[fieldMap.demoUrl || ""] || "",
        progress: parseInt(row[fieldMap.progress || ""] || "0") || 0,
        topics: (row[fieldMap.topics || ""] || "").split(",").map(s => s.trim()).filter(Boolean),
        lastUpdated: now,
      })).filter(r => r.name);
      count = newItems.length;
      updateData({ repos: [...newItems, ...repos] });
    } else if (target === "buildProjects") {
      const newItems = rawData.map(row => ({
        id: generateId(),
        name: row[fieldMap.name || "name"] || "Unnamed",
        platform: (row[fieldMap.platform || ""] as any) || "bolt",
        projectUrl: row[fieldMap.projectUrl || ""] || "",
        deployedUrl: row[fieldMap.deployedUrl || ""] || "",
        description: row[fieldMap.description || ""] || "",
        techStack: (row[fieldMap.techStack || ""] || "").split(",").map(s => s.trim()).filter(Boolean),
        status: (row[fieldMap.status || ""] as any) || "ideation",
        startedDate: now,
        lastWorkedOn: now,
        nextSteps: row[fieldMap.nextSteps || ""] || "",
        githubRepo: row[fieldMap.githubRepo || ""] || "",
      })).filter(b => b.name);
      count = newItems.length;
      updateData({ buildProjects: [...newItems, ...buildProjects] });
    }

    setImportCount(count);
    setStep(3);
  };

  const downloadTemplate = () => {
    const info = targetLabels[target];
    const headers = [...info.requiredFields, ...info.optionalFields];
    const csv = headers.join(",") + "\n" + headers.map(() => "").join(",");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${target}-template.csv`;
    a.click();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-2xl w-full bg-card rounded-2xl shadow-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-card-foreground">
                {step === 1 ? "📥 Bulk Import" : step === 2 ? "🔗 Map Fields" : "✅ Import Complete"}
              </h2>
              <button onClick={() => { reset(); onClose(); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {step === 1 && (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Import into:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(Object.entries(targetLabels) as [ImportTarget, typeof targetLabels[ImportTarget]][]).map(([key, info]) => (
                        <button
                          key={key}
                          onClick={() => setTarget(key)}
                          className={`p-3 rounded-xl text-sm font-medium transition-all text-left ${target === key ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                        >
                          <span className="text-lg mr-1.5">{info.emoji}</span>
                          {info.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">Upload CSV or JSON file:</div>
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-card-foreground font-medium">Click to upload or drag a file</p>
                      <p className="text-xs text-muted-foreground mt-1">Supports .csv and .json files</p>
                    </div>
                    <input ref={fileRef} type="file" accept=".csv,.json" onChange={handleFile} className="hidden" />
                  </div>

                  <button onClick={downloadTemplate} className="flex items-center gap-2 text-xs text-primary hover:underline">
                    <Download size={12} /> Download CSV template for {targetLabels[target].label}
                  </button>

                  <div className="text-xs text-muted-foreground space-y-1 bg-secondary/50 rounded-xl p-3">
                    <p className="font-medium text-card-foreground">Required fields for {targetLabels[target].label}:</p>
                    <p>{targetLabels[target].requiredFields.join(", ")}</p>
                    <p className="font-medium text-card-foreground mt-2">Optional fields:</p>
                    <p>{targetLabels[target].optionalFields.join(", ")}</p>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="flex items-center gap-2 text-sm text-card-foreground">
                    <FileText size={16} className="text-primary" />
                    <span className="font-medium">{rawData.length} rows found</span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">Map your file columns to {targetLabels[target].label} fields:</p>
                    {[...targetLabels[target].requiredFields, ...targetLabels[target].optionalFields].map(field => (
                      <div key={field} className="flex items-center gap-3">
                        <span className={`text-xs font-medium w-32 text-right ${targetLabels[target].requiredFields.includes(field) ? "text-card-foreground" : "text-muted-foreground"}`}>
                          {field} {targetLabels[target].requiredFields.includes(field) ? "*" : ""}
                        </span>
                        <ArrowRight size={12} className="text-muted-foreground flex-shrink-0" />
                        <select
                          value={fieldMap[field] || ""}
                          onChange={(e) => setFieldMap(prev => ({ ...prev, [field]: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-xl bg-secondary text-foreground text-sm outline-none appearance-none cursor-pointer"
                        >
                          <option value="">— skip —</option>
                          {sourceFields.map(sf => (
                            <option key={sf} value={sf}>{sf}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {rawData.length > 0 && (
                    <div className="text-xs text-muted-foreground bg-secondary/50 rounded-xl p-3 overflow-x-auto">
                      <p className="font-medium text-card-foreground mb-2">Preview (first 3 rows):</p>
                      <table className="text-[11px] w-full">
                        <thead>
                          <tr>{sourceFields.map(f => <th key={f} className="text-left pr-3 pb-1 text-muted-foreground font-medium">{f}</th>)}</tr>
                        </thead>
                        <tbody>
                          {rawData.slice(0, 3).map((row, i) => (
                            <tr key={i}>{sourceFields.map(f => <td key={f} className="pr-3 py-0.5 text-card-foreground truncate max-w-[120px]">{row[f]}</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {step === 3 && (
                <div className="text-center py-8">
                  <CheckCircle2 size={48} className="mx-auto text-success mb-4" />
                  <h3 className="text-xl font-bold text-card-foreground mb-2">Import Successful!</h3>
                  <p className="text-muted-foreground">{importCount} {targetLabels[target].label.toLowerCase()} imported successfully.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              {step === 1 && (
                <button onClick={() => { reset(); onClose(); }} className="px-4 py-2 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
              )}
              {step === 2 && (
                <>
                  <button onClick={() => setStep(1)} className="px-4 py-2 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Back</button>
                  <button onClick={handleImport} className="px-5 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                    Import {rawData.length} items
                  </button>
                </>
              )}
              {step === 3 && (
                <button onClick={() => { reset(); onClose(); }} className="px-5 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity">Done</button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
