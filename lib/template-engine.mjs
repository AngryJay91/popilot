/**
 * Minimal Handlebars-like template engine
 * Supports: {{var}}, {{nested.var}}, {{#if}}, {{#each}}, {{#unless}}, {{else}}
 * Handles code fences and inline code containing template-like syntax.
 */

/**
 * Resolve a dotted path like "integrations.ga4.property_id" from context object
 */
function resolve(ctx, path) {
  return path.split('.').reduce((obj, key) => obj?.[key], ctx);
}

// ── Code fence protection ──────────────────────────────
// Temporarily replace {{ }} tokens inside code fences and inline code
// so they aren't matched by block regexes.

const PLACEHOLDER_PREFIX = '\x00HBS_';

function protect(template) {
  const map = new Map();
  let counter = 0;

  // Protect fenced code blocks: ```...```
  let result = template.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/\{\{[\s\S]*?\}\}/g, (token) => {
      const key = `${PLACEHOLDER_PREFIX}${counter++}\x00`;
      map.set(key, token);
      return key;
    });
  });

  // Protect inline code: `...`
  result = result.replace(/`[^`\n]+`/g, (match) => {
    return match.replace(/\{\{[\s\S]*?\}\}/g, (token) => {
      const key = `${PLACEHOLDER_PREFIX}${counter++}\x00`;
      map.set(key, token);
      return key;
    });
  });

  return { text: result, map };
}

function restore(str, map) {
  let result = str;
  for (const [key, original] of map) {
    result = result.replaceAll(key, original);
  }
  return result;
}

// ── Main render ────────────────────────────────────────

/**
 * Process a template string with the given context
 * @param {string} template - Template string with {{var}}, {{#if}}, {{#each}} blocks
 * @param {object} ctx - Context object for variable resolution
 * @returns {string} Processed string
 */
export function render(template, ctx) {
  // Protect code-fence contents from block matching
  const { text: protected_, map } = protect(template);

  // Process {{#each}}, {{#if}}, {{#unless}} blocks
  let result = processBlocks(protected_, ctx);

  // Process simple {{var}} replacements
  result = result.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, path) => {
    const val = resolve(ctx, path);
    return val != null ? String(val) : '';
  });

  // Restore protected tokens
  result = restore(result, map);

  return result;
}

/**
 * Internal render for block bodies — does NOT protect/restore again
 * since the outer render() already did it.
 */
function renderInner(template, ctx) {
  let result = processBlocks(template, ctx);

  result = result.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, path) => {
    const val = resolve(ctx, path);
    return val != null ? String(val) : '';
  });

  return result;
}

function processBlocks(str, ctx) {
  let result = str;
  let changed = true;

  while (changed) {
    changed = false;

    // {{#each path}}...{{/each}}
    result = result.replace(
      /\{\{#each\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/each\}\}/,
      (_, path, body) => {
        changed = true;
        const arr = resolve(ctx, path);
        if (!Array.isArray(arr) || arr.length === 0) return '';

        // Trim exactly one leading and one trailing newline from body
        // so that template formatting newlines don't accumulate per item
        const trimmedBody = body.replace(/^\n/, '').replace(/\n$/, '');

        return arr.map((item, index) => {
          const itemCtx = typeof item === 'object'
            ? { ...ctx, ...item, '@index': index, '@first': index === 0, '@last': index === arr.length - 1 }
            : { ...ctx, this: item, '@index': index, '@first': index === 0, '@last': index === arr.length - 1 };
          return renderInner(trimmedBody, itemCtx);
        }).join('\n');
      }
    );

    // {{#if path}}...{{else}}...{{/if}}
    result = result.replace(
      /\{\{#if\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/,
      (_, path, ifBody, elseBody) => {
        changed = true;
        const val = resolve(ctx, path);
        return isTruthy(val) ? renderInner(ifBody, ctx) : renderInner(elseBody, ctx);
      }
    );

    // {{#if path}}...{{/if}} (no else)
    result = result.replace(
      /\{\{#if\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/if\}\}/,
      (_, path, body) => {
        changed = true;
        const val = resolve(ctx, path);
        return isTruthy(val) ? renderInner(body, ctx) : '';
      }
    );

    // {{#unless path}}...{{/unless}}
    result = result.replace(
      /\{\{#unless\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/unless\}\}/,
      (_, path, body) => {
        changed = true;
        const val = resolve(ctx, path);
        return !isTruthy(val) ? renderInner(body, ctx) : '';
      }
    );
  }

  return result;
}

function isTruthy(val) {
  if (val == null) return false;
  if (val === false) return false;
  if (val === '' ) return false;
  if (val === 0) return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
}
