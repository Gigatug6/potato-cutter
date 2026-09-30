import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/main.css'
import { installPersistence } from './stores/persist'

const app = createApp(App)
app.use(createPinia())
installPersistence()
app.mount('#app')

// hors-ligne + rechargements instantanés (production uniquement)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
