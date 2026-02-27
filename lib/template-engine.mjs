/**
 * Minimal Handlebars-like template engine (<100 lines)
 * Supports: {{var}}, {{nested.var}}, {{#if}}, {{#each}}, {{else}}
 */

/**
 * Resolve a dotted path like "integrations.ga4.property_id" from context object
 */
function resolve(ctx, path) {
  return path.split('.').reduce((obj, key) => obj?.[key], ctx);
}

/**
 * Process a template string with the given context
 * @param {string} template - Template string with {{var}}, {{#if}}, {{#each}} blocks
 * @param {object} ctx - Context object for variable resolution
 * @returns {string} Processed string
 */
export function render(template, ctx) {
  let result = template;

  // Process {{#each array}}...{{/each}} blocks (supports nesting)
  result = processBlocks(result, ctx);

  // Process simple {{var}} replacements
  result = result.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, path) => {
    const val = resolve(ctx, path);
    return val != null ? String(val) : '';
  });

  return result;
}

function processBlocks(str, ctx) {
  // Process from innermost blocks outward
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
        return arr.map((item, index) => {
          const itemCtx = typeof item === 'object'
            ? { ...ctx, ...item, '@index': index, '@first': index === 0, '@last': index === arr.length - 1 }
            : { ...ctx, this: item, '@index': index, '@first': index === 0, '@last': index === arr.length - 1 };
          return render(body, itemCtx);
        }).join('');
      }
    );

    // {{#if path}}...{{else}}...{{/if}}
    result = result.replace(
      /\{\{#if\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/,
      (_, path, ifBody, elseBody) => {
        changed = true;
        const val = resolve(ctx, path);
        return isTruthy(val) ? render(ifBody, ctx) : render(elseBody, ctx);
      }
    );

    // {{#if path}}...{{/if}} (no else)
    result = result.replace(
      /\{\{#if\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/if\}\}/,
      (_, path, body) => {
        changed = true;
        const val = resolve(ctx, path);
        return isTruthy(val) ? render(body, ctx) : '';
      }
    );

    // {{#unless path}}...{{/unless}}
    result = result.replace(
      /\{\{#unless\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/unless\}\}/,
      (_, path, body) => {
        changed = true;
        const val = resolve(ctx, path);
        return !isTruthy(val) ? render(body, ctx) : '';
      }
    );
  }

  return result;
}

function isTruthy(val) {
  if (val == null) return false;
  if (val === false) return false;
  if (val === '') return false;
  if (val === 0) return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
}
