import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './styles/main.css';

const app = createApp(App);

// Pinia 状态管理
const pinia = createPinia();
app.use(pinia);

// 路由
app.use(router);

// Element Plus
app.use(ElementPlus);

app.mount('#app');