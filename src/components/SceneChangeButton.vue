<script setup lang="ts">
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { SceneChange } from '@/data/knowledge_graph/structures';
import { useSessionStore } from '@/stores/sessionStore';

const sessionStore = useSessionStore();
function handleSceneChange(newScene: string) {
    sessionStore.activeScene = newScene;
    sessionStore.outdated = true;
}
</script>

<template>
    <div class="flex flex-row gap-2 items-center w-32">
        <Select :default-value="SceneChange.Scene1" id="sceneSelect" @update:model-value="handleSceneChange">
            <SelectTrigger class="w-[180px] overflow-hidden whitespace-nowrap truncate">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem v-for="scene in Object.entries(SceneChange)" :value="scene[1]">
                    {{ scene[0] }}
                </SelectItem>
            </SelectContent>
        </Select>
    </div>
</template>