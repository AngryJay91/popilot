/**
 * Mockup builder component catalog
 */

export interface ComponentDef {
  id: string
  name: string
  category: string
  icon: string
  allowChildren: boolean
  defaultProps: Record<string, unknown>
}

export const COMPONENT_CATALOG: ComponentDef[] = [
  // Layout
  { id: 'container', name: 'Container', category: 'Layout', icon: '📦', allowChildren: true, defaultProps: { direction: 'column', gap: 8, padding: 16 } },
  { id: 'page-wrapper', name: 'PageWrapper', category: 'Layout', icon: '📄', allowChildren: true, defaultProps: { maxWidth: 1200, padding: 24 } },
  { id: 'widget-wrapper', name: 'WidgetWrapper', category: 'Layout', icon: '🧩', allowChildren: true, defaultProps: { title: 'Widget', padding: 16, borderRadius: 12 } },
  { id: 'sidebar', name: 'Sidebar', category: 'Layout', icon: '📐', allowChildren: true, defaultProps: { width: 200, position: 'left', w: 200, h: 400, menuItems: [
    { text: 'Home', icon: '🏠', link: '' },
    { text: 'Dashboard', icon: '📊', link: '' },
    { text: 'Projects', icon: '📦', link: '' },
    { text: 'Reports', icon: '📈', link: '' },
    { text: 'Analytics', icon: '🔍', link: '' },
    { text: 'Settings', icon: '⚙️', link: '' },
  ] } },
  { id: 'row', name: 'Row', category: 'Layout', icon: '↔️', allowChildren: true, defaultProps: { direction: 'row', gap: 8, padding: 0 } },
  { id: 'column', name: 'Column', category: 'Layout', icon: '↕️', allowChildren: true, defaultProps: { direction: 'column', gap: 8, padding: 0 } },

  // Typography
  { id: 'page-title', name: 'PageTitle', category: 'Typography', icon: '🔤', allowChildren: false, defaultProps: { text: 'Page Title', level: 'h1' } },
  { id: 'text', name: 'Text', category: 'Typography', icon: '📝', allowChildren: false, defaultProps: { text: 'Text content', size: 14, color: '#333' } },
  { id: 'label', name: 'Label', category: 'Typography', icon: '🏷️', allowChildren: false, defaultProps: { text: 'Label', size: 12, color: '#888' } },
  { id: 'hint', name: 'Hint', category: 'Typography', icon: '💡', allowChildren: false, defaultProps: { text: 'Hint text', size: 11, color: '#999' } },

  // Input
  { id: 'text-field', name: 'TextField', category: 'Input', icon: '✏️', allowChildren: false, defaultProps: { placeholder: 'Enter text...', label: 'Field name', width: '100%' } },
  { id: 'checkbox', name: 'Checkbox', category: 'Input', icon: '☑️', allowChildren: false, defaultProps: { label: 'Checkbox', checked: false } },
  { id: 'radio', name: 'Radio', category: 'Input', icon: '🔘', allowChildren: false, defaultProps: { label: 'Radio', options: ['Option 1', 'Option 2'] } },
  { id: 'date-picker', name: 'DatePicker', category: 'Input', icon: '📅', allowChildren: false, defaultProps: { label: 'Select date', placeholder: 'YYYY-MM-DD' } },
  { id: 'combobox', name: 'Combobox', category: 'Input', icon: '📋', allowChildren: false, defaultProps: { label: 'Select', options: ['Item 1', 'Item 2', 'Item 3'] } },
  { id: 'switch', name: 'SwitchButton', category: 'Input', icon: '🔀', allowChildren: false, defaultProps: { label: 'Switch', checked: false } },

  // Data
  { id: 'data-grid', name: 'DataGrid', category: 'Data', icon: '📊', allowChildren: false, defaultProps: { columns: ['Name', 'Value', 'Status'], rows: 5, w: 400, h: 300 } },
  { id: 'chart', name: 'Chart', category: 'Data', icon: '📈', allowChildren: false, defaultProps: { type: 'bar', title: 'Chart', height: 200 } },
  { id: 'trend-chart', name: 'TrendChart', category: 'Data', icon: '📉', allowChildren: false, defaultProps: { title: 'Trend', height: 160 } },

  // Action
  { id: 'button', name: 'Button', category: 'Action', icon: '🔵', allowChildren: false, defaultProps: { text: 'Button', variant: 'primary', size: 'md', onClick: '', w: 120, h: 40 } },
  { id: 'pagination', name: 'Pagination', category: 'Action', icon: '📑', allowChildren: false, defaultProps: { totalPages: 10, current: 1 } },

  // Feedback
  { id: 'alert', name: 'Alert', category: 'Feedback', icon: '⚠️', allowChildren: false, defaultProps: { message: 'Alert message', type: 'info' } },
  { id: 'loading', name: 'Loading', category: 'Feedback', icon: '⏳', allowChildren: false, defaultProps: { text: 'Loading...' } },
  { id: 'no-data', name: 'NoData', category: 'Feedback', icon: '🚫', allowChildren: false, defaultProps: { message: 'No data' } },

  // Custom
  { id: 'card', name: 'Card', category: 'Custom', icon: '🃏', allowChildren: true, defaultProps: { title: 'Card', content: 'Enter content here', imageUrl: '', padding: 16, borderRadius: 8, w: 300, h: 200 } },
  { id: 'divider', name: 'Divider', category: 'Custom', icon: '➖', allowChildren: false, defaultProps: { margin: 16 } },
  { id: 'spacer', name: 'Spacer', category: 'Custom', icon: '⬜', allowChildren: false, defaultProps: { height: 24 } },
]

export const CATEGORIES = [...new Set(COMPONENT_CATALOG.map(c => c.category))]

export function getComponentDef(id: string): ComponentDef | undefined {
  return COMPONENT_CATALOG.find(c => c.id === id)
}
