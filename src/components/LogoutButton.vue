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
    sessionStore.endSession();
    router.replace({
        path: '/login',
        query: { redirect: route.fullPath }
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
