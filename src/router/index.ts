import ContentPage from '@/views/ContentPage.vue';
import HomePage from '@/views/HomePage.vue';
import StartPage from '@/views/StartPage.vue';
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import MainLayout from '@/components/MainLayout.vue';
import { useSession } from '@/stores/useSession';

const routes: Array<RouteRecordRaw> = [
    {
        path: '/start',
        name: 'Start',
        component: StartPage
    },
    {
        path: '/',
        component: MainLayout,
        children: [
            { path: '', name: 'HomePage', component: HomePage, props: true }, // Standard-Dashboard
            { path: ':id', name: 'Content', component: ContentPage, props: true }, // Dynamische Inhalte
        ],
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to) => {
    const { isSessionActive } = useSession();
  
    if (!isSessionActive.value && to.path !== '/start') {
      return '/start';
    }
  });

export default router;
