import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { installPersistence } from './stores/persist'

const app = createApp(App)
app.use(createPinia())
installPersistence()
app.mount('#app')
