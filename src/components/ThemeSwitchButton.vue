<script setup lang="ts">
import { CustomButton } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-vue-next';
import { useColorMode } from '@vueuse/core';
import { CustomTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSessionStore } from '@/stores/sessionStore';
import { staticContent } from '@/data/contentData';

// Component representing a button that toggles the dark/light mode

const mode = useColorMode();

const sessionStore = useSessionStore();
const toggleMode = () => {
    mode.value = mode.value === 'dark' ? 'light' : 'dark';
};
</script>

<template>
    <TooltipProvider>
        <CustomTooltip>
            <TooltipTrigger as-child>
                <CustomButton size="icon" class="rounded-full" variant="secondary" @click="toggleMode">
                    <Sun v-if="mode === 'dark'" />
                    <Moon v-else />
                </CustomButton>
            </TooltipTrigger>
            <TooltipContent>
                <p>{{ staticContent.terms.changeTheme[sessionStore.activeLanguage] }}</p>
            </TooltipContent>
        </CustomTooltip>
    </TooltipProvider>
</template>
