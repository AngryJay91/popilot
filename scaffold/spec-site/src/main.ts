import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { loadNavData } from './composables/useNavStore'
import { isApiMode } from './api/client'
import './styles/variables.css'
import './styles/base.css'
import './styles/split-pane.css'

const app = createApp(App)
app.use(router)
app.mount('#app')

// Load navigation data from API (if in API mode)
if (isApiMode()) {
  loadNavData()
}
