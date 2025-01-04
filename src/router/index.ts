import ContentPage from '@/views/ContentPage.vue';
import HomePage from '@/views/HomePage.vue';
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

// Routen definieren
const routes: Array<RouteRecordRaw> = [
    { path: '/', name: 'Home', component: HomePage },
    { path: '/:id', name: 'Content', component: ContentPage },
];

// Router erstellen
const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
