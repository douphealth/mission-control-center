/**
 * Smart Import Engine — auto-detects format and category, normalizes data.
 * Uses papaparse for robust CSV/TSV parsing.
 */
import Papa from 'papaparse';

export type ImportTarget = 'websites' | 'links' | 'tasks' | 'repos' | 'buildProjects' | 'credentials' | 'payments' | 'notes' | 'ideas' | 'habits';

export interface TargetMeta {
  label: string;
  emoji: string;
  requiredFields: string[];
  optionalFields: string[];
  /** Field aliases for fuzzy matching */
  aliases: Record<string, string[]>;
}

export const TARGET_META: Record<ImportTarget, TargetMeta> = {
  websites: {
    label: 'Websites', emoji: '🌐',
    requiredFields: ['name', 'url'],
    optionalFields: ['wpAdminUrl', 'wpUsername', 'wpPassword', 'hostingProvider', 'hostingLoginUrl', 'hostingUsername', 'hostingPassword', 'category', 'status', 'notes', 'plugins', 'tags'],
    aliases: {
      name: ['site', 'website', 'domain', 'siteName', 'site_name', 'website_name'],
      url: ['link', 'href', 'siteUrl', 'site_url', 'website_url', 'address', 'domain'],
      wpAdminUrl: ['wp_admin', 'wordpress_admin', 'admin_url', 'wp_url'],
      wpUsername: ['wp_user', 'wordpress_user', 'admin_user', 'wp_login'],
      wpPassword: ['wp_pass', 'wordpress_pass', 'admin_pass', 'wp_pwd'],
      hostingProvider: ['hosting', 'host', 'provider', 'hosting_provider'],
      hostingLoginUrl: ['hosting_url', 'hosting_login', 'host_url'],
      hostingUsername: ['hosting_user', 'host_user'],
      hostingPassword: ['hosting_pass', 'host_pass', 'hosting_pwd'],
      category: ['type', 'group', 'cat'],
      status: ['state', 'active'],
      notes: ['note', 'comment', 'comments', 'description', 'desc'],
      plugins: ['plugin', 'extensions', 'addons'],
      tags: ['tag', 'labels'],
    },
  },
  links: {
    label: 'Links', emoji: '🔗',
    requiredFields: ['title', 'url'],
    optionalFields: ['category', 'description', 'status', 'pinned', 'tags'],
    aliases: {
      title: ['name', 'label', 'text', 'link_name', 'bookmark'],
      url: ['link', 'href', 'address', 'uri'],
      category: ['type', 'group', 'folder', 'cat'],
      description: ['desc', 'note', 'notes', 'comment'],
      status: ['state'],
      pinned: ['pin', 'favorite', 'starred', 'fav'],
      tags: ['tag', 'labels', 'keywords'],
    },
  },
  tasks: {
    label: 'Tasks', emoji: '✅',
    requiredFields: ['title'],
    optionalFields: ['priority', 'status', 'dueDate', 'category', 'description', 'linkedProject', 'tags'],
    aliases: {
      title: ['name', 'task', 'todo', 'item', 'subject', 'task_name'],
      priority: ['prio', 'importance', 'urgency', 'level'],
      status: ['state', 'done', 'completed', 'progress'],
      dueDate: ['due', 'deadline', 'due_date', 'duedate', 'date', 'target_date'],
      category: ['type', 'group', 'cat', 'project', 'list'],
      description: ['desc', 'note', 'notes', 'details', 'body', 'content'],
      linkedProject: ['project', 'linked_project', 'projectName'],
      tags: ['tag', 'labels'],
    },
  },
  repos: {
    label: 'GitHub Repos', emoji: '🐙',
    requiredFields: ['name'],
    optionalFields: ['url', 'description', 'language', 'stars', 'forks', 'status', 'demoUrl', 'progress', 'topics'],
    aliases: {
      name: ['repo', 'repository', 'repo_name', 'project'],
      url: ['link', 'href', 'github_url', 'repo_url', 'html_url'],
      description: ['desc', 'about', 'summary'],
      language: ['lang', 'tech', 'primary_language'],
      stars: ['star', 'stargazers', 'stargazers_count'],
      forks: ['fork', 'forks_count'],
      status: ['state'],
      demoUrl: ['demo', 'demo_url', 'homepage', 'live_url'],
      progress: ['completion', 'percent'],
      topics: ['tags', 'labels', 'keywords', 'topic'],
    },
  },
  buildProjects: {
    label: 'Build Projects', emoji: '🛠️',
    requiredFields: ['name'],
    optionalFields: ['platform', 'projectUrl', 'deployedUrl', 'description', 'techStack', 'status', 'nextSteps', 'githubRepo'],
    aliases: {
      name: ['project', 'title', 'project_name'],
      platform: ['tool', 'builder', 'framework'],
      projectUrl: ['project_url', 'build_url', 'url'],
      deployedUrl: ['deployed_url', 'live_url', 'demo', 'production_url'],
      description: ['desc', 'about', 'summary'],
      techStack: ['tech_stack', 'technologies', 'stack', 'tech'],
      status: ['state', 'phase'],
      nextSteps: ['next_steps', 'todo', 'next'],
      githubRepo: ['github_repo', 'repo', 'github', 'repository'],
    },
  },
  credentials: {
    label: 'Credentials', emoji: '🔐',
    requiredFields: ['label', 'service'],
    optionalFields: ['url', 'username', 'password', 'apiKey', 'notes', 'category', 'tags'],
    aliases: {
      label: ['name', 'title', 'credential_name', 'account'],
      service: ['provider', 'platform', 'app', 'site', 'website'],
      url: ['link', 'login_url', 'site_url', 'address'],
      username: ['user', 'login', 'email', 'user_name', 'account_name'],
      password: ['pass', 'pwd', 'secret', 'passwd'],
      apiKey: ['api_key', 'token', 'access_token', 'key', 'api_token'],
      notes: ['note', 'comment', 'description', 'desc'],
      category: ['type', 'group', 'cat'],
      tags: ['tag', 'labels'],
    },
  },
  payments: {
    label: 'Payments', emoji: '💰',
    requiredFields: ['title', 'amount'],
    optionalFields: ['currency', 'type', 'status', 'category', 'from', 'to', 'dueDate', 'recurring', 'notes'],
    aliases: {
      title: ['name', 'description', 'item', 'payment', 'invoice', 'label'],
      amount: ['price', 'cost', 'value', 'total', 'sum', 'fee'],
      currency: ['curr', 'money_type'],
      type: ['kind', 'payment_type', 'direction'],
      status: ['state', 'paid'],
      category: ['group', 'cat'],
      from: ['sender', 'payer', 'source', 'client'],
      to: ['receiver', 'payee', 'recipient', 'vendor'],
      dueDate: ['due', 'deadline', 'due_date', 'date'],
      recurring: ['repeat', 'auto', 'subscription', 'recur'],
      notes: ['note', 'comment', 'memo', 'desc'],
    },
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
  },
  ideas: {
    label: 'Ideas', emoji: '💡',
    requiredFields: ['title'],
    optionalFields: ['description', 'category', 'priority', 'status', 'tags', 'linkedProject', 'votes'],
    aliases: {
      title: ['name', 'idea', 'subject', 'concept'],
      description: ['desc', 'details', 'body', 'content', 'notes'],
      category: ['type', 'group', 'cat'],
      priority: ['prio', 'importance'],
      status: ['state', 'phase'],
      tags: ['tag', 'labels'],
      linkedProject: ['project', 'linked_project'],
      votes: ['vote', 'score', 'rating'],
    },
  },
  habits: {
    label: 'Habits', emoji: '🔄',
    requiredFields: ['name'],
    optionalFields: ['icon', 'frequency', 'color'],
    aliases: {
      name: ['habit', 'title', 'label', 'activity'],
      icon: ['emoji'],
      frequency: ['freq', 'interval', 'schedule', 'repeat'],
      color: ['colour', 'theme'],
    },
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
      const sourceFields = rows.length > 0 ? [...new Set(rows.flatMap(r => Object.keys(r)))] : [];
      return { rows, sourceFields, detectedFormat: 'json' };
    } catch { /* not valid JSON, fall through */ }
  }

  // 2. Try JSON Lines (one JSON object per line)
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
      const sourceFields = rows.length > 0 ? [...new Set(rows.flatMap(r => Object.keys(r)))] : [];
      return { rows, sourceFields, detectedFormat: 'jsonlines' };
    } catch { /* fall through */ }
  }

  // 3. Try TSV first if tab-separated
  const isTSV = lines[0]?.includes('\t') || fileName?.endsWith('.tsv');
  
  // 4. Use papaparse for CSV/TSV
  const result = Papa.parse(trimmed, {
    header: true,
    skipEmptyLines: true,
    delimiter: isTSV ? '\t' : undefined, // auto-detect if not TSV
    dynamicTyping: false,
    transformHeader: (h: string) => h.trim(),
  });

  if (result.data.length > 0 && result.meta.fields && result.meta.fields.length > 1) {
    const rows = result.data as Record<string, string>[];
    return {
      rows: rows.map(r => {
        const obj: Record<string, string> = {};
        for (const [k, v] of Object.entries(r)) {
          obj[k] = String(v ?? '').trim();
        }
        return obj;
      }),
      sourceFields: result.meta.fields,
      detectedFormat: isTSV ? 'tsv' : 'csv',
    };
  }

  // 5. Fallback: treat each line as a single "item" value
  const fallbackRows = lines.filter(l => l.trim()).map(l => ({ item: l.trim() }));
  return { rows: fallbackRows, sourceFields: ['item'], detectedFormat: 'text' };
}

