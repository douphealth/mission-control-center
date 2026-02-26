import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle2, Download, ClipboardPaste, AlertTriangle, Sparkles, ChevronDown, FileText, Loader2, Zap, ArrowRight, RotateCcw } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';
import {
  type ImportTarget,
  TARGET_META,
  autonomousImport,
  generateTemplate,
  type AutonomousImportResult,
} from '@/lib/importEngine';

type Phase = 'idle' | 'processing' | 'preview' | 'importing' | 'done';

export default function BulkImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { bulkAddItems } = useDashboard();
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<AutonomousImportResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [importCount, setImportCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<ImportTarget | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const reset = () => {
    setPhase('idle'); setResult(null); setErrors([]); setImportCount(0);
    setPasteMode(false); setPasteText(''); setSelectedTarget(null);
  };

  // Auto-focus textarea when paste mode opens
  useEffect(() => {
    if (pasteMode) setTimeout(() => textareaRef.current?.focus(), 100);
  }, [pasteMode]);

  const processData = useCallback((text: string, fileName?: string) => {
    if (!text.trim()) return;
    setPhase('processing');
    setErrors([]);

    // Small delay to show processing animation
    setTimeout(() => {
      try {
        const importResult = autonomousImport(text, fileName);

        if (importResult.totalItems === 0) {
          setErrors(['No recognizable data found. Try CSV, JSON, or a list of URLs/items.']);
          setPhase('idle');
          return;
        }

        setResult(importResult);
        setSelectedTarget(importResult.categories[0]?.target ?? null);

        // Auto-import if confidence is high
        if (importResult.categories[0]?.confidence === 'high') {
          autoImport(importResult);
        } else {
          setPhase('preview');
        }
      } catch (e) {
        setErrors([`Parse error: ${e instanceof Error ? e.message : 'Unknown error'}`]);
        setPhase('idle');
      }
    }, 400);
  }, []);

  const autoImport = async (importResult: AutonomousImportResult) => {
    setPhase('importing');
    try {
      let total = 0;
      for (const cat of importResult.categories) {
        await bulkAddItems(cat.target, cat.items);
        total += cat.items.length;
      }
      setImportCount(total);
      setPhase('done');
    } catch (e) {
      setErrors([`Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`]);
      setPhase('preview');
    }
  };

  const handleConfirmImport = async () => {
    if (!result) return;

    // If user changed target, re-process with that target
    const cat = result.categories[0];
    if (!cat) return;

    setPhase('importing');
    try {
      const target = selectedTarget || cat.target;
      const items = target !== cat.target
        ? (() => {
            const { normalizeItems, autoMapFields } = require('@/lib/importEngine');
            const fieldMap = autoMapFields(result.parsedData.sourceFields, target);
            return normalizeItems(result.parsedData.rows, target, fieldMap);
          })()
        : cat.items;

      await bulkAddItems(target, items);
      setImportCount(items.length);
      setPhase('done');
    } catch (e) {
      setErrors([`Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`]);
      setPhase('preview');
    }
  };

  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { setErrors(['File too large (max 10MB)']); return; }
    const reader = new FileReader();
    reader.onload = (ev) => processData(ev.target?.result as string, file.name);
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) processData(text);
    } catch {
      setPasteMode(true);
    }
  };

  const downloadTemplate = (target: ImportTarget) => {
    const csv = generateTemplate(target);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${target}-template.csv`;
    a.click();
  };

  const bestCat = result?.categories[0];
  const meta = bestCat ? TARGET_META[bestCat.target] : null;
  const displayTarget = selectedTarget || bestCat?.target;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4" onClick={onClose}
        >
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-xl w-full bg-card/95 backdrop-blur-2xl rounded-2xl shadow-2xl max-h-[85vh] flex flex-col border border-border/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-primary" />
                <h2 className="text-sm sm:text-base font-bold text-card-foreground">
                  {phase === 'idle' ? 'Smart Import' : phase === 'processing' ? 'Analyzing...' : phase === 'preview' ? 'Confirm Import' : phase === 'importing' ? 'Importing...' : 'Done!'}
                </h2>
              </div>
              <button onClick={() => { reset(); onClose(); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
              {/* Errors */}
              {errors.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <div>{errors.map((e, i) => <p key={i}>{e}</p>)}</div>
                </div>
              )}

              {/* ── IDLE: Drop / Paste ── */}
              {phase === 'idle' && (
                <>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !pasteMode && fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDragging ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-border/50 hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-card-foreground font-semibold">Drop any file here</p>
                    <p className="text-[11px] text-muted-foreground mt-1">CSV, JSON, TSV, plain text — auto-detected & auto-imported</p>
                  </div>
                  <input ref={fileRef} type="file" accept=".csv,.tsv,.json,.jsonl,.txt" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border/30" />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-border/30" />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleClipboardPaste}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-xs font-medium text-primary transition-colors">
                      <ClipboardPaste size={14} /> Paste from Clipboard
                    </button>
                    <button onClick={() => setPasteMode(!pasteMode)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-medium text-secondary-foreground transition-colors">
                      <FileText size={14} /> Type
                    </button>
                  </div>

                  {pasteMode && (
                    <div className="space-y-2">
                      <textarea
                        ref={textareaRef}
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        onPaste={(e) => {
                          // Auto-process on paste event
                          setTimeout(() => {
                            const val = (e.target as HTMLTextAreaElement).value;
                            if (val.trim()) processData(val);
                          }, 50);
                        }}
                        placeholder="Paste anything: CSV rows, JSON, URLs, a list of tasks..."
                        className="w-full h-28 px-3 py-2 rounded-xl bg-secondary text-foreground text-xs font-mono resize-none outline-none border border-border/30 focus:border-primary/40"
                      />
                      <button onClick={() => processData(pasteText)} disabled={!pasteText.trim()}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-1.5">
                        <Sparkles size={12} /> Auto-Detect & Import
                      </button>
                    </div>
                  )}

                  {/* Compact template section */}
                  <div className="flex items-center justify-between p-2.5 bg-secondary/20 rounded-xl border border-border/20">
                    <span className="text-[11px] text-muted-foreground">
                      <span className="font-semibold text-card-foreground">Templates:</span> download CSV starter
                    </span>
                    <div className="relative group">
                      <button className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium">
                        <Download size={10} /> Get <ChevronDown size={8} />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-40 bg-card rounded-xl shadow-lg border border-border/50 p-1 hidden group-hover:block z-10">
                        {(Object.entries(TARGET_META) as [ImportTarget, typeof TARGET_META[ImportTarget]][]).map(([key, info]) => (
                          <button key={key} onClick={() => downloadTemplate(key as ImportTarget)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-secondary transition-colors text-card-foreground">
                            {info.emoji} {info.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── PROCESSING: Animation ── */}
              {phase === 'processing' && (
                <div className="text-center py-10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block"
                  >
                    <Loader2 size={32} className="text-primary" />
                  </motion.div>
                  <p className="text-sm text-card-foreground font-semibold mt-3">Analyzing your data...</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Detecting format, category & mapping fields</p>
                </div>
              )}

              {/* ── PREVIEW: Confirm before import (medium/low confidence) ── */}
              {phase === 'preview' && result && bestCat && meta && (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <Sparkles size={16} className="text-primary flex-shrink-0" />
                    <div className="flex-1 text-xs">
                      <span className="font-semibold text-card-foreground">
                        Detected: {meta.emoji} {meta.label}
                      </span>
                      <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        bestCat.confidence === 'high' ? 'bg-primary/10 text-primary'
                        : bestCat.confidence === 'medium' ? 'bg-accent text-accent-foreground'
                        : 'bg-destructive/10 text-destructive'
                      }`}>
                        {bestCat.confidence} confidence
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {result.parsedData.rows.length} rows → {bestCat.items.length} valid
                      </span>
                    </div>
                  </div>

                  {/* Change category */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Wrong category? Change it:</p>
                    <div className="flex flex-wrap gap-1">
                      {(Object.entries(TARGET_META) as [ImportTarget, typeof TARGET_META[ImportTarget]][]).map(([key, info]) => (
                        <button key={key} onClick={() => setSelectedTarget(key as ImportTarget)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                            displayTarget === key ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                          }`}>
                          {info.emoji} {info.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Data preview */}
                  {result.parsedData.rows.length > 0 && (
                    <div className="text-xs bg-secondary/20 rounded-xl p-3 overflow-x-auto border border-border/20 max-h-40">
                      <table className="text-[10px] w-full">
                        <thead>
                          <tr>{result.parsedData.sourceFields.slice(0, 6).map(f => (
                            <th key={f} className="text-left pr-2 pb-1 text-muted-foreground font-medium whitespace-nowrap">{f}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {result.parsedData.rows.slice(0, 4).map((row, i) => (
                            <tr key={i}>{result.parsedData.sourceFields.slice(0, 6).map(f => (
                              <td key={f} className="pr-2 py-0.5 text-card-foreground truncate max-w-[100px]">{row[f]}</td>
                            ))}</tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* ── IMPORTING: Progress ── */}
              {phase === 'importing' && (
                <div className="text-center py-10">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="inline-block"
                  >
                    <Zap size={32} className="text-primary" />
                  </motion.div>
                  <p className="text-sm text-card-foreground font-semibold mt-3">Importing...</p>
                </div>
              )}

              {/* ── DONE: Success ── */}
              {phase === 'done' && bestCat && (
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <CheckCircle2 size={48} className="mx-auto text-primary mb-3" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-card-foreground mb-1">
                    {importCount} {TARGET_META[displayTarget || bestCat.target].emoji} {TARGET_META[displayTarget || bestCat.target].label} imported!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Format: {result?.parsedData.detectedFormat?.toUpperCase()} • Auto-detected & imported
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-border/50">
              {phase === 'idle' && (
                <button onClick={() => { reset(); onClose(); }}
                  className="ml-auto px-3 py-1.5 rounded-xl text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                  Cancel
                </button>
              )}
              {phase === 'preview' && (
                <>
                  <button onClick={reset} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                    <RotateCcw size={12} /> Start Over
                  </button>
                  <button onClick={handleConfirmImport} disabled={!bestCat || bestCat.items.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 disabled:opacity-40">
                    <ArrowRight size={14} /> Import {bestCat?.items.length} {TARGET_META[displayTarget || bestCat!.target].label}
                  </button>
                </>
              )}
              {phase === 'done' && (
                <button onClick={() => { reset(); onClose(); }}
                  className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
                  Done
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
