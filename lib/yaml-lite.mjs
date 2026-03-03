/**
 * Minimal YAML parser — zero dependencies.
 * Supports the subset used by project.yaml, _registry.yaml, and provider YAML files:
 *   - Scalars (string, number, boolean, null)
 *   - Inline flow sequences: [a, b, c]
 *   - Inline flow mappings: { key: val, key2: val2 }
 *   - Block sequences (- item)
 *   - Nested maps (indented keys)
 *   - Multi-line literal blocks (|)
 *   - Comments (#)
 *   - Quoted strings ("..." and '...')
 *
 * NOT supported: anchors/aliases (&, *), tags (!!), complex flow styles, merge keys (<<)
 */

/**
 * Parse a YAML string into a JS object.
 * @param {string} yaml
 * @returns {any}
 */
export function parse(yaml) {
  const lines = yaml.split('\n');
  const { value } = parseNode(lines, 0, -1);
  return value;
}

/**
 * Serialize a JS object to YAML string.
 * @param {any} obj
 * @param {number} [indent=0]
 * @returns {string}
 */
export function stringify(obj, indent = 0) {
  if (obj == null) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') return stringifyString(obj, indent);
  if (Array.isArray(obj)) return stringifyArray(obj, indent);
  return stringifyMap(obj, indent);
}

// ── Parser internals ────────────────────────────────────

