import ContentPage from '@/views/ContentPage.vue';
import HomePage from '@/views/HomePage.vue';
import StartPage from '@/views/StartPage.vue';
import FeedbackPage from '@/views/FeedbackPage.vue';
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import MainLayout from '@/components/MainLayout.vue';
import { useSessionStore } from '@/stores/sessionStore';

const routes: Array<RouteRecordRaw> = [
    {
        path: '/start',
        name: 'Start',
        component: StartPage
    },
    {
        path: '/feedback/:id',
        name: 'Feedback',
        component: FeedbackPage,
        props: true
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
  const sessionStore = useSessionStore();
  const publicPaths = ['/start', '/feedback', '/feedback-thank-you'];

  // Check if the path starts with one of the public ones
  const isPublic = publicPaths.some(publicPath => to.path.startsWith(publicPath));

  if (!sessionStore.isSessionActive && !isPublic) {
    return '/start';
  }
});
// router.beforeEach((to) => {
//     const sessionStore = useSessionStore();
//     if (!sessionStore.isSessionActive && to.path !== '/start') {
//         return '/start';
//     }
// });

export default router;
