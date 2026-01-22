<script setup lang="ts">
import { computed } from 'vue';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { staticContent } from '@/data/contentData';
import { SceneChange } from '@/data/knowledge_graph/structures';
import { useSessionStore } from '@/stores/sessionStore';

const sessionStore = useSessionStore();
function handleSceneChange(newScene: string) {
    sessionStore.activeScene = newScene;
    sessionStore.outdated = true;
}
const sceneLabels = computed(() => ({
    [SceneChange.Scene1]: staticContent.homepage.navbarScene[sessionStore.activeLanguage] + ' 1',
    [SceneChange.Scene2]: staticContent.homepage.navbarScene[sessionStore.activeLanguage] + ' 2',
}));
</script>

<template>
    <div class="flex flex-row gap-2 items-center w-32">
        <Select id="sceneSelect" :default-value="SceneChange.Scene1" @update:model-value="handleSceneChange">
            <SelectTrigger class="w-[180px] overflow-hidden whitespace-nowrap truncate">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem v-for="scene in Object.entries(SceneChange)" :key="scene[1]" :value="scene[1]">
                    {{ sceneLabels[scene[1]] }}
                </SelectItem>
            </SelectContent>
        </Select>
    </div>
</template>
