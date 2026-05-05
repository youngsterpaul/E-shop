/**
 * Normalizes raw product specification values into short, clean filter tokens.
 *
 * Why: product.specification often stores verbose strings like
 *   "16GB DDR4 3200MHz Dual Channel" or "Intel Core i7-1255U (12th Gen, 10 cores)"
 * which makes filter sidebars noisy and prevents grouping of equivalent values.
 *
 * This utility trims those strings to the most useful, shortest meaningful token
 * (e.g. "16GB", "Intel Core i7", "15.6\"") so the same normalization is used
 * BOTH when building filter options AND when matching products to filters.
 */

const MEMORY_RE = /(\d+(?:\.\d+)?)\s*(tb|gb|mb)\b/i;
const SCREEN_RE = /(\d+(?:\.\d+)?)\s*(?:"|''|inch(?:es)?|in)\b/i;
const SPEED_RE  = /(\d+(?:\.\d+)?)\s*(ghz|mhz|hz|mbps|gbps)\b/i;
const WATT_RE   = /(\d+(?:\.\d+)?)\s*w(?:atts?)?\b/i;
const MAH_RE    = /(\d{3,6})\s*mah\b/i;
const DPI_RE    = /(\d{3,6})\s*dpi\b/i;
const MP_RE     = /(\d+(?:\.\d+)?)\s*mp\b/i;
const REFRESH_RE = /(\d+)\s*hz\b/i;

const PROCESSOR_PATTERNS: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/\b(intel\s+core\s+i[3579])/i, (m) => titleCase(m[1])],
  [/\b(core\s+i[3579])/i,         (m) => 'Intel ' + titleCase(m[1])],
  [/\b(i[3579])-?\d/i,            (m) => 'Intel Core ' + m[1].toLowerCase()],
  [/\b(amd\s+ryzen\s+\d)/i,       (m) => titleCase(m[1])],
  [/\b(ryzen\s+\d)/i,             (m) => 'AMD ' + titleCase(m[1])],
  [/\b(apple\s+m\d(?:\s+(?:pro|max|ultra))?)/i, (m) => titleCase(m[1])],
  [/\b(snapdragon\s+\d+)/i,       (m) => titleCase(m[1])],
  [/\b(mediatek)/i,               () => 'MediaTek'],
  [/\b(celeron|pentium|xeon|athlon)/i, (m) => titleCase(m[1]) ],
];

function titleCase(s: string) {
  return s.replace(/\s+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

function firstToken(s: string) {
  // Take everything before first comma / parenthesis / dash with spaces / slash
  const cut = s.split(/[,(/]| - /)[0];
  return cut.trim();
}

function normalizeMemoryLike(raw: string): string | null {
  const m = raw.match(MEMORY_RE);
  if (!m) return null;
  const num = parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  // Drop trailing .0
  const numStr = num % 1 === 0 ? String(num) : String(num);
  return `${numStr}${unit}`;
}

function normalizeScreenSize(raw: string): string | null {
  const m = raw.match(SCREEN_RE);
  if (!m) return null;
  return `${m[1]}"`;
}

function normalizeProcessor(raw: string): string | null {
  for (const [re, fmt] of PROCESSOR_PATTERNS) {
    const m = raw.match(re);
    if (m) return fmt(m);
  }
  return null;
}

function normalizeBrand(raw: string): string {
  // First word, title-cased; preserve known multi-word brands
  const lower = raw.toLowerCase().trim();
  const multi = ['hewlett packard', 'western digital', 'seagate barracuda'];
  for (const m of multi) if (lower.startsWith(m)) return titleCase(m);
  return titleCase(firstToken(raw).split(/\s+/)[0] || raw);
}

/**
 * Normalize a raw spec value for a given key into a short filter token.
 * MUST be used both when building the filter list AND when matching products,
 * otherwise selections won't match anything.
 */
export function normalizeSpecValue(key: string, raw: string): string {
  if (!raw || typeof raw !== 'string') return raw;
  const value = raw.trim();
  if (!value) return value;

  const k = key.toLowerCase().trim();

  switch (k) {
    case 'brand':
      return normalizeBrand(value);

    case 'ram':
    case 'memory':
    case 'storage':
    case 'capacity':
    case 'vram':
      return normalizeMemoryLike(value) ?? firstToken(value);

    case 'screen_size':
    case 'display_size':
    case 'size':
      return normalizeScreenSize(value) ?? firstToken(value);

    case 'processor':
    case 'cpu':
      return normalizeProcessor(value) ?? firstToken(value);

    case 'gpu':
    case 'graphics': {
      // "NVIDIA GeForce RTX 4060 Laptop GPU 8GB" -> "RTX 4060"
      const m = value.match(/\b(rtx|gtx|rx|arc)\s*([a-z0-9]+)/i);
      if (m) return `${m[1].toUpperCase()} ${m[2].toUpperCase()}`;
      const intg = value.match(/\b(intel\s+(?:iris|uhd|hd))/i);
      if (intg) return titleCase(intg[1]);
      return firstToken(value);
    }

    case 'refresh_rate': {
      const m = value.match(REFRESH_RE);
      return m ? `${m[1]}Hz` : firstToken(value);
    }

    case 'speed': {
      const m = value.match(SPEED_RE);
      if (m) return `${m[1]}${m[2].replace(/^./, (c) => c.toUpperCase()).replace(/hz$/i, 'Hz').replace(/bps$/i, 'bps')}`;
      return firstToken(value);
    }

    case 'wattage': {
      const m = value.match(WATT_RE);
      return m ? `${m[1]}W` : firstToken(value);
    }

    case 'battery':
    case 'battery_life': {
      const mah = value.match(MAH_RE);
      if (mah) return `${mah[1]}mAh`;
      const hr = value.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)\b/i);
      if (hr) return `${hr[1]}h`;
      return firstToken(value);
    }

    case 'dpi': {
      const m = value.match(DPI_RE);
      return m ? `${m[1]} DPI` : firstToken(value);
    }

    case 'megapixels': {
      const m = value.match(MP_RE);
      return m ? `${m[1]}MP` : firstToken(value);
    }

    case 'resolution': {
      // Standardize common resolutions
      const lower = value.toLowerCase();
      if (/\b4k|3840\s*x\s*2160\b/.test(lower)) return '4K';
      if (/\b2k|2560\s*x\s*1440|qhd\b/.test(lower)) return '2K (QHD)';
      if (/\b1920\s*x\s*1080|full\s*hd|fhd\b/.test(lower)) return 'Full HD';
      if (/\b1366\s*x\s*768|hd\b/.test(lower)) return 'HD';
      const m = value.match(/(\d{3,5}\s*x\s*\d{3,5})/);
      if (m) return m[1].replace(/\s+/g, '');
      return firstToken(value);
    }

    case 'os':
    case 'operating_system': {
      const lower = value.toLowerCase();
      if (lower.includes('windows 11')) return 'Windows 11';
      if (lower.includes('windows 10')) return 'Windows 10';
      if (lower.includes('macos') || lower.includes('mac os')) return 'macOS';
      if (lower.includes('chrome os') || lower.includes('chromeos')) return 'ChromeOS';
      if (lower.includes('android')) return 'Android';
      if (lower.includes('ios')) return 'iOS';
      if (lower.includes('linux')) return 'Linux';
      return firstToken(value);
    }

    case 'color':
      return titleCase(firstToken(value));

    default: {
      // Generic short-form: take first segment, cap length
      const short = firstToken(value).replace(/\s+/g, ' ');
      return short.length > 24 ? short.slice(0, 24).trim() + '…' : short;
    }
  }
}