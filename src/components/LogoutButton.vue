<script setup lang="ts">
import { CustomButton } from '@/components/ui/button';
import { useSessionStore } from '@/stores/sessionStore';
import { LogOut } from 'lucide-vue-next';
import { CustomTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { staticContent } from '@/data/contentData';

const sessionStore = useSessionStore();

const logout = () => {
    sessionStore.endSession();
};
</script>

<template>
    <TooltipProvider>
        <CustomTooltip>
            <TooltipTrigger as-child>
                <CustomButton size="icon" class="rounded-full" variant="secondary" @click="logout">
                    <LogOut />
                </CustomButton>
            </TooltipTrigger>
            <TooltipContent>
                <p>{{ staticContent.terms.endSession[sessionStore.activeLanguage] }}</p>
            </TooltipContent>
        </CustomTooltip>
    </TooltipProvider>
</template>
