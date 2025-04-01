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

const sessionStore = useSessionStore();


const logout = () => {
    sessionStore.endSession();
};
</script>

<template>
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger as-child>
                <Button size="icon" class="rounded-full" @click="logout">
                    <LogOut />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>End session</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
</template>
