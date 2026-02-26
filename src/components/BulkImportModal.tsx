import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle2, ArrowRight, Download, Sparkles, Wand2, Globe, Link2, Key, CreditCard, FileCode, AlertCircle, ExternalLink, Clipboard } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';
import { toast } from 'sonner';

type ImportTarget = 'websites' | 'links' | 'tasks' | 'repos' | 'buildProjects' | 'credentials' | 'payments' | 'notes';

const targetLabels: Record<ImportTarget, { label: string; emoji: string; icon: any; requiredFields: string[]; optionalFields: string[]; gradient: string }> = {
  websites: {
    label: 'Websites', emoji: '🌐', icon: Globe,
    requiredFields: ['name', 'url'],
    optionalFields: ['wpAdminUrl', 'wpUsername', 'wpPassword', 'hostingProvider', 'hostingLoginUrl', 'hostingUsername', 'hostingPassword', 'category', 'status', 'notes', 'plugins'],
    gradient: 'from-blue-500 to-cyan-500',
  },
  links: {
    label: 'Links', emoji: '🔗', icon: Link2,
    requiredFields: ['title', 'url'],
    optionalFields: ['category', 'description', 'status', 'pinned'],
    gradient: 'from-purple-500 to-pink-500',
  },
  tasks: {
    label: 'Tasks', emoji: '✅', icon: FileText,
    requiredFields: ['title'],
    optionalFields: ['priority', 'status', 'dueDate', 'category', 'description', 'linkedProject'],
    gradient: 'from-amber-500 to-orange-500',
  },
  repos: {
    label: 'GitHub Repos', emoji: '🐙', icon: FileCode,
    requiredFields: ['name'],
    optionalFields: ['url', 'description', 'language', 'stars', 'forks', 'status', 'demoUrl', 'progress', 'topics'],
    gradient: 'from-green-500 to-emerald-500',
  },
  buildProjects: {
    label: 'Build Projects', emoji: '🛠️', icon: FileCode,
    requiredFields: ['name'],
    optionalFields: ['platform', 'projectUrl', 'deployedUrl', 'description', 'techStack', 'status', 'nextSteps', 'githubRepo'],
    gradient: 'from-orange-500 to-red-500',
  },
  credentials: {
    label: 'Credentials', emoji: '🔐', icon: Key,
    requiredFields: ['label', 'service'],
    optionalFields: ['url', 'username', 'password', 'apiKey', 'notes', 'category'],
    gradient: 'from-red-500 to-rose-500',
  },
  payments: {
    label: 'Payments', emoji: '💰', icon: CreditCard,
    requiredFields: ['title', 'amount'],
    optionalFields: ['currency', 'type', 'status', 'category', 'from', 'to', 'dueDate', 'recurring', 'notes'],
    gradient: 'from-emerald-500 to-teal-500',
  },
  notes: {
    label: 'Notes', emoji: '📝', icon: FileText,
    requiredFields: ['title'],
    optionalFields: ['content', 'color', 'pinned', 'tags'],
    gradient: 'from-indigo-500 to-violet-500',
  },
};

// ─── SOTA Smart Parser ──────────────────────────────────────────────────────
// Intelligent auto-detection: user just pastes ANY data and we figure it out

