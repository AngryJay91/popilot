/**
 * Feature flags — resolves enabled features from project config.
 *
 * Reads from VITE_FEATURES env variable (comma-separated list)
 * or defaults to all features enabled in API mode, minimal in static mode.
 *
 * Usage:
 *   import { isFeatureEnabled, enabledFeatures } from '@/features'
 *   if (isFeatureEnabled('board')) { ... }
 */
import { isStaticMode } from '@/api/client';
/** All available features */
export const ALL_FEATURES = [
    'dashboard',
    'board',
    'standup',
    'retro',
    'inbox',
    'specs',
    'admin',
    'meetings',
    'docs',
    'my-page',
    'rewards',
];
/** Features available in static mode (no backend needed) */
const STATIC_FEATURES = ['specs', 'retro'];
/** Features that require API mode */
const API_ONLY_FEATURES = [
    'dashboard',
    'board',
    'standup',
    'inbox',
    'admin',
    'meetings',
    'docs',
    'my-page',
];
function resolveFeatures() {
    const envFeatures = import.meta.env.VITE_FEATURES;
    if (envFeatures) {
        // Explicit feature list from env
        const ids = envFeatures.split(',').map(s => s.trim());
        return new Set(ids.filter(id => ALL_FEATURES.includes(id)));
    }
    if (isStaticMode()) {
        return new Set(STATIC_FEATURES);
    }
    // API mode: all features enabled by default
    return new Set(ALL_FEATURES);
}
const _enabledFeatures = resolveFeatures();
/** Check if a feature is enabled */
export function isFeatureEnabled(id) {
    return _enabledFeatures.has(id);
}
/** Get all enabled features */
export function enabledFeatures() {
    return ALL_FEATURES.filter(id => _enabledFeatures.has(id));
}
export function getNavItems() {
    const items = [
        { id: 'dashboard', label: 'Dashboard', path: '/', icon: '📊' },
        { id: 'board', label: 'Board', path: '/board', icon: '📋' },
        { id: 'standup', label: 'Standup', path: '/standup', icon: '☀️' },
        { id: 'retro', label: 'Retro', path: '/retro', icon: '🔄' },
        { id: 'inbox', label: 'Inbox', path: '/inbox', icon: '📬' },
        { id: 'specs', label: 'Specs', path: '/specs', icon: '📐' },
        { id: 'docs', label: 'Docs', path: '/docs', icon: '📄' },
        { id: 'meetings', label: 'Meetings', path: '/meetings', icon: '🗓️' },
        { id: 'rewards', label: 'Rewards', path: '/rewards', icon: '🏆' },
        { id: 'admin', label: 'Admin', path: '/admin', icon: '⚙️' },
    ];
    return items.filter(item => isFeatureEnabled(item.id));
}
