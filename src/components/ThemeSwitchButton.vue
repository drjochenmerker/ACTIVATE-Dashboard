<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-vue-next';
import { useColorMode } from '@vueuse/core';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

// Component representing a button that toggles the dark/light mode

const mode = useColorMode();

const toggleMode = () => {
    mode.value = mode.value === 'dark' ? 'light' : 'dark';
};
</script>

<template>
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger as-child>
                <Button size="icon" class="rounded-full" @click="toggleMode">
                    <Sun v-if="mode === 'dark'" />
                    <Moon v-else />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Change theme</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
</template>