const URL_REGEX = /https?:\/\/[^\s,;|"'<>]+/gi;
const EMAIL_REGEX = /[\w.+-]+@[\w.-]+\.\w{2,}/gi;
const PASSWORD_PATTERNS = /(?:pass(?:word)?|pwd|secret)\s*[:=]\s*([^\s,;|]+)/gi;
const USERNAME_PATTERNS = /(?:user(?:name)?|login|email|account)\s*[:=]\s*([^\s,;|]+)/gi;
const WP_ADMIN_REGEX = /https?:\/\/[^\s]*\/wp-admin[^\s]*/gi;
const HOSTING_KEYWORDS = ['siteground', 'cloudways', 'hostinger', 'bluehost', 'namecheap', 'godaddy', 'digitalocean', 'aws', 'vercel', 'netlify', 'cloudflare', 'heroku', 'railway', 'render', 'flyio', 'fly.io', 'linode', 'vultr', 'ovh', 'hetzner', 'wpengine', 'kinsta', 'a2hosting'];

function normalizeUrl(url: string): string {
  let u = url.trim().replace(/[,;|'"<>)}\]]+$/, '');
  if (u && !u.match(/^https?:\/\//i)) u = 'https://' + u;
  return u;
}

function extractDomain(url: string): string {
  try {
    const u = new URL(normalizeUrl(url));
    return u.hostname.replace(/^www\./, '');
  } catch { return url; }
}

function titleFromDomain(domain: string): string {
  const parts = domain.split('.');
  if (parts.length >= 2) {
    return parts.slice(0, -1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }
  return domain;
}

interface ParsedItem {
  type: ImportTarget;
  data: Record<string, any>;
  confidence: number;
  source: string;
}

function smartParse(rawText: string): ParsedItem[] {
  const items: ParsedItem[] = [];

  // Try CSV/TSV first
  const csvResult = tryParseStructured(rawText);
  if (csvResult.length > 0) return csvResult;

  // Try JSON
  try {
    const json = JSON.parse(rawText);
    const arr = Array.isArray(json) ? json : [json];
    return arr.map(obj => detectTypeFromObject(obj)).filter(Boolean) as ParsedItem[];
  } catch { /* not JSON */ }

  // Intelligent line-by-line / block parsing
  // Use raw lines (including empty) for block splitting
  const rawLines = rawText.split('\n').map(l => l.trim());
  let currentBlock: string[] = [];
  const blocks: string[][] = [];

  for (const line of rawLines) {
    if (line === '' || line === '---' || line === '===') {
      if (currentBlock.length > 0) blocks.push([...currentBlock]);
      currentBlock = [];
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) blocks.push(currentBlock);

  const lines = rawLines.filter(Boolean);

  // If only one block, try to parse each line as individual items
  if (blocks.length === 1 && blocks[0].length > 1) {
    // Check if each line is a URL
    const allUrls = blocks[0].every(l => URL_REGEX.test(l));
    if (allUrls) {
      return blocks[0].map(line => {
        URL_REGEX.lastIndex = 0;
        const url = normalizeUrl(line);
        const domain = extractDomain(url);
        const isWpAdmin = /\/wp-admin/i.test(url);
        if (isWpAdmin) {
          return {
            type: 'websites' as ImportTarget,
            data: { name: titleFromDomain(domain), url: url.replace(/\/wp-admin.*/, ''), wpAdminUrl: url },
            confidence: 0.9,
            source: line,
          };
        }
        return {
          type: 'websites' as ImportTarget,
          data: { name: titleFromDomain(domain), url },
          confidence: 0.8,
          source: line,
        };
      });
    }

    // Try parsing as key:value blocks separated by blank lines
    // Fall through to block parsing
    blocks.length = 0;
    // Re-split with blank line separation
    let blk: string[] = [];
    for (const line of lines) {
      if (line === '') {
        if (blk.length) blocks.push([...blk]);
        blk = [];
      } else {
        blk.push(line);
      }
    }
    if (blk.length) blocks.push(blk);
    if (blocks.length <= 1) {
      // All lines in one block – parse as grouped data
      const parsed = parseDataBlock(lines);
      if (parsed) items.push(parsed);
      if (items.length === 0) {
        // Last resort: each line is a separate item
        for (const line of lines) {
          const item = parseSingleLine(line);
          if (item) items.push(item);
        }
      }
      return items;
    }
  }

  // Parse each block
  for (const block of blocks) {
    const parsed = parseDataBlock(block);
    if (parsed) items.push(parsed);
  }

  return items;
}

function tryParseStructured(text: string): ParsedItem[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  // Detect delimiter
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.split('\t').length > firstLine.split(',').length) delimiter = '\t';
  else if (firstLine.split('|').length > firstLine.split(',').length) delimiter = '|';
  else if (firstLine.split(';').length > firstLine.split(',').length) delimiter = ';';

  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

  if (headers.length < 2) return [];

  // Check if first line looks like headers
  const isHeaders = headers.some(h =>
    ['name', 'url', 'title', 'website', 'domain', 'site', 'link', 'username', 'password', 'service', 'label', 'email', 'amount', 'priority', 'status', 'description', 'category'].includes(h)
  );

  if (!isHeaders) return [];

  const rows = lines.slice(1).map(line => {
    const vals = line.match(/(?:"([^"]*(?:""[^"]*)*)"|([^,\t|;]*))/g) || line.split(delimiter);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (vals[i] || '').trim().replace(/^["']|["']$/g, '').replace(/""/g, '"');
    });
    return obj;
  }).filter(row => Object.values(row).some(v => v));

  return rows.map(row => detectTypeFromObject(row)).filter(Boolean) as ParsedItem[];
}

function detectTypeFromObject(obj: Record<string, any>): ParsedItem | null {
  const keys = Object.keys(obj).map(k => k.toLowerCase());
  const vals = Object.values(obj).map(v => String(v || ''));
  const allText = [...keys, ...vals].join(' ').toLowerCase();

  // Score each type
  let bestType: ImportTarget = 'websites';
  let bestScore = 0;

  const scoring: Record<ImportTarget, string[]> = {
    websites: ['url', 'website', 'domain', 'wp', 'wpadmin', 'hosting', 'plugins', 'wordpress', 'site'],
    credentials: ['password', 'username', 'secret', 'apikey', 'api_key', 'token', 'credential', 'login', 'service'],
    tasks: ['task', 'todo', 'priority', 'duedate', 'due_date', 'assignee', 'subtask', 'status'],
    links: ['link', 'bookmark', 'pinned', 'href'],
    repos: ['repo', 'github', 'stars', 'forks', 'language', 'repository', 'git'],
    buildProjects: ['platform', 'deployed', 'techstack', 'tech_stack', 'build', 'project'],
    payments: ['amount', 'payment', 'invoice', 'currency', 'price', 'cost', 'expense', 'income', 'subscription'],
    notes: ['note', 'content', 'memo', 'color'],
  };

  for (const [type, keywords] of Object.entries(scoring)) {
    const score = keywords.reduce((s, kw) => s + (allText.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; bestType = type as ImportTarget; }
  }

  // If we have password/username fields with a URL, it's likely credentials
  if ((keys.includes('password') || keys.includes('username')) && (keys.includes('url') || keys.includes('service'))) {
    bestType = 'credentials';
  }

  // Map object keys to target fields
  const info = targetLabels[bestType];
  const allFields = [...info.requiredFields, ...info.optionalFields];
  const mapped: Record<string, any> = {};

  for (const field of allFields) {
    // Direct match
    const directKey = keys.find(k => k === field.toLowerCase());
    if (directKey) {
      mapped[field] = obj[Object.keys(obj).find(k => k.toLowerCase() === directKey)!];
      continue;
    }
    // Fuzzy match
    const fuzzyKey = Object.keys(obj).find(k =>
      k.toLowerCase().replace(/[_\s-]/g, '').includes(field.toLowerCase().replace(/[_\s-]/g, '')) ||
      field.toLowerCase().replace(/[_\s-]/g, '').includes(k.toLowerCase().replace(/[_\s-]/g, ''))
    );
    if (fuzzyKey) mapped[field] = obj[fuzzyKey];
  }

  // Try to fill required fields from available data
  if (bestType === 'websites') {
    if (!mapped.name && mapped.url) mapped.name = titleFromDomain(extractDomain(mapped.url));
    if (!mapped.url) {
      const urlVal = vals.find(v => URL_REGEX.test(v));
      if (urlVal) { URL_REGEX.lastIndex = 0; mapped.url = normalizeUrl(urlVal); }
    }
    if (!mapped.name && mapped.url) mapped.name = titleFromDomain(extractDomain(mapped.url));
  }
  if (bestType === 'credentials') {
    if (!mapped.label && mapped.service) mapped.label = mapped.service;
    if (!mapped.service && mapped.label) mapped.service = mapped.label;
    if (!mapped.label) {
      const urlVal = vals.find(v => URL_REGEX.test(v));
      if (urlVal) mapped.label = titleFromDomain(extractDomain(urlVal));
      if (!mapped.service) mapped.service = mapped.label || 'Unknown';
    }
  }

  const hasRequired = info.requiredFields.every(f => mapped[f]);
  if (!hasRequired && bestScore < 1) return null;

  return {
    type: bestType,
    data: mapped,
    confidence: Math.min(bestScore / 3, 1),
    source: JSON.stringify(obj).slice(0, 80),
  };
}

function parseDataBlock(lines: string[]): ParsedItem | null {
  const kvPairs: Record<string, string> = {};
  const urls: string[] = [];
  const plainLines: string[] = [];

  for (const line of lines) {
    // Key: Value pattern
    const kvMatch = line.match(/^([^:=]+)\s*[:=]\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim().toLowerCase().replace(/[_\s-]+/g, '');
      kvPairs[key] = kvMatch[2].trim();
      continue;
    }
    // URL on its own
    URL_REGEX.lastIndex = 0;
    const urlMatch = line.match(URL_REGEX);
    if (urlMatch) {
      urls.push(...urlMatch.map(normalizeUrl));
      // If there's text before the URL, it might be a label
      const before = line.replace(URL_REGEX, '').trim().replace(/[-–—:|,;]+$/, '').trim();
      if (before) plainLines.push(before);
      continue;
    }
    plainLines.push(line);
  }

  if (Object.keys(kvPairs).length === 0 && urls.length === 0) {
    // Just plain text lines
    if (plainLines.length === 1) return parseSingleLine(plainLines[0]);
    return null;
  }

  // Determine type from kvPairs
  const allText = [...Object.keys(kvPairs), ...Object.values(kvPairs), ...urls].join(' ').toLowerCase();
  const hasPassword = Object.keys(kvPairs).some(k => k.includes('pass') || k.includes('pwd') || k.includes('secret'));
  const hasUsername = Object.keys(kvPairs).some(k => k.includes('user') || k.includes('login') || k.includes('email') || k.includes('account'));
  const hasAmount = Object.keys(kvPairs).some(k => k.includes('amount') || k.includes('price') || k.includes('cost'));
  const hasWpAdmin = urls.some(u => /\/wp-admin/i.test(u));
  const hasHosting = HOSTING_KEYWORDS.some(h => allText.includes(h));

  let type: ImportTarget = 'websites';
  if (hasPassword || hasUsername) {
    type = urls.length > 0 || hasHosting || hasWpAdmin ? 'websites' : 'credentials';
  }
  if (hasAmount) type = 'payments';
  if (allText.includes('task') || allText.includes('todo') || allText.includes('priority')) type = 'tasks';

  const data: Record<string, any> = {};

  // Smart field mapping from kvPairs
  const fieldAliases: Record<string, string[]> = {
    name: ['name', 'sitename', 'site', 'website', 'domain', 'title', 'label'],
    url: ['url', 'website', 'site', 'domain', 'link', 'href', 'address', 'siteurl', 'websiteurl'],
    wpAdminUrl: ['wpadmin', 'wpadminurl', 'admin', 'adminurl', 'wordpressadmin', 'wplogin'],
    wpUsername: ['wpuser', 'wpusername', 'wordpressuser', 'wordpressusername', 'wplogin'],
    wpPassword: ['wppass', 'wppassword', 'wordpresspass', 'wordpresspassword'],
    hostingProvider: ['hosting', 'host', 'provider', 'hostingprovider', 'server'],
    hostingLoginUrl: ['hostingurl', 'hostinglogin', 'hostingloginurl', 'cpanel', 'cpanelurl'],
    hostingUsername: ['hostinguser', 'hostingusername', 'cpaneluser'],
    hostingPassword: ['hostingpass', 'hostingpassword', 'cpanelpass'],
    username: ['user', 'username', 'login', 'email', 'account', 'userid'],
    password: ['pass', 'password', 'pwd', 'secret', 'passwd'],
    service: ['service', 'platform', 'app', 'application', 'provider', 'site'],
    label: ['label', 'name', 'title', 'description'],
    apiKey: ['apikey', 'api', 'token', 'accesstoken', 'key', 'secret', 'secretkey'],
    category: ['category', 'cat', 'type', 'group', 'folder', 'tag'],
    notes: ['notes', 'note', 'description', 'desc', 'comment', 'comments', 'info', 'details'],
    title: ['title', 'name', 'subject', 'heading'],
    amount: ['amount', 'price', 'cost', 'total', 'sum', 'value'],
    priority: ['priority', 'importance', 'urgency', 'level'],
    status: ['status', 'state', 'progress'],
    dueDate: ['duedate', 'due', 'deadline', 'date', 'duedate'],
  };

  for (const [field, aliases] of Object.entries(fieldAliases)) {
    for (const alias of aliases) {
      if (kvPairs[alias] !== undefined && !data[field]) {
        data[field] = kvPairs[alias];
        break;
      }
    }
  }

  // Assign URLs intelligently
  if (type === 'websites') {
    const wpAdminUrls = urls.filter(u => /\/wp-admin/i.test(u));
    const hostingUrls = urls.filter(u => HOSTING_KEYWORDS.some(h => u.toLowerCase().includes(h)));
    const regularUrls = urls.filter(u => !wpAdminUrls.includes(u) && !hostingUrls.includes(u));

    if (!data.url && regularUrls.length > 0) data.url = regularUrls[0];
    if (!data.url && urls.length > 0) data.url = urls[0].replace(/\/wp-admin.*/, '');
    if (!data.wpAdminUrl && wpAdminUrls.length > 0) data.wpAdminUrl = wpAdminUrls[0];
    if (!data.hostingLoginUrl && hostingUrls.length > 0) data.hostingLoginUrl = hostingUrls[0];

    // Auto-detect hosting provider
    if (!data.hostingProvider) {
      for (const url of [...hostingUrls, ...urls]) {
        const found = HOSTING_KEYWORDS.find(h => url.toLowerCase().includes(h));
        if (found) { data.hostingProvider = found.charAt(0).toUpperCase() + found.slice(1); break; }
      }
    }
    if (!data.name && data.url) data.name = titleFromDomain(extractDomain(data.url));
  }

  if (type === 'credentials') {
    if (!data.url && urls.length > 0) data.url = urls[0];
    if (!data.label) data.label = data.service || (data.url ? titleFromDomain(extractDomain(data.url)) : plainLines[0] || 'Unknown');
    if (!data.service) data.service = data.label;
  }

  if (!data.name && plainLines.length > 0) data.name = plainLines[0];
  if (!data.title && plainLines.length > 0) data.title = plainLines[0];

  return { type, data, confidence: Object.keys(data).length / 5, source: lines.join(' ').slice(0, 80) };
}

function parseSingleLine(line: string): ParsedItem | null {
  URL_REGEX.lastIndex = 0;
  const urlMatch = line.match(URL_REGEX);
  if (urlMatch) {
    const url = normalizeUrl(urlMatch[0]);
    const textBefore = line.slice(0, line.indexOf(urlMatch[0])).trim().replace(/[-–—:|,;]+$/, '').trim();
    const name = textBefore || titleFromDomain(extractDomain(url));
    const isWp = /\/wp-admin/i.test(url);
    return {
      type: 'websites',
      data: {
        name,
        url: isWp ? url.replace(/\/wp-admin.*/, '') : url,
        ...(isWp ? { wpAdminUrl: url } : {}),
      },
      confidence: 0.7,
      source: line.slice(0, 80),
    };
  }
  // Plain text = note or task
  if (line.length > 0) {
    return { type: 'notes', data: { title: line, content: '' }, confidence: 0.3, source: line.slice(0, 80) };
  }
  return null;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function BulkImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { bulkAddItems } = useDashboard();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pasteMode, setPasteMode] = useState(true);
  const [rawText, setRawText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [importCount, setImportCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setStep(1); setRawText(''); setParsedItems([]); setImportCount(0); setIsAnalyzing(false); setPasteMode(true); };

  const handleAnalyze = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    // Simulate brief analysis delay for UX
    await new Promise(r => setTimeout(r, 400));
    const items = smartParse(text);
    setParsedItems(items);
    setIsAnalyzing(false);
    if (items.length > 0) {
      setStep(2);
    } else {
      toast.error('Could not detect any importable data. Try a different format.');
    }
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawText(text);
      handleAnalyze(text);
    };
    reader.readAsText(file);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRawText(text);
      handleAnalyze(text);
    } catch {
      toast.error('Clipboard access denied. Please paste manually.');
    }
  };

  const updateItemType = (index: number, newType: ImportTarget) => {
    setParsedItems(prev => prev.map((item, i) => i === index ? { ...item, type: newType } : item));
  };

  const removeItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    const now = new Date().toISOString().split('T')[0];
    const grouped: Record<string, any[]> = {};

    for (const item of parsedItems) {
      if (!grouped[item.type]) grouped[item.type] = [];
      const d = item.data;

      if (item.type === 'websites') {
        grouped[item.type].push({
          name: d.name || 'Unnamed', url: normalizeUrl(d.url || ''),
          wpAdminUrl: d.wpAdminUrl ? normalizeUrl(d.wpAdminUrl) : '',
          wpUsername: d.wpUsername || '', wpPassword: d.wpPassword || '',
          hostingProvider: d.hostingProvider || '',
          hostingLoginUrl: d.hostingLoginUrl ? normalizeUrl(d.hostingLoginUrl) : '',
          hostingUsername: d.hostingUsername || '', hostingPassword: d.hostingPassword || '',
          category: d.category || 'Personal', status: d.status || 'active',
          notes: d.notes || '', plugins: Array.isArray(d.plugins) ? d.plugins : (d.plugins || '').split(',').map((s: string) => s.trim()).filter(Boolean),
          dateAdded: now, lastUpdated: now,
        });
      } else if (item.type === 'credentials') {
        grouped[item.type].push({
          label: d.label || d.service || 'Untitled',
          service: d.service || d.label || 'Unknown',
          url: d.url ? normalizeUrl(d.url) : '',
          username: d.username || d.email || '', password: d.password || '',
          apiKey: d.apiKey || '', notes: d.notes || '',
          category: d.category || 'Other', createdAt: now,
        });
      } else if (item.type === 'links') {
        grouped[item.type].push({
          title: d.title || d.name || 'Untitled',
          url: d.url ? normalizeUrl(d.url) : '',
          category: d.category || 'Other', status: d.status || 'active',
          description: d.description || '', dateAdded: now, pinned: d.pinned === 'true' || d.pinned === true,
        });
      } else if (item.type === 'tasks') {
        grouped[item.type].push({
          title: d.title || d.name || 'Untitled', priority: d.priority || 'medium',
          status: d.status || 'todo', dueDate: d.dueDate || now,
          category: d.category || 'General', description: d.description || '',
          linkedProject: d.linkedProject || '', subtasks: [], createdAt: now,
        });
      } else if (item.type === 'repos') {
        grouped[item.type].push({
          name: d.name || 'unnamed-repo', url: d.url ? normalizeUrl(d.url) : '',
          description: d.description || '', language: d.language || 'TypeScript',
          stars: parseInt(d.stars) || 0, forks: parseInt(d.forks) || 0,
          status: d.status || 'active', demoUrl: d.demoUrl || '',
          progress: parseInt(d.progress) || 0,
          topics: Array.isArray(d.topics) ? d.topics : (d.topics || '').split(',').map((s: string) => s.trim()).filter(Boolean),
          lastUpdated: now,
        });
      } else if (item.type === 'payments') {
        grouped[item.type].push({
          title: d.title || d.name || 'Untitled', amount: parseFloat(d.amount) || 0,
          currency: d.currency || 'USD', type: d.type || 'expense',
          status: d.status || 'pending', category: d.category || 'Other',
          from: d.from || '', to: d.to || '', dueDate: d.dueDate || now,
          paidDate: '', recurring: d.recurring === 'true' || d.recurring === true,
          recurringInterval: '', linkedProject: '', notes: d.notes || '', createdAt: now,
        });
      } else if (item.type === 'notes') {
        grouped[item.type].push({
          title: d.title || d.name || 'Untitled', content: d.content || '',
          color: d.color || 'blue', pinned: d.pinned === 'true' || d.pinned === true,
          tags: Array.isArray(d.tags) ? d.tags : (d.tags || '').split(',').map((s: string) => s.trim()).filter(Boolean),
          createdAt: now, updatedAt: now,
        });
      } else if (item.type === 'buildProjects') {
        grouped[item.type].push({
          name: d.name || 'Untitled', platform: d.platform || 'other',
          projectUrl: d.projectUrl || '', deployedUrl: d.deployedUrl || '',
          description: d.description || '',
          techStack: Array.isArray(d.techStack) ? d.techStack : (d.techStack || '').split(',').map((s: string) => s.trim()).filter(Boolean),
          status: d.status || 'ideation', startedDate: now, lastWorkedOn: now,
          nextSteps: d.nextSteps || '', githubRepo: d.githubRepo || '',
        });
      }
    }

    let total = 0;
    for (const [table, items] of Object.entries(grouped)) {
      await bulkAddItems(table, items);
      total += items.length;
    }
    setImportCount(total);
    setStep(3);
    toast.success(`Successfully imported ${total} items!`);
  };

  const typeIcon = (type: ImportTarget) => {
    const info = targetLabels[type];
    return <span className="text-sm">{info.emoji}</span>;
  };

  const typeCounts = parsedItems.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-md" />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative max-w-3xl w-full bg-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl max-h-[88vh] flex flex-col border border-border/40 overflow-hidden"
            onClick={(e) => e.stopPropagation()}>

            {/* Header with gradient accent */}
            <div className="relative px-6 py-5 border-b border-border/30">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent pointer-events-none" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                    {step === 3 ? <CheckCircle2 size={20} className="text-white" /> : <Wand2 size={20} className="text-white" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-card-foreground">
                      {step === 1 ? 'Smart Import' : step === 2 ? 'Review & Import' : 'Import Complete!'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {step === 1 ? 'Paste anything — we auto-detect everything' : step === 2 ? `${parsedItems.length} items detected` : `${importCount} items imported`}
                    </p>
                  </div>
                </div>
                <button onClick={() => { reset(); onClose(); }} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {step === 1 && (
                <div className="space-y-5">
                  {/* AI Feature Banner */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/8 via-accent/5 to-primary/3 border border-primary/10">
                    <Sparkles size={20} className="text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">Ultra-Smart Recognition</p>
                      <p className="text-xs text-muted-foreground">Paste URLs, credentials, CSV, JSON, or any format — we auto-detect websites, credentials, tasks, and more instantly.</p>
                    </div>
                  </div>

                  {/* Mode Tabs */}
                  <div className="flex gap-2">
                    <button onClick={() => setPasteMode(true)}
                      className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl text-sm font-semibold transition-all ${pasteMode ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>
                      <Clipboard size={16} /> Paste Data
                    </button>
                    <button onClick={() => setPasteMode(false)}
                      className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl text-sm font-semibold transition-all ${!pasteMode ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>
                      <Upload size={16} /> Upload File
                    </button>
                  </div>

                  {pasteMode ? (
                    <div className="space-y-3">
                      <textarea
                        value={rawText}
                        onChange={e => setRawText(e.target.value)}
                        placeholder={`Paste anything here! Examples:\n\n• Website URLs with credentials:\n  My Blog: https://myblog.com\n  Username: admin\n  Password: myp@ss\n\n• CSV data with headers\n• JSON arrays of objects\n• Lists of URLs\n• Key: Value pairs`}
                        rows={10}
                        className="w-full px-4 py-3.5 rounded-2xl bg-secondary/50 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none placeholder:text-muted-foreground/60 font-mono leading-relaxed border border-border/30"
                      />
                      <div className="flex gap-2">
                        <button onClick={handlePaste} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-all">
                          <Clipboard size={14} /> Paste from Clipboard
                        </button>
                        <button onClick={() => handleAnalyze(rawText)} disabled={!rawText.trim() || isAnalyzing}
                          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed">
                          {isAnalyzing ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
                          ) : (
                            <><Wand2 size={14} /> Analyze & Detect</>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div onClick={() => fileRef.current?.click()}
                        className="border-2 border-dashed border-border/40 rounded-2xl p-10 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/3 transition-all group">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-all group-hover:scale-105">
                          <Upload size={28} className="text-primary" />
                        </div>
                        <p className="text-sm text-card-foreground font-semibold">Click to upload or drag a file</p>
                        <p className="text-xs text-muted-foreground mt-1.5">Supports .csv, .json, .txt, .tsv files</p>
                      </div>
                      <input ref={fileRef} type="file" accept=".csv,.json,.txt,.tsv" onChange={handleFile} className="hidden" />
                    </div>
                  )}

                  {/* Quick Examples */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Website + Credentials', example: 'My Site: https://mysite.com\nWP Admin: https://mysite.com/wp-admin\nUsername: admin\nPassword: pass123\nHosting: SiteGround' },
                      { label: 'Multiple URLs', example: 'https://google.com\nhttps://github.com\nhttps://dribbble.com\nhttps://figma.com' },
                      { label: 'CSV Format', example: 'name,url,username,password\nBlog,https://blog.com,admin,pass1\nShop,https://shop.com,user,pass2' },
                      { label: 'Credentials', example: 'Service: GitHub\nURL: https://github.com\nUsername: myuser\nPassword: mypass\nAPI Key: ghp_xxx' },
                    ].map(ex => (
                      <button key={ex.label} onClick={() => { setRawText(ex.example); }}
                        className="text-left p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all border border-border/20 hover:border-primary/15 group">
                        <p className="text-xs font-semibold text-card-foreground group-hover:text-primary transition-colors">{ex.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate font-mono">{ex.example.split('\n')[0]}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  {/* Summary badges */}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(typeCounts).map(([type, count]) => (
                      <div key={type} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/50 text-xs font-semibold">
                        {typeIcon(type as ImportTarget)}
                        <span className="text-card-foreground">{count} {targetLabels[type as ImportTarget].label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Items list */}
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {parsedItems.map((item, i) => {
                      const info = targetLabels[item.type];
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                          className="flex items-start gap-3 p-3.5 rounded-2xl bg-secondary/30 border border-border/20 hover:border-primary/10 transition-all group">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${info.gradient} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm`}>
                            {info.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-card-foreground truncate">
                                {item.data.name || item.data.title || item.data.label || item.data.url || 'Untitled'}
                              </span>
                              <select value={item.type} onChange={e => updateItemType(i, e.target.value as ImportTarget)}
                                className="text-[10px] px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-semibold border-none outline-none cursor-pointer appearance-none">
                                {Object.entries(targetLabels).map(([k, v]) => (
                                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(item.data).filter(([, v]) => v).slice(0, 5).map(([key, val]) => (
                                <span key={key} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground truncate max-w-[140px]">
                                  <span className="font-medium text-secondary-foreground">{key}:</span> {String(val).slice(0, 30)}
                                </span>
                              ))}
                            </div>
                            {item.data.url && (
                              <a href={normalizeUrl(item.data.url)} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1">
                                <ExternalLink size={10} /> {extractDomain(item.data.url)}
                              </a>
                            )}
                          </div>
                          <button onClick={() => removeItem(i)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">
                            <X size={14} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="text-center py-10">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 200 }}>
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-5 shadow-xl shadow-emerald-500/20">
                      <CheckCircle2 size={40} className="text-white" />
                    </div>
                  </motion.div>
                  <h3 className="text-2xl font-bold text-card-foreground mb-2">All Done! 🎉</h3>
                  <p className="text-muted-foreground mb-1">Successfully imported {importCount} items</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {Object.entries(typeCounts).map(([type, count]) => (
                      <span key={type} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                        {targetLabels[type as ImportTarget].emoji} {count} {targetLabels[type as ImportTarget].label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/30 bg-secondary/10">
              <div className="text-xs text-muted-foreground">
                {step === 2 && <span>Click a type badge to reclassify items</span>}
              </div>
              <div className="flex items-center gap-2">
                {step === 1 && (
                  <button onClick={() => { reset(); onClose(); }}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all">
                    Cancel
                  </button>
                )}
                {step === 2 && (
                  <>
                    <button onClick={() => { setStep(1); setParsedItems([]); }}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all">
                      Back
                    </button>
                    <button onClick={handleImport}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/25">
                      <Sparkles size={14} /> Import {parsedItems.length} Items
                    </button>
                  </>
                )}
                {step === 3 && (
                  <button onClick={() => { reset(); onClose(); }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:opacity-90 transition-all shadow-lg shadow-emerald-500/25">
                    <CheckCircle2 size={14} /> Done
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
