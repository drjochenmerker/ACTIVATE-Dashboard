import ContentPage from '@/views/ContentPage.vue';
import HomePage from '@/views/HomePage.vue';
import StartPage from '@/views/StartPage.vue';
import FeedbackPage from '@/views/FeedbackPage.vue';
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import MainLayout from '@/components/MainLayout.vue';
import { useSessionStore } from '@/stores/sessionStore';
import FeedbackThankyouPage from '@/views/FeedbackThankyouPage.vue';
import OptionsPage from '@/views/OptionsPage.vue';
import LoginPage from '@/views/LoginPage.vue';

const routes: Array<RouteRecordRaw> = [
    {
        path: '/login',
        name: 'Login',
        component: LoginPage
    },
    {
        path: '/start',
        name: 'Start',
        component: StartPage
    },
    {
        path: '/feedback/:graph',
        name: 'FeedbackPage',
        component: FeedbackPage,
        props: true
    },
    {
        path: '/feedback-thank-you',
        name: 'FeedbackThankYouPage',
        component: FeedbackThankyouPage
    },
    {
        path: '/',
        component: MainLayout,
        children: [
            { path: '', name: 'HomePage', component: HomePage, props: true }, // Standard-Dashboard
            { path: ':id', name: 'Content', component: ContentPage, props: true }, // Dynamische Inhalte
            { path: 'options', name: 'Options', component: OptionsPage }, // Optionen-Seite für API Keys
        ],
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to) => {
    const sessionStore = useSessionStore();

    const isPublic = to.name === 'FeedbackPage' || to.name === 'FeedbackThankYouPage';
    const isOptionsPage = to.path === '/options';

    // Allow access to options and public pages without active session
    if (isOptionsPage || isPublic) {
        return;
    }

    if (!sessionStore.isSessionActive && to.path !== '/login') {
        return '/login';
    }
});
export default router;
