/**
 * Media query composable — generic reactive media query wrapper.
 *
 * Usage: const isMobile = useMediaQuery('(max-width: 767px)')
 */
import { ref, onMounted, onUnmounted } from 'vue';
export function useMediaQuery(query) {
    const matches = ref(false);
    let mql = null;
    function update(e) {
        matches.value = e.matches;
    }
    onMounted(() => {
        mql = window.matchMedia(query);
        matches.value = mql.matches;
        mql.addEventListener('change', update);
    });
    onUnmounted(() => {
        mql?.removeEventListener('change', update);
    });
    return matches;
}
