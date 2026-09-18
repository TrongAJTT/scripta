import type { ScriptFunction } from '../types/script.types';

export const BUILTIN_FUNCTIONS: ScriptFunction[] = [
  {
    id: 'fn_capitalize',
    name: 'capitalize',
    description: 'Capitalizes the first letter of each word in a string',
    params: ['str'],
    code: `if (!str) return '';
return String(str).replace(/\\b\\w/g, char => char.toUpperCase());`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_slugify',
    name: 'slugify',
    description: 'Converts text into an ASCII-safe URL slug',
    params: ['str'],
    code: `if (!str) return '';
return String(str)
  .normalize('NFD')
  .replace(/[\\u0300-\\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9 -]/g, '')
  .replace(/\\s+/g, '-')
  .replace(/-+/g, '-');`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_sort_lines',
    name: 'sortLines',
    description: 'Sorts lines alphabetically, optionally descending and case-insensitively',
    params: ['text', 'descending', 'ignoreCase'],
    code: `if (!text) return '';
const lines = String(text).split(/\\r?\\n/);
lines.sort((a, b) => {
  const itemA = ignoreCase ? a.toLowerCase() : a;
  const itemB = ignoreCase ? b.toLowerCase() : b;
  return itemA.localeCompare(itemB);
});
if (descending) lines.reverse();
return lines.join('\\n');`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_remove_duplicate_lines',
    name: 'removeDuplicateLines',
    description: 'Removes duplicate lines while preserving order',
    params: ['text'],
    code: `if (!text) return '';
const lines = String(text).split(/\\r?\\n/);
return Array.from(new Set(lines)).join('\\n');`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_trim_lines',
    name: 'trimLines',
    description: 'Trims leading and trailing whitespace from every line',
    params: ['text'],
    code: `if (!text) return '';
return String(text)
  .split(/\\r?\\n/)
  .map(l => l.trim())
  .join('\\n');`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_filter_lines',
    name: 'filterLines',
    description: 'Keeps or removes lines matching a regex pattern',
    params: ['text', 'pattern', 'invert'],
    code: `if (!text) return '';
const regex = new RegExp(pattern);
const lines = String(text).split(/\\r?\\n/);
const filtered = lines.filter(line => {
  const matches = regex.test(line);
  return invert ? !matches : matches;
});
return filtered.join('\\n');`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_json_prettify',
    name: 'jsonPrettify',
    description: 'Parses and pretty-prints JSON with customizable indentation',
    params: ['jsonStr', 'indent'],
    code: `const indentSize = typeof indent === 'number' ? indent : 2;
const parsed = JSON.parse(jsonStr);
return JSON.stringify(parsed, null, indentSize);`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_json_minify',
    name: 'jsonMinify',
    description: 'Minifies JSON string into a compact format',
    params: ['jsonStr'],
    code: `const parsed = JSON.parse(jsonStr);
return JSON.stringify(parsed);`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_csv_to_json',
    name: 'csvToJson',
    description: 'Converts CSV formatted text into JSON array',
    params: ['csvText', 'delimiter'],
    code: `if (!csvText) return '[]';
const sep = delimiter || ',';
const lines = String(csvText).trim().split(/\\r?\\n/);
if (lines.length === 0) return '[]';
const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''));
const result = [];
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const values = lines[i].split(sep).map(v => v.trim().replace(/^"|"$/g, ''));
  const obj = {};
  headers.forEach((h, idx) => {
    obj[h] = values[idx] !== undefined ? values[idx] : '';
  });
  result.push(obj);
}
return JSON.stringify(result, null, 2);`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_json_to_csv',
    name: 'jsonToCsv',
    description: 'Converts a JSON array of objects into CSV format',
    params: ['jsonStr', 'delimiter'],
    code: `const sep = delimiter || ',';
const data = JSON.parse(jsonStr);
if (!Array.isArray(data) || data.length === 0) return '';
const keys = Object.keys(data[0]);
const escapeVal = (val) => {
  const str = String(val === undefined || val === null ? '' : val);
  if (str.includes(sep) || str.includes('"') || str.includes('\\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};
const headerLine = keys.map(escapeVal).join(sep);
const rows = data.map(item => keys.map(k => escapeVal(item[k])).join(sep));
return [headerLine, ...rows].join('\\n');`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_base64_encode',
    name: 'base64Encode',
    description: 'Encodes utf-8 text into base64',
    params: ['str'],
    code: `const utf8Bytes = new TextEncoder().encode(str);
let binary = '';
for (let i = 0; i < utf8Bytes.byteLength; i++) {
  binary += String.fromCharCode(utf8Bytes[i]);
}
return btoa(binary);`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_base64_decode',
    name: 'base64Decode',
    description: 'Decodes base64 string back into utf-8 text',
    params: ['base64Str'],
    code: `const binary = atob(base64Str);
const bytes = new Uint8Array(binary.length);
for (let i = 0; i < binary.length; i++) {
  bytes[i] = binary.charCodeAt(i);
}
return new TextDecoder().decode(bytes);`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_url_encode_decode',
    name: 'urlEncodeDecode',
    description: 'Encodes or decodes URL component string',
    params: ['str', 'isDecode'],
    code: `if (isDecode) {
  return decodeURIComponent(str);
}
return encodeURIComponent(str);`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_color_converter',
    name: 'colorConvert',
    description: 'Converts HEX color to RGB, RGBA or HSL representation',
    params: ['colorStr', 'targetFormat'],
    code: `let hex = String(colorStr).trim().replace(/^#/, '');
if (hex.length === 3) {
  hex = hex.split('').map(c => c + c).join('');
}
const num = parseInt(hex, 16);
if (isNaN(num)) throw new Error('Invalid HEX color: ' + colorStr);
const r = (num >> 16) & 255;
const g = (num >> 8) & 255;
const b = num & 255;

if (targetFormat === 'RGB') return 'rgb(' + r + ', ' + g + ', ' + b + ')';
if (targetFormat === 'RGBA') return 'rgba(' + r + ', ' + g + ', ' + b + ', 1)';
if (targetFormat === 'HSL') {
  const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h /= 6;
  }
  return 'hsl(' + Math.round(h * 360) + ', ' + Math.round(s * 100) + '%, ' + Math.round(l * 100) + '%)';
}
return '#' + hex;`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_xor_cipher',
    name: 'xorCipher',
    description: 'Encrypts or decrypts text using password-derived XOR keystream and Base64',
    params: ['text', 'password', 'isDecrypt'],
    code: `if (!password) throw new Error('Password is required!');
if (!text) return '';

if (isDecrypt) {
  // Decode Base64 first
  const binary = atob(text.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    const keyByte = password.charCodeAt(i % password.length);
    bytes[i] = binary.charCodeAt(i) ^ keyByte;
  }
  return new TextDecoder().decode(bytes);
} else {
  // Encrypt & Encode to Base64
  const utf8Bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    const keyByte = password.charCodeAt(i % password.length);
    binary += String.fromCharCode(utf8Bytes[i] ^ keyByte);
  }
  return btoa(binary);
}`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_insert_separator',
    name: 'insertSeparator',
    description: 'Inserts custom character/string after every character or word',
    params: ['text', 'separator', 'mode'],
    code: `if (!text) return '';
const sep = separator !== undefined ? separator : ' ';
if (mode === 'Every Word') {
  return String(text).split(/\\s+/).join(sep + ' ');
}
// Default: Every Character
return String(text).split('').join(sep);`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_case_converter',
    name: 'convertCase',
    description: 'Converts text case between UPPERCASE, lowercase, Title Case, camelCase, snake_case, kebab-case, CONSTANT_CASE',
    params: ['text', 'targetCase'],
    code: `if (!text) return '';
const words = String(text)
  .trim()
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .split(/\\s+/)
  .filter(Boolean);

switch (targetCase) {
  case 'UPPERCASE':
    return String(text).toUpperCase();
  case 'lowercase':
    return String(text).toLowerCase();
  case 'Title Case':
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  case 'camelCase':
    return words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  case 'PascalCase':
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  case 'snake_case':
    return words.map(w => w.toLowerCase()).join('_');
  case 'kebab-case':
    return words.map(w => w.toLowerCase()).join('-');
  case 'CONSTANT_CASE':
    return words.map(w => w.toUpperCase()).join('_');
  default:
    return text;
}`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'fn_html_entities',
    name: 'htmlEntities',
    description: 'Encodes or decodes HTML special entities',
    params: ['text', 'isDecode'],
    code: `if (!text) return '';
if (isDecode) {
  return String(text)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
} else {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}`,
    isBuiltin: true,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
];
