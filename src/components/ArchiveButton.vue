<script setup lang="ts">
import { ButtonComponent } from '@/components/ui/button';
import { useSessionStore } from '@/stores/sessionStore';
import { Archive } from 'lucide-vue-next';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { staticContent } from '@/data/contentData';
import { useRouter } from 'vue-router';

const sessionStore = useSessionStore();
const router = useRouter();

const goArchive = () => {
    router.push('/archive');
};
</script>

<template>
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger as-child>
                <ButtonComponent size="icon" class="rounded-full" variant="secondary" @click="goArchive">
                    <Archive />
                </ButtonComponent>
            </TooltipTrigger>
            <TooltipContent>
                <p>{{ staticContent.terms.archive[sessionStore.activeLanguage] }}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
</template>