// ─── Auto-detection ───────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[_\s\-./]/g, '');
}

/** Score how well source fields match a target category */
function scoreCategory(sourceFields: string[], target: ImportTarget): number {
  const meta = TARGET_META[target];
  const allFields = [...meta.requiredFields, ...meta.optionalFields];
  let score = 0;

  for (const tf of allFields) {
    const normalTf = normalize(tf);
    const aliasList = (meta.aliases[tf] || []).map(normalize);

    for (const sf of sourceFields) {
      const normalSf = normalize(sf);
      if (normalSf === normalTf) {
        score += meta.requiredFields.includes(tf) ? 10 : 3;
        break;
      }
      if (aliasList.includes(normalSf)) {
        score += meta.requiredFields.includes(tf) ? 8 : 2;
        break;
      }
      if (normalSf.includes(normalTf) || normalTf.includes(normalSf)) {
        score += meta.requiredFields.includes(tf) ? 5 : 1;
        break;
      }
    }
  }

  // Penalize if required fields have no match at all
  for (const rf of meta.requiredFields) {
    const normalRf = normalize(rf);
    const aliasList = (meta.aliases[rf] || []).map(normalize);
    const hasMatch = sourceFields.some(sf => {
      const n = normalize(sf);
      return n === normalRf || aliasList.includes(n) || n.includes(normalRf) || normalRf.includes(n);
    });
    if (!hasMatch) score -= 5;
  }

  return score;
}

