import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle2, ArrowRight, Download } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';

type ImportTarget = 'websites' | 'links' | 'tasks' | 'repos' | 'buildProjects' | 'credentials' | 'payments' | 'notes';

const targetLabels: Record<ImportTarget, { label: string; emoji: string; requiredFields: string[]; optionalFields: string[] }> = {
  websites: {
    label: 'Websites', emoji: '🌐',
    requiredFields: ['name', 'url'],
    optionalFields: ['wpAdminUrl', 'wpUsername', 'wpPassword', 'hostingProvider', 'hostingLoginUrl', 'hostingUsername', 'hostingPassword', 'category', 'status', 'notes', 'plugins'],
  },
  links: {
    label: 'Links', emoji: '🔗',
    requiredFields: ['title', 'url'],
    optionalFields: ['category', 'description', 'status', 'pinned'],
  },
  tasks: {
    label: 'Tasks', emoji: '✅',
    requiredFields: ['title'],
    optionalFields: ['priority', 'status', 'dueDate', 'category', 'description', 'linkedProject'],
  },
  repos: {
    label: 'GitHub Repos', emoji: '🐙',
    requiredFields: ['name'],
    optionalFields: ['url', 'description', 'language', 'stars', 'forks', 'status', 'demoUrl', 'progress', 'topics'],
  },
  buildProjects: {
    label: 'Build Projects', emoji: '🛠️',
    requiredFields: ['name'],
    optionalFields: ['platform', 'projectUrl', 'deployedUrl', 'description', 'techStack', 'status', 'nextSteps', 'githubRepo'],
  },
  credentials: {
    label: 'Credentials', emoji: '🔐',
    requiredFields: ['label', 'service'],
    optionalFields: ['url', 'username', 'password', 'apiKey', 'notes', 'category'],
  },
  payments: {
    label: 'Payments', emoji: '💰',
    requiredFields: ['title', 'amount'],
    optionalFields: ['currency', 'type', 'status', 'category', 'from', 'to', 'dueDate', 'recurring', 'notes'],
  },
  notes: {
    label: 'Notes', emoji: '📝',
    requiredFields: ['title'],
    optionalFields: ['content', 'color', 'pinned', 'tags'],
  },
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  return lines.slice(1).map(line => {
    const values = line.match(/(\"([^\"]|\"\")*\"|[^,]*)/g) || [];
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (values[i] || '').trim().replace(/^["']|["']$/g, '').replace(/""/g, '"');
    });
    return obj;
  });
}

export default function BulkImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { bulkAddItems, genId } = useDashboard();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [target, setTarget] = useState<ImportTarget>('websites');
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
  const [importCount, setImportCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setStep(1); setRawData([]); setFieldMap({}); setImportCount(0); };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        let data: Record<string, string>[];
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          data = arr.map(item => {
            const obj: Record<string, string> = {};
            Object.entries(item).forEach(([k, v]) => {
              obj[k] = Array.isArray(v) ? v.join(', ') : String(v ?? '');
            });
            return obj;
          });
        } else {
          data = parseCSV(text);
        }
        setRawData(data);
        // Auto-map
        const info = targetLabels[target];
        const sourceFields = data.length > 0 ? Object.keys(data[0]) : [];
        const allTargetFields = [...info.requiredFields, ...info.optionalFields];
        const map: Record<string, string> = {};
        allTargetFields.forEach(tf => {
          const match = sourceFields.find(sf =>
            sf.toLowerCase().replace(/[_\s-]/g, '') === tf.toLowerCase().replace(/[_\s-]/g, '') ||
            sf.toLowerCase().includes(tf.toLowerCase()) ||
            tf.toLowerCase().includes(sf.toLowerCase())
          );
          if (match) map[tf] = match;
        });
        setFieldMap(map);
        setStep(2);
      } catch {
        alert('Failed to parse file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const sourceFields = rawData.length > 0 ? Object.keys(rawData[0]) : [];

  const handleImport = async () => {
    const now = new Date().toISOString().split('T')[0];
    const getField = (row: Record<string, string>, field: string) => row[fieldMap[field] || ''] || '';

    const items = rawData.map(row => {
      const base: any = {};
      const info = targetLabels[target];
      [...info.requiredFields, ...info.optionalFields].forEach(field => {
        const val = getField(row, field);
        if (val) base[field] = val;
      });

      // Add defaults
      if (target === 'websites') {
        return {
          name: base.name || 'Unnamed', url: base.url || '', wpAdminUrl: base.wpAdminUrl || '', wpUsername: base.wpUsername || '', wpPassword: base.wpPassword || '',
          hostingProvider: base.hostingProvider || '', hostingLoginUrl: base.hostingLoginUrl || '', hostingUsername: base.hostingUsername || '', hostingPassword: base.hostingPassword || '',
          category: base.category || 'Personal', status: base.status || 'active', notes: base.notes || '',
          plugins: (base.plugins || '').split(',').map((s: string) => s.trim()).filter(Boolean),
          dateAdded: now, lastUpdated: now,
        };
      }
      if (target === 'links') {
        return { title: base.title || 'Untitled', url: base.url || '', category: base.category || 'Other', status: base.status || 'active', description: base.description || '', dateAdded: now, pinned: base.pinned === 'true' };
      }
      if (target === 'tasks') {
        return { title: base.title || 'Untitled', priority: base.priority || 'medium', status: base.status || 'todo', dueDate: base.dueDate || now, category: base.category || 'General', description: base.description || '', linkedProject: base.linkedProject || '', subtasks: [], createdAt: now };
      }
      if (target === 'repos') {
        return { name: base.name || 'unnamed-repo', url: base.url || '', description: base.description || '', language: base.language || 'TypeScript', stars: parseInt(base.stars) || 0, forks: parseInt(base.forks) || 0, status: base.status || 'active', demoUrl: base.demoUrl || '', progress: parseInt(base.progress) || 0, topics: (base.topics || '').split(',').map((s: string) => s.trim()).filter(Boolean), lastUpdated: now };
      }
      if (target === 'credentials') {
        return { label: base.label || 'Untitled', service: base.service || '', url: base.url || '', username: base.username || '', password: base.password || '', apiKey: base.apiKey || '', notes: base.notes || '', category: base.category || 'Other', createdAt: now };
      }
      if (target === 'payments') {
        return { title: base.title || 'Untitled', amount: parseFloat(base.amount) || 0, currency: base.currency || 'USD', type: base.type || 'expense', status: base.status || 'pending', category: base.category || 'Other', from: base.from || '', to: base.to || '', dueDate: base.dueDate || now, paidDate: '', recurring: base.recurring === 'true', recurringInterval: '', linkedProject: '', notes: base.notes || '', createdAt: now };
      }
      if (target === 'notes') {
        return { title: base.title || 'Untitled', content: base.content || '', color: base.color || 'blue', pinned: base.pinned === 'true', tags: (base.tags || '').split(',').map((s: string) => s.trim()).filter(Boolean), createdAt: now, updatedAt: now };
      }
      return base;
    }).filter((item: any) => {
      const info = targetLabels[target];
      return info.requiredFields.every(f => item[f]);
    });

    await bulkAddItems(target, items);
    setImportCount(items.length);
    setStep(3);
  };

  const downloadTemplate = () => {
    const info = targetLabels[target];
    const headers = [...info.requiredFields, ...info.optionalFields];
    const csv = headers.join(',') + '\n' + headers.map(() => '').join(',');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${target}-template.csv`;
    a.click();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}
        >
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-2xl w-full bg-card/95 backdrop-blur-2xl rounded-2xl shadow-2xl max-h-[85vh] flex flex-col border border-border/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <h2 className="text-lg font-bold text-card-foreground">
                {step === 1 ? '📥 Bulk Import' : step === 2 ? '🔗 Map Fields' : '✅ Import Complete'}
              </h2>
              <button onClick={() => { reset(); onClose(); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {step === 1 && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block">Import into:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(Object.entries(targetLabels) as [ImportTarget, typeof targetLabels[ImportTarget]][]).map(([key, info]) => (
                        <button key={key} onClick={() => setTarget(key)}
                          className={`p-3 rounded-xl text-sm font-medium transition-all text-left ${target === key ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                        >
                          <span className="text-lg mr-1.5">{info.emoji}</span>
                          {info.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-muted-foreground">Upload CSV or JSON file:</div>
                    <div onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-border/50 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-card-foreground font-semibold">Click to upload or drag a file</p>
                      <p className="text-xs text-muted-foreground mt-1">Supports .csv and .json files</p>
                    </div>
                    <input ref={fileRef} type="file" accept=".csv,.json" onChange={handleFile} className="hidden" />
                  </div>

                  <button onClick={downloadTemplate} className="flex items-center gap-2 text-xs text-primary hover:underline font-medium">
                    <Download size={12} /> Download CSV template for {targetLabels[target].label}
                  </button>

                  <div className="text-xs text-muted-foreground space-y-1 bg-secondary/30 rounded-xl p-3 border border-border/30">
                    <p className="font-semibold text-card-foreground">Required fields for {targetLabels[target].label}:</p>
                    <p>{targetLabels[target].requiredFields.join(', ')}</p>
                    <p className="font-semibold text-card-foreground mt-2">Optional fields:</p>
                    <p>{targetLabels[target].optionalFields.join(', ')}</p>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="flex items-center gap-2 text-sm text-card-foreground">
                    <FileText size={16} className="text-primary" />
                    <span className="font-semibold">{rawData.length} rows found</span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground">Map your file columns to {targetLabels[target].label} fields:</p>
                    {[...targetLabels[target].requiredFields, ...targetLabels[target].optionalFields].map(field => (
                      <div key={field} className="flex items-center gap-3">
                        <span className={`text-xs font-medium w-32 text-right ${targetLabels[target].requiredFields.includes(field) ? 'text-card-foreground' : 'text-muted-foreground'}`}>
                          {field} {targetLabels[target].requiredFields.includes(field) ? '*' : ''}
                        </span>
                        <ArrowRight size={12} className="text-muted-foreground flex-shrink-0" />
                        <select value={fieldMap[field] || ''} onChange={(e) => setFieldMap(prev => ({ ...prev, [field]: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-xl bg-secondary text-foreground text-sm outline-none appearance-none cursor-pointer"
                        >
                          <option value="">— skip —</option>
                          {sourceFields.map(sf => (<option key={sf} value={sf}>{sf}</option>))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {rawData.length > 0 && (
                    <div className="text-xs text-muted-foreground bg-secondary/30 rounded-xl p-3 overflow-x-auto border border-border/30">
                      <p className="font-semibold text-card-foreground mb-2">Preview (first 3 rows):</p>
                      <table className="text-[11px] w-full">
                        <thead><tr>{sourceFields.map(f => <th key={f} className="text-left pr-3 pb-1 text-muted-foreground font-medium">{f}</th>)}</tr></thead>
                        <tbody>{rawData.slice(0, 3).map((row, i) => (<tr key={i}>{sourceFields.map(f => <td key={f} className="pr-3 py-0.5 text-card-foreground truncate max-w-[120px]">{row[f]}</td>)}</tr>))}</tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {step === 3 && (
                <div className="text-center py-8">
                  <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                  <h3 className="text-xl font-bold text-card-foreground mb-2">Import Successful!</h3>
                  <p className="text-muted-foreground">{importCount} {targetLabels[target].label.toLowerCase()} imported successfully.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/50">
              {step === 1 && <button onClick={() => { reset(); onClose(); }} className="px-4 py-2 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Cancel</button>}
              {step === 2 && (
                <>
                  <button onClick={() => setStep(1)} className="px-4 py-2 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Back</button>
                  <button onClick={handleImport} className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
                    Import {rawData.length} items
                  </button>
                </>
              )}
              {step === 3 && <button onClick={() => { reset(); onClose(); }} className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">Done</button>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
