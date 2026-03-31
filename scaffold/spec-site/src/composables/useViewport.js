import { ref, provide, inject, readonly } from 'vue';
const VIEWPORT_KEY = '__viewport_mode__';
const _mode = ref('desktop');
export function provideViewport() {
    provide(VIEWPORT_KEY, _mode);
    function toggle() {
        _mode.value = _mode.value === 'desktop' ? 'mobile' : 'desktop';
    }
    function setMode(m) {
        _mode.value = m;
    }
    return { mode: readonly(_mode), toggle, setMode };
}
export function useViewport() {
    const mode = inject(VIEWPORT_KEY, _mode);
    return { mode: readonly(mode) };
}
