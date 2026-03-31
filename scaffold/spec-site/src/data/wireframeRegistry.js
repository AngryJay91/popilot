/** Wireframe page registry: pageId -> sprint -> config */
export const wireframePages = {};
export function getWireframe(pageId, sprint) {
    return wireframePages[pageId]?.[sprint] ?? null;
}
export function getAvailableSprints(pageId) {
    return Object.keys(wireframePages[pageId] ?? {});
}
