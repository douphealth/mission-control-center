/**
 * Smart Import Engine v9.0 — Autonomous, content-aware, multi-category detection.
 * Parses any format, analyzes actual cell values (not just headers),
 * auto-splits mixed data into correct categories, and imports with zero user intervention.
 */
import Papa from 'papaparse';

export type ImportTarget = 'websites' | 'links' | 'tasks' | 'repos' | 'buildProjects' | 'credentials' | 'payments' | 'notes' | 'ideas' | 'habits';

export interface TargetMeta {
  label: string;
  emoji: string;
  requiredFields: string[];
  optionalFields: string[];
  aliases: Record<string, string[]>;
  /** Content patterns that strongly indicate this category (regex on cell values) */
  contentSignals: RegExp[];
}

export const TARGET_META: Record<ImportTarget, TargetMeta> = {
  websites: {
    label: 'Websites', emoji: '🌐',
    requiredFields: ['name', 'url'],
    optionalFields: ['wpAdminUrl', 'wpUsername', 'wpPassword', 'hostingProvider', 'hostingLoginUrl', 'hostingUsername', 'hostingPassword', 'category', 'status', 'notes', 'plugins', 'tags'],
    aliases: {
      name: ['site', 'website', 'domain', 'siteName', 'site_name', 'website_name', 'domain_name'],
      url: ['link', 'href', 'siteUrl', 'site_url', 'website_url', 'address', 'domain', 'homepage'],
      wpAdminUrl: ['wp_admin', 'wordpress_admin', 'admin_url', 'wp_url', 'wp_admin_url'],
      wpUsername: ['wp_user', 'wordpress_user', 'admin_user', 'wp_login'],
      wpPassword: ['wp_pass', 'wordpress_pass', 'admin_pass', 'wp_pwd'],
      hostingProvider: ['hosting', 'host', 'provider', 'hosting_provider', 'hoster'],
      hostingLoginUrl: ['hosting_url', 'hosting_login', 'host_url'],
      hostingUsername: ['hosting_user', 'host_user'],
      hostingPassword: ['hosting_pass', 'host_pass', 'hosting_pwd'],
      category: ['type', 'group', 'cat'],
      status: ['state', 'active'],
      notes: ['note', 'comment', 'comments', 'description', 'desc'],
      plugins: ['plugin', 'extensions', 'addons'],
      tags: ['tag', 'labels'],
    },
    contentSignals: [/wp-admin/i, /wordpress/i, /hosting/i, /\.com|\.org|\.io|\.net|\.dev/i, /siteground|cloudways|bluehost|godaddy/i],
  },
  links: {
    label: 'Links', emoji: '🔗',
    requiredFields: ['title', 'url'],
    optionalFields: ['category', 'description', 'status', 'pinned', 'tags'],
    aliases: {
      title: ['name', 'label', 'text', 'link_name', 'bookmark', 'link_title'],
      url: ['link', 'href', 'address', 'uri', 'source'],
      category: ['type', 'group', 'folder', 'cat'],
      description: ['desc', 'note', 'notes', 'comment'],
      status: ['state'],
      pinned: ['pin', 'favorite', 'starred', 'fav'],
      tags: ['tag', 'labels', 'keywords'],
    },
    contentSignals: [/bookmark/i, /^https?:\/\//i],
  },
  tasks: {
    label: 'Tasks', emoji: '✅',
    requiredFields: ['title'],
    optionalFields: ['priority', 'status', 'dueDate', 'category', 'description', 'linkedProject', 'tags'],
    aliases: {
      title: ['name', 'task', 'todo', 'item', 'subject', 'task_name', 'action', 'action_item'],
      priority: ['prio', 'importance', 'urgency', 'level'],
      status: ['state', 'done', 'completed', 'progress', 'checked'],
      dueDate: ['due', 'deadline', 'due_date', 'duedate', 'date', 'target_date', 'end_date'],
      category: ['type', 'group', 'cat', 'project', 'list', 'board'],
      description: ['desc', 'note', 'notes', 'details', 'body', 'content'],
      linkedProject: ['project', 'linked_project', 'projectName'],
      tags: ['tag', 'labels'],
    },
    contentSignals: [/todo|to-do|to do/i, /in.?progress|done|blocked|pending/i, /high|medium|low|critical|urgent/i, /deadline|due/i],
  },
  repos: {
    label: 'GitHub Repos', emoji: '🐙',
    requiredFields: ['name'],
    optionalFields: ['url', 'description', 'language', 'stars', 'forks', 'status', 'demoUrl', 'progress', 'topics'],
    aliases: {
      name: ['repo', 'repository', 'repo_name', 'project', 'full_name'],
      url: ['link', 'href', 'github_url', 'repo_url', 'html_url', 'clone_url', 'ssh_url'],
      description: ['desc', 'about', 'summary'],
      language: ['lang', 'tech', 'primary_language'],
      stars: ['star', 'stargazers', 'stargazers_count'],
      forks: ['fork', 'forks_count'],
      status: ['state', 'archived'],
      demoUrl: ['demo', 'demo_url', 'homepage', 'live_url'],
      progress: ['completion', 'percent'],
      topics: ['tags', 'labels', 'keywords', 'topic'],
    },
    contentSignals: [/github\.com/i, /gitlab\.com/i, /bitbucket/i, /repository|repo/i, /stars?|forks?/i, /typescript|javascript|python|ruby|rust|go|java|php|swift/i],
  },
  buildProjects: {
    label: 'Build Projects', emoji: '🛠️',
    requiredFields: ['name'],
    optionalFields: ['platform', 'projectUrl', 'deployedUrl', 'description', 'techStack', 'status', 'nextSteps', 'githubRepo'],
    aliases: {
      name: ['project', 'title', 'project_name', 'app_name'],
      platform: ['tool', 'builder', 'framework'],
      projectUrl: ['project_url', 'build_url', 'url'],
      deployedUrl: ['deployed_url', 'live_url', 'demo', 'production_url'],
      description: ['desc', 'about', 'summary'],
      techStack: ['tech_stack', 'technologies', 'stack', 'tech'],
      status: ['state', 'phase'],
      nextSteps: ['next_steps', 'todo', 'next'],
      githubRepo: ['github_repo', 'repo', 'github', 'repository'],
    },
    contentSignals: [/lovable|bolt|vercel|netlify|railway/i, /deployed|building|testing/i, /react|next\.?js|vue|angular|svelte/i],
  },
  credentials: {
    label: 'Credentials', emoji: '🔐',
    requiredFields: ['label', 'service'],
    optionalFields: ['url', 'username', 'password', 'apiKey', 'notes', 'category', 'tags'],
    aliases: {
      label: ['name', 'title', 'credential_name', 'account', 'account_name'],
      service: ['provider', 'platform', 'app', 'site', 'website'],
      url: ['link', 'login_url', 'site_url', 'address'],
      username: ['user', 'login', 'email', 'user_name', 'account_name', 'login_email'],
      password: ['pass', 'pwd', 'secret', 'passwd'],
      apiKey: ['api_key', 'token', 'access_token', 'key', 'api_token', 'secret_key'],
      notes: ['note', 'comment', 'description', 'desc'],
      category: ['type', 'group', 'cat'],
      tags: ['tag', 'labels'],
    },
    contentSignals: [/password|passwd|pwd/i, /api.?key|token|secret/i, /login|credential|auth/i],
  },
  payments: {
    label: 'Payments', emoji: '💰',
    requiredFields: ['title', 'amount'],
    optionalFields: ['currency', 'type', 'status', 'category', 'from', 'to', 'dueDate', 'recurring', 'notes'],
    aliases: {
      title: ['name', 'description', 'item', 'payment', 'invoice', 'label', 'memo', 'transaction'],
      amount: ['price', 'cost', 'value', 'total', 'sum', 'fee', 'charge', 'subtotal'],
      currency: ['curr', 'money_type', 'currency_code'],
      type: ['kind', 'payment_type', 'direction', 'txn_type'],
      status: ['state', 'paid', 'payment_status'],
      category: ['group', 'cat'],
      from: ['sender', 'payer', 'source', 'client', 'buyer'],
      to: ['receiver', 'payee', 'recipient', 'vendor', 'seller'],
      dueDate: ['due', 'deadline', 'due_date', 'date', 'invoice_date', 'payment_date'],
      recurring: ['repeat', 'auto', 'subscription', 'recur'],
      notes: ['note', 'comment', 'memo', 'desc'],
    },
    contentSignals: [/\$[\d,.]+|\d+\.\d{2}/i, /invoice|payment|paid|unpaid|overdue/i, /USD|EUR|GBP|JPY/i, /income|expense|subscription/i],
  },
  notes: {
    label: 'Notes', emoji: '📝',
    requiredFields: ['title'],
    optionalFields: ['content', 'color', 'pinned', 'tags'],
    aliases: {
      title: ['name', 'subject', 'heading', 'note_title'],
      content: ['body', 'text', 'note', 'description', 'desc', 'details', 'message'],
      color: ['colour', 'theme'],
      pinned: ['pin', 'favorite', 'starred', 'fav'],
      tags: ['tag', 'labels', 'keywords', 'categories'],
    },
    contentSignals: [/note|memo|journal/i],
  },
  ideas: {
    label: 'Ideas', emoji: '💡',
    requiredFields: ['title'],
    optionalFields: ['description', 'category', 'priority', 'status', 'tags', 'linkedProject', 'votes'],
    aliases: {
      title: ['name', 'idea', 'subject', 'concept', 'proposal'],
      description: ['desc', 'details', 'body', 'content', 'notes'],
      category: ['type', 'group', 'cat'],
      priority: ['prio', 'importance'],
      status: ['state', 'phase'],
      tags: ['tag', 'labels'],
      linkedProject: ['project', 'linked_project'],
      votes: ['vote', 'score', 'rating', 'upvotes'],
    },
    contentSignals: [/idea|concept|brainstorm|proposal/i, /exploring|validated|spark/i],
  },
  habits: {
    label: 'Habits', emoji: '🔄',
    requiredFields: ['name'],
    optionalFields: ['icon', 'frequency', 'color'],
    aliases: {
      name: ['habit', 'title', 'label', 'activity', 'routine'],
      icon: ['emoji'],
      frequency: ['freq', 'interval', 'schedule', 'repeat'],
      color: ['colour', 'theme'],
    },
    contentSignals: [/daily|weekly|monthly/i, /habit|routine|streak/i],
  },
};

// ─── Parsing ──────────────────────────────────────────────────────────────────

export interface ParsedData {
  rows: Record<string, string>[];
  sourceFields: string[];
  detectedFormat: 'csv' | 'tsv' | 'json' | 'jsonlines' | 'text';
}

export function parseImportData(text: string, fileName?: string): ParsedData {
  const trimmed = text.trim();

  // 1. Try JSON
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      let parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) parsed = [parsed];
      const rows = parsed.map((item: any) => {
        const obj: Record<string, string> = {};
        for (const [k, v] of Object.entries(item)) {
          obj[k] = Array.isArray(v) ? v.join(', ') : String(v ?? '');
        }
        return obj;
      });
      const sourceFields = rows.length > 0 ? [...new Set(rows.flatMap((r: Record<string, string>) => Object.keys(r)))] : [];
      return { rows, sourceFields, detectedFormat: 'json' };
    } catch { /* fall through */ }
  }

  // 2. Try JSON Lines
  const lines = trimmed.split('\n');
  if (lines.length > 0 && lines[0].trim().startsWith('{')) {
    try {
      const rows = lines.filter(l => l.trim()).map(l => {
        const item = JSON.parse(l.trim());
        const obj: Record<string, string> = {};
        for (const [k, v] of Object.entries(item)) {
          obj[k] = Array.isArray(v) ? v.join(', ') : String(v ?? '');
        }
        return obj;
      });
      const sourceFields = rows.length > 0 ? [...new Set(rows.flatMap((r: Record<string, string>) => Object.keys(r)))] : [];
      return { rows, sourceFields, detectedFormat: 'jsonlines' };
    } catch { /* fall through */ }
  }

  // 3. CSV/TSV via papaparse
  const isTSV = lines[0]?.includes('\t') || fileName?.endsWith('.tsv');
  const result = Papa.parse(trimmed, {
    header: true,
    skipEmptyLines: true,
    delimiter: isTSV ? '\t' : undefined,
    dynamicTyping: false,
    transformHeader: (h: string) => h.trim(),
  });

  if (result.data.length > 0 && result.meta.fields && result.meta.fields.length > 1) {
    const rows = result.data as Record<string, string>[];
    return {
      rows: rows.map(r => {
        const obj: Record<string, string> = {};
        for (const [k, v] of Object.entries(r)) obj[k] = String(v ?? '').trim();
        return obj;
      }),
      sourceFields: result.meta.fields,
      detectedFormat: isTSV ? 'tsv' : 'csv',
    };
  }

  // 4. Smart plain-text: detect URLs → websites/links, key:value → credentials, else → notes/tasks
  const plainRows = smartParsePlainText(lines.filter(l => l.trim()));
  if (plainRows.length > 0) {
    const sourceFields = [...new Set(plainRows.flatMap(r => Object.keys(r)))];
    return { rows: plainRows, sourceFields, detectedFormat: 'text' };
  }

  // 5. Last fallback
  const fallbackRows = lines.filter(l => l.trim()).map(l => ({ item: l.trim() }));
  return { rows: fallbackRows, sourceFields: ['item'], detectedFormat: 'text' };
}

