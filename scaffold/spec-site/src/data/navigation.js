/**
 * Navigation — Feature page definitions for static mode.
 *
 * In API mode, sprints/epics come from useNavStore.
 * This file defines feature pages (wireframe pages) which are
 * always statically configured regardless of mode.
 */
/** Feature pages for the sidebar navigation -- TODO: Add your feature pages */
export const featurePages = [];
export function isValidFeaturePage(id) {
    return featurePages.some(p => p.id === id);
}
/** All navigable pages (features + extras like retro) */
export const allPages = [...featurePages];