function parseNode(lines, startIdx, parentIndent) {
  if (startIdx >= lines.length) return { value: null, nextIdx: startIdx };

  // Skip blank lines and comments to find the first meaningful line
  let idx = startIdx;
  while (idx < lines.length) {
    const stripped = lines[idx].replace(/#.*$/, '').trim();
    if (stripped !== '') break;
    idx++;
  }
  if (idx >= lines.length) return { value: null, nextIdx: idx };

  const line = lines[idx];
  const lineIndent = getIndent(line);
  const content = stripComment(line).trim();

  // If this line starts a sequence item at the current level
  if (content.startsWith('- ') || content === '-') {
    return parseBlockSequence(lines, idx, lineIndent);
  }

  // If this line is a mapping key
  if (content.includes(':')) {
    return parseBlockMapping(lines, idx, lineIndent);
  }

  // Standalone scalar
  return { value: parseScalar(content), nextIdx: idx + 1 };
}

function parseBlockMapping(lines, startIdx, mapIndent) {
  const result = {};
  let idx = startIdx;

  while (idx < lines.length) {
    // Skip blank lines and comments
    const raw = lines[idx];
    const stripped = stripComment(raw).trim();
    if (stripped === '') { idx++; continue; }

    const lineIndent = getIndent(raw);

    // If dedented past our map level, we're done
    if (lineIndent < mapIndent) break;
    // If at a deeper indent and we're not at the start, it's a child — break
    if (lineIndent > mapIndent && idx !== startIdx) break;
    // If at the same indent but not a key, break
    if (lineIndent === mapIndent && !stripped.includes(':') && !stripped.startsWith('#')) break;

    // Handle comment-only lines
    if (stripped.startsWith('#')) { idx++; continue; }

    // Extract key:value
    const colonMatch = stripped.match(/^([^\s:][^:]*?|"[^"]*"|'[^']*')\s*:\s*(.*)/);
    if (!colonMatch) { idx++; continue; }

    let key = colonMatch[1].trim();
    // Unquote key
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
      key = key.slice(1, -1);
    }
    const inlineVal = colonMatch[2].trim();

    if (inlineVal === '|') {
      // Literal block scalar
      const { value, nextIdx } = parseLiteralBlock(lines, idx + 1, mapIndent);
      result[key] = value;
      idx = nextIdx;
    } else if (inlineVal === '>') {
      // Folded block scalar
      const { value, nextIdx } = parseFoldedBlock(lines, idx + 1, mapIndent);
      result[key] = value;
      idx = nextIdx;
    } else if (inlineVal) {
      // Inline value
      result[key] = parseInlineValue(inlineVal);
      idx++;
    } else {
      // Value on next lines (nested map or sequence)
      idx++;
      // Find next non-blank, non-comment line to determine child structure
      let childIdx = idx;
      while (childIdx < lines.length) {
        const cs = stripComment(lines[childIdx]).trim();
        if (cs !== '') break;
        childIdx++;
      }
      if (childIdx >= lines.length || getIndent(lines[childIdx]) <= mapIndent) {
        // No child — empty value
        result[key] = null;
      } else {
        const childIndent = getIndent(lines[childIdx]);
        const childContent = stripComment(lines[childIdx]).trim();
        if (childContent.startsWith('- ') || childContent === '-') {
          const { value, nextIdx } = parseBlockSequence(lines, childIdx, childIndent);
          result[key] = value;
          idx = nextIdx;
        } else {
          const { value, nextIdx } = parseBlockMapping(lines, childIdx, childIndent);
          result[key] = value;
          idx = nextIdx;
        }
      }
    }
  }

  return { value: result, nextIdx: idx };
}

function parseBlockSequence(lines, startIdx, seqIndent) {
  const result = [];
  let idx = startIdx;

  while (idx < lines.length) {
    const raw = lines[idx];
    const stripped = stripComment(raw).trim();
    if (stripped === '') { idx++; continue; }

    const lineIndent = getIndent(raw);
    if (lineIndent < seqIndent) break;
    if (lineIndent > seqIndent) break; // unexpected deeper indent outside a sequence item

    if (!stripped.startsWith('-')) break;

    // Get the content after "- "
    const afterDash = stripped.slice(1).trim();

    if (afterDash === '' || afterDash === '|') {
      if (afterDash === '|') {
        const { value, nextIdx } = parseLiteralBlock(lines, idx + 1, seqIndent);
        result.push(value);
        idx = nextIdx;
      } else {
        // Block item with nested content on next lines
        idx++;
        let childIdx = idx;
        while (childIdx < lines.length && stripComment(lines[childIdx]).trim() === '') childIdx++;
        if (childIdx < lines.length && getIndent(lines[childIdx]) > seqIndent) {
          const childIndent = getIndent(lines[childIdx]);
          const childContent = stripComment(lines[childIdx]).trim();
          if (childContent.startsWith('- ')) {
            const { value, nextIdx } = parseBlockSequence(lines, childIdx, childIndent);
            result.push(value);
            idx = nextIdx;
          } else {
            const { value, nextIdx } = parseBlockMapping(lines, childIdx, childIndent);
            result.push(value);
            idx = nextIdx;
          }
        } else {
          result.push(null);
        }
      }
    } else if (afterDash.startsWith('{')) {
      // Inline flow mapping
      result.push(parseInlineValue(afterDash));
      idx++;
    } else if (afterDash.startsWith('[')) {
      result.push(parseInlineValue(afterDash));
      idx++;
    } else if (afterDash.includes(':')) {
      // Mapping starting on the "- " line
      // e.g., "- key: value" — parse as a mapping item
      // The first key-value is on this line, more may follow indented
      const itemIndent = seqIndent + 2; // standard indent after "- "
      // Reconstruct as if the key:value is at itemIndent
      const tempLine = ' '.repeat(itemIndent) + afterDash;
      const tempLines = [tempLine, ...lines.slice(idx + 1)];
      const { value, nextIdx } = parseBlockMapping(tempLines, 0, itemIndent);
      // nextIdx is relative to tempLines; adjust
      idx = idx + 1 + (nextIdx - 1);
      result.push(value);
    } else {
      // Simple scalar item
      result.push(parseScalar(afterDash));
      idx++;
    }
  }

  return { value: result, nextIdx: idx };
}

function parseLiteralBlock(lines, startIdx, parentIndent) {
  let idx = startIdx;
  // Determine block indent from first non-empty line
  while (idx < lines.length && lines[idx].trim() === '') idx++;
  if (idx >= lines.length) return { value: '', nextIdx: idx };

  const blockIndent = getIndent(lines[idx]);
  if (blockIndent <= parentIndent) return { value: '', nextIdx: idx };

  const collected = [];
  while (idx < lines.length) {
    const raw = lines[idx];
    if (raw.trim() === '') {
      collected.push('');
      idx++;
      continue;
    }
    const li = getIndent(raw);
    if (li < blockIndent) break;
    collected.push(raw.slice(blockIndent));
    idx++;
  }

  // Trim trailing empty lines
  while (collected.length > 0 && collected[collected.length - 1] === '') collected.pop();
  return { value: collected.join('\n'), nextIdx: idx };
}

function parseFoldedBlock(lines, startIdx, parentIndent) {
  // Same as literal for our purposes, but join with spaces instead of newlines
  const { value, nextIdx } = parseLiteralBlock(lines, startIdx, parentIndent);
  // For simplicity, keep as-is (folded blocks in our providers use it like literal)
  return { value, nextIdx };
}

// ── Inline value parsing ────────────────────────────────

function parseInlineValue(str) {
  const s = str.trim();
  if (s.startsWith('[') && s.endsWith(']')) return parseFlowSequence(s);
  if (s.startsWith('{') && s.endsWith('}')) return parseFlowMapping(s);
  return parseScalar(s);
}

function parseFlowSequence(str) {
  const inner = str.slice(1, -1).trim();
  if (inner === '') return [];
  return splitFlow(inner).map(item => parseInlineValue(item.trim()));
}

function parseFlowMapping(str) {
  const inner = str.slice(1, -1).trim();
  if (inner === '') return {};
  const result = {};
  const pairs = splitFlow(inner);
  for (const pair of pairs) {
    const colonIdx = pair.indexOf(':');
    if (colonIdx === -1) continue;
    let key = pair.slice(0, colonIdx).trim();
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
      key = key.slice(1, -1);
    }
    const val = pair.slice(colonIdx + 1).trim();
    result[key] = parseInlineValue(val);
  }
  return result;
}

/** Split flow-style items, respecting nested brackets and quotes */
function splitFlow(str) {
  const items = [];
  let depth = 0;
  let current = '';
  let inQuote = null;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inQuote) {
      current += ch;
      if (ch === inQuote) inQuote = null;
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
      current += ch;
    } else if (ch === '[' || ch === '{') {
      depth++;
      current += ch;
    } else if (ch === ']' || ch === '}') {
      depth--;
      current += ch;
    } else if (ch === ',' && depth === 0) {
      items.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) items.push(current);
  return items;
}