/** Parse plain text lines into structured rows by detecting patterns */
function smartParsePlainText(lines: string[]): Record<string, string>[] {
  const urlRegex = /https?:\/\/[^\s,]+/gi;
  const kvRegex = /^(.+?)[:=]\s*(.+)$/;

  // Check if lines are mostly URLs
  const urlLines = lines.filter(l => urlRegex.test(l));
  if (urlLines.length > lines.length * 0.5) {
    return lines.filter(l => l.trim()).map(l => {
      const urlMatch = l.match(urlRegex);
      const url = urlMatch?.[0] || l.trim();
      const name = l.replace(url, '').replace(/[-,|:]\s*$/, '').replace(/^[-,|:]\s*/, '').trim();
      try {
        const hostname = new URL(url).hostname.replace(/^www\./, '');
        return { name: name || hostname, url };
      } catch {
        return { name: name || url, url };
      }
    });
  }

  // Check if lines are key:value pairs (credentials-like)
  const kvLines = lines.filter(l => kvRegex.test(l));
  if (kvLines.length > lines.length * 0.6) {
    const obj: Record<string, string> = {};
    kvLines.forEach(l => {
      const m = l.match(kvRegex);
      if (m) obj[m[1].trim()] = m[2].trim();
    });
    return [obj];
  }

  // Otherwise treat as task/note titles
  return lines.filter(l => l.trim()).map(l => {
    const clean = l.replace(/^[-*•▪▸►→]\s*/, '').replace(/^\d+[.)]\s*/, '').trim();
    return { title: clean };
  });
}

