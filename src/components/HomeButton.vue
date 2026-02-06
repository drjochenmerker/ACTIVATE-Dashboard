<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/stores/sessionStore";
import { Home } from "lucide-vue-next";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { staticContent } from "@/data/contentData";
import { useRouter } from "vue-router";

const sessionStore = useSessionStore();
const router = useRouter();

const goHome = () => {
    router.push("/start");
};
</script>

<template>
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger as-child>
                <Button size="icon" class="rounded-full" variant="secondary" @click="goHome">
                    <Home />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{{ staticContent.terms.home[sessionStore.activeLanguage] }}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
</template>
