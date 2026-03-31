import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
const items = [
    { title: 'Heading 1', icon: 'H1', command: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
    { title: 'Heading 2', icon: 'H2', command: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
    { title: 'Heading 3', icon: 'H3', command: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
    { title: 'Bullet List', icon: '•', command: (e) => e.chain().focus().toggleBulletList().run() },
    { title: 'Numbered List', icon: '1.', command: (e) => e.chain().focus().toggleOrderedList().run() },
    { title: 'Code Block', icon: '<>', command: (e) => e.chain().focus().toggleCodeBlock().run() },
    { title: 'Blockquote', icon: '"', command: (e) => e.chain().focus().toggleBlockquote().run() },
    { title: 'Table', icon: '⊞', command: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { title: 'Divider', icon: '—', command: (e) => e.chain().focus().setHorizontalRule().run() },
    { title: 'Embed', icon: '🔗', command: (e) => {
            const url = prompt('Enter the URL to embed:');
            if (url)
                e.chain().focus().insertContent(`<p><a href="${url}" target="_blank">${url}</a></p>`).run();
        } },
    { title: 'Sub Page', icon: '📑', command: async (e) => {
            const title = prompt('Sub page title:');
            if (!title)
                return;
            const match = window.location.pathname.match(/\/docs\/([^/]+)/);
            const parentId = match?.[1] || null;
            const slug = `sub-${Date.now()}`;
            try {
                const { apiPut } = await import('@/composables/useTurso');
                const { error } = await apiPut(`/api/v2/docs/${slug}`, { title, content: '', contentFormat: 'markdown', parentId });
                if (error) {
                    alert(`Failed to create sub page: ${error}`);
                    return;
                }
                e.chain().focus().insertContent(`<p><a href="/docs/${slug}">${title}</a></p>`).run();
            }
            catch (err) {
                alert(`Failed to create sub page: ${err}`);
            }
        } },
];
export const SlashCommand = Extension.create({
    name: 'slashCommand',
    addOptions() {
        return {
            suggestion: {
                char: '/',
                items: ({ query }) => items.filter(i => i.title.toLowerCase().includes(query.toLowerCase())),
                render: () => {
                    let popup = null;
                    let selectedIndex = 0;
                    let currentItems = [];
                    function updatePopup() {
                        if (!popup)
                            return;
                        popup.innerHTML = currentItems.map((item, i) => `<div class="slash-item${i === selectedIndex ? ' slash-active' : ''}" data-index="${i}">
                <span class="slash-icon">${item.icon}</span>
                <span>${item.title}</span>
              </div>`).join('');
                    }
                    return {
                        onStart(props) {
                            currentItems = props.items;
                            selectedIndex = 0;
                            popup = document.createElement('div');
                            popup.className = 'slash-menu';
                            popup.addEventListener('click', (e) => {
                                const target = e.target.closest('.slash-item');
                                if (target) {
                                    const idx = Number(target.getAttribute('data-index'));
                                    currentItems[idx]?.command(props.editor);
                                    props.command({});
                                }
                            });
                            updatePopup();
                            const { view } = props.editor;
                            const coords = view.coordsAtPos(props.range.from);
                            popup.style.position = 'fixed';
                            popup.style.left = `${coords.left}px`;
                            popup.style.top = `${coords.bottom + 4}px`;
                            document.body.appendChild(popup);
                        },
                        onUpdate(props) {
                            currentItems = props.items;
                            selectedIndex = 0;
                            updatePopup();
                        },
                        onKeyDown(props) {
                            if (props.event.key === 'ArrowDown') {
                                selectedIndex = (selectedIndex + 1) % currentItems.length;
                                updatePopup();
                                return true;
                            }
                            if (props.event.key === 'ArrowUp') {
                                selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
                                updatePopup();
                                return true;
                            }
                            if (props.event.key === 'Enter') {
                                currentItems[selectedIndex]?.command(props.editor);
                                props.command({});
                                return true;
                            }
                            return false;
                        },
                        onExit() {
                            popup?.remove();
                            popup = null;
                        },
                    };
                },
            },
        };
    },
    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});