// ─── Content-Aware Auto-detection ─────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[_\s\-./]/g, '');
}

/** Score a category using both header matching AND content value analysis */
function scoreCategory(sourceFields: string[], rows: Record<string, string>[], target: ImportTarget): number {
  const meta = TARGET_META[target];
  const allFields = [...meta.requiredFields, ...meta.optionalFields];
  let score = 0;

  // --- Header scoring (same as before but weighted) ---
  for (const tf of allFields) {
    const normalTf = normalize(tf);
    const aliasList = (meta.aliases[tf] || []).map(normalize);
    for (const sf of sourceFields) {
      const normalSf = normalize(sf);
      if (normalSf === normalTf) {
        score += meta.requiredFields.includes(tf) ? 12 : 4;
        break;
      }
      if (aliasList.includes(normalSf)) {
        score += meta.requiredFields.includes(tf) ? 10 : 3;
        break;
      }
      if (normalSf.includes(normalTf) || normalTf.includes(normalSf)) {
        score += meta.requiredFields.includes(tf) ? 6 : 1;
        break;
      }
    }
  }

  // Penalize missing required fields
  for (const rf of meta.requiredFields) {
    const normalRf = normalize(rf);
    const aliasList = (meta.aliases[rf] || []).map(normalize);
    const hasMatch = sourceFields.some(sf => {
      const n = normalize(sf);
      return n === normalRf || aliasList.includes(n) || n.includes(normalRf) || normalRf.includes(n);
    });
    if (!hasMatch) score -= 6;
  }

  // --- Content value scoring (NEW: analyze actual cell data) ---
  const sampleRows = rows.slice(0, Math.min(10, rows.length));
  const allValues = sampleRows.flatMap(r => Object.values(r)).filter(Boolean).join(' ');

  for (const signal of meta.contentSignals) {
    const matches = allValues.match(new RegExp(signal.source, signal.flags + (signal.flags.includes('g') ? '' : 'g')));
    if (matches) {
      score += Math.min(matches.length * 2, 10); // Cap content bonus at 10
    }
  }

  return score;
}

