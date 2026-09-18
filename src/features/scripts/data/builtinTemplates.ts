import type { ScriptMetadata } from '../types/script.types';

export const BUILTIN_TEMPLATES: ScriptMetadata[] = [
  // 1. Text Processing Group
  {
    id: 'tpl_text_formatter',
    name: 'Text Formatter',
    description: 'Trims, sorts, and capitalizes lines from tab or selection',
    author: 'System Builtin',
    version: '1.0.0',
    group: 'Text Processing',
    target: 'tab',
    inputs: [
      {
        name: 'sortOrder',
        label: 'Sort Direction',
        type: 'dropdown',
        options: ['Ascending', 'Descending', 'None'],
        defaultValue: 'Ascending',
      },
      {
        name: 'removeDups',
        label: 'Remove Duplicate Lines',
        type: 'boolean',
        defaultValue: true,
      },
      {
        name: 'doCapitalize',
        label: 'Capitalize Words',
        type: 'boolean',
        defaultValue: false,
      },
    ],
    usedFunctionIds: ['fn_trim_lines', 'fn_sort_lines', 'fn_remove_duplicate_lines', 'fn_capitalize'],
    code: `async function run(inputs, context) {
  context.log("Running Text Formatter...");
  let text = context.targetText || (context.currentTab ? context.currentTab.content : '');
  if (!text) throw new Error("No text content available to process!");

  text = await context.functions.trimLines(text);
  if (inputs.removeDups) {
    text = await context.functions.removeDuplicateLines(text);
  }
  if (inputs.sortOrder !== 'None') {
    const isDesc = inputs.sortOrder === 'Descending';
    text = await context.functions.sortLines(text, isDesc, true);
  }
  if (inputs.doCapitalize) {
    text = await context.functions.capitalize(text);
  }

  context.createTab("Formatted Output", text);
}`,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'tpl_insert_character_or_word_separator',
    name: 'Insert Character / Word Separator',
    description: 'Inserts custom characters or symbols after every character or word',
    author: 'System Builtin',
    version: '1.0.0',
    group: 'Text Processing',
    target: 'selection',
    inputs: [
      {
        name: 'separator',
        label: 'Separator to Insert',
        type: 'string',
        defaultValue: '-',
        required: true,
      },
      {
        name: 'insertMode',
        label: 'Insertion Unit',
        type: 'dropdown',
        options: ['Every Character', 'Every Word'],
        defaultValue: 'Every Character',
      },
    ],
    usedFunctionIds: ['fn_insert_separator'],
    code: `async function run(inputs, context) {
  const text = context.targetText || (context.currentTab ? context.currentTab.content : '');
  if (!text) throw new Error("No text available to process!");

  const result = await context.functions.insertSeparator(text, inputs.separator, inputs.insertMode);
  context.createTab("Separator Output", result);
}`,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'tpl_markdown_table_generator',
    name: 'Markdown Table Generator',
    description: 'Generates a GitHub markdown table from CSV or delimiter-separated rows',
    author: 'System Builtin',
    version: '1.0.0',
    group: 'Text Processing',
    target: 'tab',
    inputs: [
      {
        name: 'delimiter',
        label: 'Column Separator',
        type: 'string',
        defaultValue: ',',
      },
    ],
    usedFunctionIds: ['fn_trim_lines'],
    code: `async function run(inputs, context) {
  context.log("Generating Markdown Table...");
  const text = context.targetText || (context.currentTab ? context.currentTab.content : '');
  if (!text) throw new Error("No text to convert into table!");

  const sep = inputs.delimiter || ',';
  const lines = text.trim().split(/\\r?\\n/).filter(Boolean);
  if (lines.length === 0) return '';

  const rows = lines.map(l => l.split(sep).map(c => c.trim()));
  const header = rows[0];
  const separator = header.map(() => '---');

  const tableLines = [
    '| ' + header.join(' | ') + ' |',
    '| ' + separator.join(' | ') + ' |',
    ...rows.slice(1).map(r => '| ' + r.join(' | ') + ' |')
  ];

  context.createTab("table.md", tableLines.join('\\n'));
}`,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'tpl_case_converter',
    name: 'Case Converter',
    description: 'Converts text into UPPERCASE, lowercase, Title Case, camelCase, snake_case, or kebab-case',
    author: 'System Builtin',
    version: '1.0.0',
    group: 'Text Processing',
    target: 'selection',
    inputs: [
      {
        name: 'targetCase',
        label: 'Target Case',
        type: 'dropdown',
        options: ['UPPERCASE', 'lowercase', 'Title Case', 'camelCase', 'PascalCase', 'snake_case', 'kebab-case', 'CONSTANT_CASE'],
        defaultValue: 'UPPERCASE',
      },
    ],
    usedFunctionIds: ['fn_case_converter'],
    code: `async function run(inputs, context) {
  const text = context.targetText || (context.currentTab ? context.currentTab.content : '');
  if (!text) throw new Error("No text selected or found to convert!");

  const converted = await context.functions.convertCase(text, inputs.targetCase);
  context.createTab("Case Output", converted);
}`,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'tpl_line_filter',
    name: 'Line Filter (Regex)',
    description: 'Filters lines in current tab matching a text or regex pattern',
    author: 'System Builtin',
    version: '1.0.0',
    group: 'Text Processing',
    target: 'tab',
    inputs: [
      {
        name: 'pattern',
        label: 'Search Pattern (Regex)',
        type: 'string',
        defaultValue: 'error|warn',
        required: true,
      },
      {
        name: 'invert',
        label: 'Invert Match (Remove matching lines)',
        type: 'boolean',
        defaultValue: false,
      },
    ],
    usedFunctionIds: ['fn_filter_lines'],
    code: `async function run(inputs, context) {
  const text = context.targetText || (context.currentTab ? context.currentTab.content : '');
  if (!text) throw new Error("Current tab has no text to filter!");

  const filtered = await context.functions.filterLines(text, inputs.pattern, inputs.invert);
  context.createTab("Filtered Output", filtered);
}`,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },

  // 2. Data Conversion Group
  {
    id: 'tpl_csv_to_json_converter',
    name: 'CSV to JSON Converter',
    description: 'Parses CSV data into a pretty-printed JSON array',
    author: 'System Builtin',
    version: '1.0.0',
    group: 'Data Conversion',
    target: 'tab',
    inputs: [
      {
        name: 'delimiter',
        label: 'CSV Delimiter',
        type: 'string',
        defaultValue: ',',
        required: true,
      },
    ],
    usedFunctionIds: ['fn_csv_to_json'],
    code: `async function run(inputs, context) {
  context.log("Converting CSV to JSON...");
  const text = context.targetText || (context.currentTab ? context.currentTab.content : '');
  if (!text) throw new Error("Current tab has no CSV text!");

  const jsonStr = await context.functions.csvToJson(text, inputs.delimiter || ',');
  context.createTab("data.json", jsonStr);
}`,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'tpl_json_to_csv_converter',
    name: 'JSON to CSV Converter',
    description: 'Flattens an array of JSON objects into tabular CSV format',
    author: 'System Builtin',
    version: '1.0.0',
    group: 'Data Conversion',
    target: 'tab',
    inputs: [
      {
        name: 'delimiter',
        label: 'CSV Delimiter',
        type: 'string',
        defaultValue: ',',
        required: true,
      },
    ],
    usedFunctionIds: ['fn_json_to_csv'],
    code: `async function run(inputs, context) {
  context.log("Converting JSON to CSV...");
  const text = context.targetText || (context.currentTab ? context.currentTab.content : '');
  if (!text) throw new Error("Current tab has no JSON content!");

  const csvStr = await context.functions.jsonToCsv(text, inputs.delimiter || ',');
  context.createTab("data.csv", csvStr);
}`,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'tpl_color_code_converter',
    name: 'Color Code Converter',
    description: 'Converts HEX color codes into RGB, RGBA, or HSL representations',
    author: 'System Builtin',
    version: '1.0.0',
    group: 'Data Conversion',
    target: 'selection',
    inputs: [
      {
        name: 'targetFormat',
        label: 'Target Color Format',
        type: 'dropdown',
        options: ['RGB', 'RGBA', 'HSL'],
        defaultValue: 'RGB',
      },
    ],
    usedFunctionIds: ['fn_color_converter'],
    code: `async function run(inputs, context) {
  const text = (context.targetText || (context.currentTab ? context.currentTab.content : '')).trim();
  if (!text) throw new Error("Please select or enter a HEX color code (e.g. #3b82f6)!");

  const converted = await context.functions.colorConvert(text, inputs.targetFormat);
  context.createTab("color-output.txt", converted);
}`,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'tpl_json_formatter_minifier',
    name: 'JSON Formatter & Minifier',
    description: 'Prettifies with custom indentation or minifies JSON string',
    author: 'System Builtin',
    version: '1.0.0',
    group: 'Data Conversion',
    target: 'tab',
    inputs: [
      {
        name: 'operation',
        label: 'Operation',
        type: 'dropdown',
        options: ['Prettify (2 spaces)', 'Prettify (4 spaces)', 'Minify (Compact)'],
        defaultValue: 'Prettify (2 spaces)',
      },
    ],
    usedFunctionIds: ['fn_json_prettify', 'fn_json_minify'],
    code: `async function run(inputs, context) {
  const text = context.targetText || (context.currentTab ? context.currentTab.content : '');
  if (!text) throw new Error("No JSON text found in active tab!");

  let result = '';
  if (inputs.operation === 'Minify (Compact)') {
    result = await context.functions.jsonMinify(text);
  } else {
    const indent = inputs.operation === 'Prettify (4 spaces)' ? 4 : 2;
    result = await context.functions.jsonPrettify(text, indent);
  }
  context.createTab("formatted.json", result);
}`,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },

  // 3. Encoding & Security Group
  {
    id: 'tpl_password_cipher',
    name: 'Password-based Cipher',
    description: 'Encrypts or decrypts text using a user-specified password key',
    author: 'System Builtin',
    version: '1.0.0',
    group: 'Encoding & Security',
    target: 'tab',
    inputs: [
      {
        name: 'password',
        label: 'Secret Password / Passphrase',
        type: 'string',
        required: true,
      },
      {
        name: 'cipherAction',
        label: 'Action',
        type: 'dropdown',
        options: ['Encrypt', 'Decrypt'],
        defaultValue: 'Encrypt',
      },
    ],
    usedFunctionIds: ['fn_xor_cipher'],
    code: `async function run(inputs, context) {
  const text = context.targetText || (context.currentTab ? context.currentTab.content : '');
  if (!text) throw new Error("No text found to encrypt or decrypt!");
  if (!inputs.password) throw new Error("Password is required!");

  const isDecrypt = inputs.cipherAction === 'Decrypt';
  const result = await context.functions.xorCipher(text, inputs.password, isDecrypt);
  context.createTab(isDecrypt ? "Decrypted Text" : "Encrypted Text (Base64)", result);
}`,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'tpl_base64_encoder_decoder',
    name: 'Base64 Encoder / Decoder',
    description: 'Encodes or decodes text between UTF-8 and Base64',
    author: 'System Builtin',
    version: '1.0.0',
    group: 'Encoding & Security',
    target: 'tab',
    inputs: [
      {
        name: 'mode',
        label: 'Operation Mode',
        type: 'dropdown',
        options: ['Encode to Base64', 'Decode from Base64'],
        defaultValue: 'Encode to Base64',
      },
    ],
    usedFunctionIds: ['fn_base64_encode', 'fn_base64_decode'],
    code: `async function run(inputs, context) {
  const text = context.targetText || (context.currentTab ? context.currentTab.content : '');
  if (!text) throw new Error("No text found to encode/decode!");

  if (inputs.mode === 'Decode from Base64') {
    const decoded = await context.functions.base64Decode(text.trim());
    context.createTab("Base64 Decoded", decoded);
  } else {
    const encoded = await context.functions.base64Encode(text);
    context.createTab("Base64 Encoded", encoded);
  }
}`,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'tpl_url_encoder_decoder',
    name: 'URL Component Encoder / Decoder',
    description: 'Encodes or decodes URL parameter strings and special characters',
    author: 'System Builtin',
    version: '1.0.0',
    group: 'Encoding & Security',
    target: 'selection',
    inputs: [
      {
        name: 'mode',
        label: 'Action',
        type: 'dropdown',
        options: ['Encode URL Component', 'Decode URL Component'],
        defaultValue: 'Encode URL Component',
      },
    ],
    usedFunctionIds: ['fn_url_encode_decode'],
    code: `async function run(inputs, context) {
  const text = context.targetText || (context.currentTab ? context.currentTab.content : '');
  if (!text) throw new Error("No text selected or found to encode/decode!");

  const isDecode = inputs.mode === 'Decode URL Component';
  const result = await context.functions.urlEncodeDecode(text, isDecode);
  context.createTab(isDecode ? "URL Decoded" : "URL Encoded", result);
}`,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'tpl_html_entities',
    name: 'HTML Entity Encoder / Decoder',
    description: 'Escapes or unescapes HTML entities (&, <, >, ", \')',
    author: 'System Builtin',
    version: '1.0.0',
    group: 'Encoding & Security',
    target: 'selection',
    inputs: [
      {
        name: 'mode',
        label: 'Action',
        type: 'dropdown',
        options: ['Escape HTML Entities', 'Unescape HTML Entities'],
        defaultValue: 'Escape HTML Entities',
      },
    ],
    usedFunctionIds: ['fn_html_entities'],
    code: `async function run(inputs, context) {
  const text = context.targetText || (context.currentTab ? context.currentTab.content : '');
  if (!text) throw new Error("No text found to escape/unescape!");

  const isDecode = inputs.mode === 'Unescape HTML Entities';
  const result = await context.functions.htmlEntities(text, isDecode);
  context.createTab(isDecode ? "HTML Unescaped" : "HTML Escaped", result);
}`,
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  },
];
