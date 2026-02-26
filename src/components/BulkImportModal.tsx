import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle2, ArrowRight, Download, ClipboardPaste, AlertTriangle, Sparkles, ChevronDown } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';
import {
  type ImportTarget,
  TARGET_META,
  parseImportData,
  autoDetectCategory,
  autoMapFields,
  normalizeItems,
  generateTemplate,
  type ParsedData,
} from '@/lib/importEngine';

type Step = 1 | 2 | 3 | 4;

export default function BulkImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { bulkAddItems } = useDashboard();
  const [step, setStep] = useState<Step>(1);
  const [target, setTarget] = useState<ImportTarget>('websites');
  const [autoDetected, setAutoDetected] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
  const [importCount, setImportCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep(1); setParsedData(null); setFieldMap({}); setImportCount(0);
    setErrors([]); setPasteMode(false); setPasteText(''); setAutoDetected(false);
  };

  const processData = useCallback((text: string, fileName?: string) => {
    try {
      const parsed = parseImportData(text, fileName);
      if (parsed.rows.length === 0) {
        setErrors(['No data rows found. Check format.']);
        return;
      }

      // Auto-detect category
      const detected = autoDetectCategory(parsed.sourceFields);
      setTarget(detected);
      setAutoDetected(true);

      // Auto-map fields
      const map = autoMapFields(parsed.sourceFields, detected);
      setFieldMap(map);
      setParsedData(parsed);
      setErrors([]);
      setStep(2);
    } catch (e) {
      setErrors([`Parse error: ${e instanceof Error ? e.message : 'Unknown error'}`]);
    }
  }, []);

  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrors(['File too large (max 10MB)']);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => processData(ev.target?.result as string, file.name);
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handlePaste = () => {
    if (!pasteText.trim()) return;
    processData(pasteText);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) processData(text);
    } catch {
      setPasteMode(true);
    }
  };

  // When user changes the target category manually, re-map
  const handleTargetChange = (newTarget: ImportTarget) => {
    setTarget(newTarget);
    setAutoDetected(false);
    if (parsedData) {
      setFieldMap(autoMapFields(parsedData.sourceFields, newTarget));
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;
    const items = normalizeItems(parsedData.rows, target, fieldMap);
    if (items.length === 0) {
      setErrors(['No valid items after applying field mapping. Check required fields.']);
      return;
    }
    try {
      await bulkAddItems(target, items);
      setImportCount(items.length);
      setErrors([]);
      setStep(4);
    } catch (e) {
      setErrors([`Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`]);
    }
  };

  const downloadTemplate = () => {
    const csv = generateTemplate(target);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${target}-template.csv`;
    a.click();
  };

  const meta = TARGET_META[target];
  const allTargetFields = [...meta.requiredFields, ...meta.optionalFields];
  const mappedRequired = meta.requiredFields.filter(f => fieldMap[f]);
  const isReady = mappedRequired.length === meta.requiredFields.length;

  // Preview items count
  const previewItems = parsedData ? normalizeItems(parsedData.rows, target, fieldMap) : [];

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
            className="relative max-w-2xl w-full bg-card/95 backdrop-blur-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col border border-border/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-card-foreground">
                  {step === 1 ? '📥 Smart Import' : step === 2 ? '🎯 Auto-Detected' : step === 3 ? '🔗 Map Fields' : '✅ Done'}
                </h2>
                {parsedData && step >= 2 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase">
                    {parsedData.detectedFormat}
                  </span>
                )}
              </div>
              <button onClick={() => { reset(); onClose(); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4">
              {/* Errors */}
              {errors.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                  <div>{errors.map((e, i) => <p key={i}>{e}</p>)}</div>
                </div>
              )}

              {/* Step 1: Upload / Paste */}
              {step === 1 && (
                <>
                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !pasteMode && fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                      isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-border/50 hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    <Upload size={28} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-card-foreground font-semibold">Drop a file or click to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">CSV, TSV, JSON, JSON Lines — auto-detected</p>
                  </div>
                  <input ref={fileRef} type="file" accept=".csv,.tsv,.json,.jsonl,.txt" onChange={handleFileInput} className="hidden" />

                  {/* Or paste */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-xs text-muted-foreground font-medium">OR</span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleClipboardPaste}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium text-secondary-foreground transition-colors"
                    >
                      <ClipboardPaste size={16} /> Paste from Clipboard
                    </button>
                    <button onClick={() => setPasteMode(!pasteMode)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium text-secondary-foreground transition-colors"
                    >
                      <FileText size={16} /> Type/Paste
                    </button>
                  </div>

                  {pasteMode && (
                    <div className="space-y-2">
                      <textarea
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        placeholder={'Paste CSV, JSON, or tabular data here...\n\nExample CSV:\nname,url,category\nMy Site,https://example.com,Business'}
                        className="w-full h-36 px-3 py-2 rounded-xl bg-secondary text-foreground text-sm font-mono resize-none outline-none border border-border/30 focus:border-primary/40"
                      />
                      <button onClick={handlePaste} disabled={!pasteText.trim()}
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
                      >
                        <Sparkles size={14} className="inline mr-1.5" /> Auto-Detect & Import
                      </button>
                    </div>
                  )}

                  {/* Template download */}
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border/30">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-card-foreground">Need a template?</span> Download CSV for any category
                    </div>
                    <div className="relative group">
                      <button className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                        <Download size={12} /> Template <ChevronDown size={10} />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-44 bg-card rounded-xl shadow-lg border border-border/50 p-1.5 hidden group-hover:block z-10">
                        {(Object.entries(TARGET_META) as [ImportTarget, typeof TARGET_META[ImportTarget]][]).map(([key, info]) => (
                          <button key={key} onClick={() => { setTarget(key as ImportTarget); setTimeout(downloadTemplate, 0); }}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-secondary transition-colors text-card-foreground"
                          >
                            {info.emoji} {info.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Auto-detected — confirm category */}
              {step === 2 && parsedData && (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <Sparkles size={18} className="text-primary" />
                    <div className="flex-1 text-sm">
                      <span className="font-semibold text-card-foreground">
                        {autoDetected ? 'Auto-detected: ' : 'Selected: '}
                        {meta.emoji} {meta.label}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        ({parsedData.rows.length} rows, {parsedData.sourceFields.length} columns)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                      {autoDetected ? 'Change category if incorrect:' : 'Select category:'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                      {(Object.entries(TARGET_META) as [ImportTarget, typeof TARGET_META[ImportTarget]][]).map(([key, info]) => (
                        <button key={key} onClick={() => handleTargetChange(key as ImportTarget)}
                          className={`px-2 py-2 rounded-xl text-xs font-medium transition-all text-center ${
                            target === key ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                          }`}
                        >
                          <span className="mr-1">{info.emoji}</span>{info.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field mapping preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">Field Mapping:</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isReady ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {mappedRequired.length}/{meta.requiredFields.length} required mapped
                      </span>
                    </div>
                    {allTargetFields.map(field => (
                      <div key={field} className="flex items-center gap-2 sm:gap-3">
                        <span className={`text-[11px] font-medium w-28 sm:w-32 text-right truncate ${
                          meta.requiredFields.includes(field) ? 'text-card-foreground' : 'text-muted-foreground'
                        }`}>
                          {field} {meta.requiredFields.includes(field) ? <span className="text-destructive">*</span> : ''}
                        </span>
                        <ArrowRight size={10} className="text-muted-foreground flex-shrink-0" />
                        <select value={fieldMap[field] || ''} onChange={(e) => setFieldMap(prev => ({ ...prev, [field]: e.target.value }))}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-xs outline-none appearance-none cursor-pointer transition-colors ${
                            fieldMap[field] ? 'bg-primary/5 text-foreground border border-primary/20' : 'bg-secondary text-muted-foreground border border-border/30'
                          }`}
                        >
                          <option value="">— skip —</option>
                          {parsedData.sourceFields.map(sf => (<option key={sf} value={sf}>{sf}</option>))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Preview */}
                  {parsedData.rows.length > 0 && (
                    <div className="text-xs text-muted-foreground bg-secondary/30 rounded-xl p-3 overflow-x-auto border border-border/30">
                      <p className="font-semibold text-card-foreground mb-2">
                        Preview ({Math.min(3, parsedData.rows.length)} of {parsedData.rows.length} rows):
                      </p>
                      <table className="text-[11px] w-full">
                        <thead>
                          <tr>{parsedData.sourceFields.map(f => (
                            <th key={f} className="text-left pr-3 pb-1 text-muted-foreground font-medium whitespace-nowrap">{f}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {parsedData.rows.slice(0, 3).map((row, i) => (
                            <tr key={i}>{parsedData.sourceFields.map(f => (
                              <td key={f} className="pr-3 py-0.5 text-card-foreground truncate max-w-[120px]">{row[f]}</td>
                            ))}</tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground p-3 bg-secondary/20 rounded-xl border border-border/20">
                    <span className="font-semibold text-card-foreground">{previewItems.length}</span> of {parsedData.rows.length} rows will be imported
                    {previewItems.length < parsedData.rows.length && (
                      <span className="text-amber-600 ml-1">(some rows missing required fields)</span>
                    )}
                  </div>
                </>
              )}

              {/* Step 4: Success */}
              {step === 4 && (
                <div className="text-center py-8">
                  <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                  <h3 className="text-xl font-bold text-card-foreground mb-2">Import Successful!</h3>
                  <p className="text-muted-foreground">{importCount} {meta.label.toLowerCase()} imported.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50">
              {step === 1 && (
                <button onClick={() => { reset(); onClose(); }}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                  Cancel
                </button>
              )}
              {step === 2 && (
                <>
                  <button onClick={() => { reset(); }}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                    Start Over
                  </button>
                  <button onClick={handleImport} disabled={!isReady || previewItems.length === 0}
                    className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Import {previewItems.length} {meta.label}
                  </button>
                </>
              )}
              {step === 4 && (
                <button onClick={() => { reset(); onClose(); }}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
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