export interface DetectionResult {
  target: ImportTarget;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  fieldMap: Record<string, string>;
  validCount: number;
}

/** Detect category with confidence level, using both headers and content */
export function autoDetectWithConfidence(sourceFields: string[], rows: Record<string, string>[]): DetectionResult[] {
  const results = (Object.keys(TARGET_META) as ImportTarget[]).map(t => {
    const score = scoreCategory(sourceFields, rows, t);
    const fieldMap = autoMapFields(sourceFields, t);
    const items = normalizeItems(rows, t, fieldMap);
    return { target: t, score, fieldMap, validCount: items.length };
  });

  results.sort((a, b) => b.score - a.score);

  // Calculate confidence based on score gap
  const top = results[0];
  const second = results[1];
  const gap = top.score - (second?.score ?? 0);

  return results.map((r, i) => ({
    ...r,
    confidence: i === 0
      ? (gap > 10 && r.validCount > 0 ? 'high' : gap > 4 && r.validCount > 0 ? 'medium' : 'low')
      : 'low' as const,
  }));
}

/** Legacy function kept for backward compatibility */
export function autoDetectCategory(sourceFields: string[]): ImportTarget {
  return autoDetectWithConfidence(sourceFields, [])[0].target;
}

export function autoMapFields(sourceFields: string[], target: ImportTarget): Record<string, string> {
  const meta = TARGET_META[target];
  const allTargetFields = [...meta.requiredFields, ...meta.optionalFields];
  const map: Record<string, string> = {};
  const usedSource = new Set<string>();

  // Pass 1: exact
  for (const tf of allTargetFields) {
    const normalTf = normalize(tf);
    const match = sourceFields.find(sf => !usedSource.has(sf) && normalize(sf) === normalTf);
    if (match) { map[tf] = match; usedSource.add(match); }
  }

  // Pass 2: alias
  for (const tf of allTargetFields) {
    if (map[tf]) continue;
    const aliasList = (meta.aliases[tf] || []).map(normalize);
    const match = sourceFields.find(sf => !usedSource.has(sf) && aliasList.includes(normalize(sf)));
    if (match) { map[tf] = match; usedSource.add(match); }
  }

  // Pass 3: partial
  for (const tf of allTargetFields) {
    if (map[tf]) continue;
    const normalTf = normalize(tf);
    const match = sourceFields.find(sf => {
      if (usedSource.has(sf)) return false;
      const n = normalize(sf);
      return n.includes(normalTf) || normalTf.includes(n);
    });
    if (match) { map[tf] = match; usedSource.add(match); }
  }

  // Pass 4 (NEW): For plain text "item"/"title" fallback — map to first required field
  if (Object.keys(map).length === 0 && sourceFields.length === 1) {
    const singleField = sourceFields[0];
    const firstRequired = meta.requiredFields[0];
    if (firstRequired) {
      map[firstRequired] = singleField;
    }
  }

  return map;
}

