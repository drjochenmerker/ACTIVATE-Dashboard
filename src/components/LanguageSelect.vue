<script setup lang="ts">
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { LanguageCode } from '@/data/knowledge_graph/structures';
import { LanguagesIcon } from 'lucide-vue-next';
import { useSessionStore } from '@/stores/sessionStore';

const sessionStore = useSessionStore();

function handleLanguageChange() {
    sessionStore.outdated = true
}
</script>

<template>
    <div class="flex flex-row gap-2 items-center w-32">
        <LanguagesIcon class=" w-1/3" />
        <Select :default-value="LanguageCode.English" v-model="sessionStore.activeLanguage" id="languageSelect" @update:model-value="handleLanguageChange">
            <SelectTrigger class="w-[180px] overflow-hidden whitespace-nowrap truncate">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem v-for="lang in Object.entries(LanguageCode)" :value="lang[1]">
                    {{ lang[0] }}
                </SelectItem>
            </SelectContent>
        </Select>
    </div>
</template>