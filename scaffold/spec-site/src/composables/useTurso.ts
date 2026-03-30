/**
 * Compatibility re-export — maps useTurso imports to api/client.
 *
 * jangsawang uses `useTurso` as the API client module name.
 * oscar scaffold uses `@/api/client` as the canonical module.
 * This file bridges the two so all page components work without
 * changing every import line.
 */

export {
  apiGet,
  apiPost,
  apiPatch,
  apiPut,
  apiDelete,
  resetReachable,
} from '@/api/client'