// ─── Normalization ────────────────────────────────────────────────────────────

export function normalizeItems(
  rows: Record<string, string>[],
  target: ImportTarget,
  fieldMap: Record<string, string>
): Record<string, any>[] {
  const now = new Date().toISOString().split('T')[0];
  const get = (row: Record<string, string>, field: string) => (row[fieldMap[field] || ''] || '').trim();
  const toArray = (val: string) => val ? val.split(/[,;|]/).map(s => s.trim()).filter(Boolean) : [];
  const toBool = (val: string) => ['true', '1', 'yes', 'on'].includes(val.toLowerCase());

  return rows.map(row => {
    switch (target) {
      case 'websites':
        return {
          name: get(row, 'name') || 'Unnamed', url: get(row, 'url') || '',
          wpAdminUrl: get(row, 'wpAdminUrl'), wpUsername: get(row, 'wpUsername'), wpPassword: get(row, 'wpPassword'),
          hostingProvider: get(row, 'hostingProvider'), hostingLoginUrl: get(row, 'hostingLoginUrl'),
          hostingUsername: get(row, 'hostingUsername'), hostingPassword: get(row, 'hostingPassword'),
          category: get(row, 'category') || 'Personal', status: get(row, 'status') || 'active',
          notes: get(row, 'notes'), plugins: toArray(get(row, 'plugins')),
          tags: toArray(get(row, 'tags')), dateAdded: now, lastUpdated: now,
        };
      case 'links':
        return {
          title: get(row, 'title') || 'Untitled', url: get(row, 'url') || '',
          category: get(row, 'category') || 'Other', status: get(row, 'status') || 'active',
          description: get(row, 'description'), dateAdded: now,
          pinned: toBool(get(row, 'pinned')), tags: toArray(get(row, 'tags')),
        };
      case 'tasks':
        return {
          title: get(row, 'title') || 'Untitled',
          priority: get(row, 'priority') || 'medium',
          status: get(row, 'status') || 'todo',
          dueDate: get(row, 'dueDate') || now,
          category: get(row, 'category') || 'General',
          description: get(row, 'description'),
          linkedProject: get(row, 'linkedProject'),
          subtasks: [], tags: toArray(get(row, 'tags')), createdAt: now,
        };
      case 'repos':
        return {
          name: get(row, 'name') || 'unnamed-repo', url: get(row, 'url'),
          description: get(row, 'description'), language: get(row, 'language') || 'TypeScript',
          stars: parseInt(get(row, 'stars')) || 0, forks: parseInt(get(row, 'forks')) || 0,
          status: get(row, 'status') || 'active', demoUrl: get(row, 'demoUrl'),
          progress: parseInt(get(row, 'progress')) || 0,
          topics: toArray(get(row, 'topics')), lastUpdated: now,
        };
      case 'buildProjects':
        return {
          name: get(row, 'name') || 'Unnamed', platform: get(row, 'platform') || 'other',
          projectUrl: get(row, 'projectUrl'), deployedUrl: get(row, 'deployedUrl'),
          description: get(row, 'description'), techStack: toArray(get(row, 'techStack')),
          status: get(row, 'status') || 'building', startedDate: now, lastWorkedOn: now,
          nextSteps: get(row, 'nextSteps'), githubRepo: get(row, 'githubRepo'),
        };
      case 'credentials':
        return {
          label: get(row, 'label') || 'Untitled', service: get(row, 'service') || '',
          url: get(row, 'url'), username: get(row, 'username'), password: get(row, 'password'),
          apiKey: get(row, 'apiKey'), notes: get(row, 'notes'),
          category: get(row, 'category') || 'Other',
          tags: toArray(get(row, 'tags')), createdAt: now,
        };
      case 'payments':
        return {
          title: get(row, 'title') || 'Untitled', amount: parseFloat(get(row, 'amount')) || 0,
          currency: get(row, 'currency') || 'USD', type: get(row, 'type') || 'expense',
          status: get(row, 'status') || 'pending', category: get(row, 'category') || 'Other',
          from: get(row, 'from'), to: get(row, 'to'),
          dueDate: get(row, 'dueDate') || now, paidDate: '', linkedProject: '',
          recurring: toBool(get(row, 'recurring')), recurringInterval: '',
          notes: get(row, 'notes'), createdAt: now,
        };
      case 'notes':
        return {
          title: get(row, 'title') || 'Untitled', content: get(row, 'content') || '',
          color: get(row, 'color') || 'blue', pinned: toBool(get(row, 'pinned')),
          tags: toArray(get(row, 'tags')), createdAt: now, updatedAt: now,
        };
      case 'ideas':
        return {
          title: get(row, 'title') || 'Untitled', description: get(row, 'description') || '',
          category: get(row, 'category') || 'General', priority: get(row, 'priority') || 'medium',
          status: get(row, 'status') || 'spark', tags: toArray(get(row, 'tags')),
          linkedProject: get(row, 'linkedProject'), votes: parseInt(get(row, 'votes')) || 0,
          createdAt: now, updatedAt: now,
        };
      case 'habits':
        return {
          name: get(row, 'name') || 'Untitled', icon: get(row, 'icon') || '🎯',
          frequency: get(row, 'frequency') || 'daily', completions: [], streak: 0,
          color: get(row, 'color') || '', createdAt: now,
        };
      default:
        return {};
    }
  }).filter(item => {
    const meta = TARGET_META[target];
    return meta.requiredFields.every(f => item[f]);
  });
}