export function autoDetectCategory(sourceFields: string[]): ImportTarget {
  const scores = (Object.keys(TARGET_META) as ImportTarget[]).map(t => ({
    target: t,
    score: scoreCategory(sourceFields, t),
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores[0].target;
}

export function autoMapFields(sourceFields: string[], target: ImportTarget): Record<string, string> {
  const meta = TARGET_META[target];
  const allTargetFields = [...meta.requiredFields, ...meta.optionalFields];
  const map: Record<string, string> = {};
  const usedSource = new Set<string>();

  // Pass 1: exact match
  for (const tf of allTargetFields) {
    const normalTf = normalize(tf);
    const match = sourceFields.find(sf => !usedSource.has(sf) && normalize(sf) === normalTf);
    if (match) { map[tf] = match; usedSource.add(match); }
  }

  // Pass 2: alias match
  for (const tf of allTargetFields) {
    if (map[tf]) continue;
    const aliasList = (meta.aliases[tf] || []).map(normalize);
    const match = sourceFields.find(sf => !usedSource.has(sf) && aliasList.includes(normalize(sf)));
    if (match) { map[tf] = match; usedSource.add(match); }
  }

  // Pass 3: partial match
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

  return map;
}

// ─── Normalization to final items ─────────────────────────────────────────────

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
