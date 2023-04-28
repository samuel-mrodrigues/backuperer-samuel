import { createApp } from 'vue'
import { createPinia } from "pinia"
import App from './ComponentesVue/App.vue'

const instanciaPinia = createPinia();

createApp(App).use(instanciaPinia).mount('#app');