function parseScalar(str) {
  let s = str.trim();

  // Handle comments after value
  // But not inside quotes
  if (!s.startsWith('"') && !s.startsWith("'")) {
    const commentIdx = findCommentStart(s);
    if (commentIdx > 0) s = s.slice(0, commentIdx).trim();
  }

  // Quoted strings
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  // Boolean
  if (s === 'true') return true;
  if (s === 'false') return false;
  // Null
  if (s === 'null' || s === '~' || s === '') return null;
  // Number
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

function findCommentStart(str) {
  // Find # that's preceded by whitespace and not inside quotes
  for (let i = 1; i < str.length; i++) {
    if (str[i] === '#' && /\s/.test(str[i - 1])) return i;
  }
  return -1;
}

// ── Comment stripping ───────────────────────────────────

function stripComment(line) {
  // Don't strip inside quotes
  let inQuote = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === inQuote) inQuote = null;
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (ch === '#') {
      // Only treat as comment if preceded by whitespace or at start
      if (i === 0 || /\s/.test(line[i - 1])) {
        return line.slice(0, i);
      }
    }
  }
  return line;
}

function getIndent(line) {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

// ── Serializer internals ────────────────────────────────

function stringifyString(str, indent) {
  // Use literal block for multi-line strings
  if (str.includes('\n')) {
    const pad = ' '.repeat(indent + 2);
    return '|\n' + str.split('\n').map(l => pad + l).join('\n');
  }
  // Quote if contains special chars
  if (needsQuoting(str)) return `"${str.replace(/"/g, '\\"')}"`;
  return str;
}

function needsQuoting(str) {
  if (str === '') return true;
  if (str === 'true' || str === 'false' || str === 'null' || str === '~') return true;
  if (/^-?\d+(\.\d+)?$/.test(str)) return true;
  if (/[:{}\[\],&*?|>!%@`#]/.test(str)) return true;
  if (str.startsWith(' ') || str.endsWith(' ')) return true;
  return false;
}

function stringifyArray(arr, indent) {
  if (arr.length === 0) return '[]';
  // For arrays of simple scalars, use inline flow
  if (arr.every(v => v == null || typeof v !== 'object')) {
    const items = arr.map(v => {
      if (v == null) return 'null';
      if (typeof v === 'string') return needsQuoting(v) ? `"${v}"` : v;
      return String(v);
    });
    return `[${items.join(', ')}]`;
  }
  // Block sequence for complex items
  const pad = ' '.repeat(indent);
  return arr.map(item => {
    if (item == null) return `${pad}- null`;
    if (typeof item !== 'object') {
      return `${pad}- ${stringify(item, indent + 2)}`;
    }
    // Object item: render keys at indent+2 (after "- "), first key on same line as "-"
    const entries = Object.entries(item);
    const lines = entries.map(([key, val]) => {
      const qKey = needsQuoting(key) ? `"${key}"` : key;
      if (val == null) return `${qKey}: null`;
      if (typeof val === 'string' && val.includes('\n')) {
        return `${qKey}: ${stringifyString(val, indent + 2)}`;
      }
      if (typeof val !== 'object') {
        return `${qKey}: ${stringify(val, indent + 4)}`;
      }
      if (Array.isArray(val)) {
        if (val.length === 0) return `${qKey}: []`;
        if (val.every(v => v == null || typeof v !== 'object')) {
          return `${qKey}: ${stringify(val, indent + 4)}`;
        }
        return `${qKey}:\n${stringify(val, indent + 4)}`;
      }
      return `${qKey}:\n${stringify(val, indent + 4)}`;
    });
    const contentPad = ' '.repeat(indent + 2);
    let result = `${pad}- ${lines[0]}`;
    for (let i = 1; i < lines.length; i++) {
      result += `\n${contentPad}${lines[i]}`;
    }
    return result;
  }).join('\n');
}

function stringifyMap(obj, indent) {
  const pad = ' '.repeat(indent);
  const entries = Object.entries(obj);
  if (entries.length === 0) return '{}';
  return entries.map(([key, val]) => {
    const qKey = needsQuoting(key) ? `"${key}"` : key;
    if (val == null) return `${pad}${qKey}: null`;
    if (typeof val === 'string' && val.includes('\n')) {
      return `${pad}${qKey}: ${stringifyString(val, indent)}`;
    }
    if (typeof val !== 'object') {
      return `${pad}${qKey}: ${stringify(val, indent + 2)}`;
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return `${pad}${qKey}: []`;
      if (val.every(v => v == null || typeof v !== 'object')) {
        return `${pad}${qKey}: ${stringify(val, indent + 2)}`;
      }
      return `${pad}${qKey}:\n${stringify(val, indent + 2)}`;
    }
    // Nested map
    return `${pad}${qKey}:\n${stringify(val, indent + 2)}`;
  }).join('\n');
}
