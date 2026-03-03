<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/stores/sessionStore';
import { LogOut } from 'lucide-vue-next';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { staticContent } from '@/data/contentData';
import { useRouter, useRoute } from 'vue-router';

const sessionStore = useSessionStore();
const router = useRouter();
const route = useRoute();

const logout = () => {
    const currentPath = route.fullPath;
    sessionStore.endSession();
    let targetRedirect = '/start';

    if (currentPath.includes('/feedback/')) {
        // important check to prevent redirect loops:
        // if the user is currently on a feedback page, redirect to the start page after logout
        // instead of the feedback page
        targetRedirect = currentPath;
    }

    router.replace({
        path: '/login',
        query: { redirect: targetRedirect }
    });
};
</script>

<template>
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger as-child>
                <Button size="icon" class="rounded-full" variant="secondary" @click="logout">
                    <LogOut />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{{ staticContent.terms.endSession[sessionStore.activeLanguage] }}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
</template>