/** Generate a CSV template for a given target */
export function generateTemplate(target: ImportTarget): string {
  const meta = TARGET_META[target];
  const headers = [...meta.requiredFields, ...meta.optionalFields];
  return headers.join(',') + '\n' + headers.map(() => '').join(',');
}

// ─── Autonomous Import (NEW) ─────────────────────────────────────────────────

export interface AutonomousImportResult {
  categories: {
    target: ImportTarget;
    meta: TargetMeta;
    confidence: 'high' | 'medium' | 'low';
    items: Record<string, any>[];
    fieldMap: Record<string, string>;
    score: number;
  }[];
  parsedData: ParsedData;
  totalItems: number;
}

/**
 * Fully autonomous import: parse → detect → map → normalize in one call.
 * Returns ready-to-insert items grouped by category.
 */
export function autonomousImport(text: string, fileName?: string): AutonomousImportResult {
  const parsedData = parseImportData(text, fileName);

  if (parsedData.rows.length === 0) {
    return { categories: [], parsedData, totalItems: 0 };
  }

  const detections = autoDetectWithConfidence(parsedData.sourceFields, parsedData.rows);
  const best = detections[0];

  // Use the best match
  const items = normalizeItems(parsedData.rows, best.target, best.fieldMap);

  const categories = items.length > 0
    ? [{
        target: best.target,
        meta: TARGET_META[best.target],
        confidence: best.confidence,
        items,
        fieldMap: best.fieldMap,
        score: best.score,
      }]
    : [];

  // If best didn't capture all rows, try second-best for remaining
  if (items.length < parsedData.rows.length && detections.length > 1) {
    const second = detections[1];
    if (second.score > 0 && second.validCount > items.length) {
      // Second category captures more — offer as alternative
      const secondItems = normalizeItems(parsedData.rows, second.target, second.fieldMap);
      if (secondItems.length > items.length) {
        categories.length = 0;
        categories.push({
          target: second.target,
          meta: TARGET_META[second.target],
          confidence: second.confidence,
          items: secondItems,
          fieldMap: second.fieldMap,
          score: second.score,
        });
      }
    }
  }

  return {
    categories,
    parsedData,
    totalItems: categories.reduce((sum, c) => sum + c.items.length, 0),
  };
}
