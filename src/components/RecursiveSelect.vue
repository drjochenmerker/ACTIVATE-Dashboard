<script setup lang="ts">
import { NestedMultiLangObject } from "@/data/knowledge_graph/structures";
import { SelectGroup, SelectItem } from "./ui/select";
import { useSessionStore } from "@/stores/sessionStore";

defineProps<{
    node: NestedMultiLangObject;
}>();
const sessionStore = useSessionStore();
</script>

<template>
    <SelectGroup>
        <SelectItem v-for="item in node.values" :key="item.id" :value="item.id">
            {{ item.labels[sessionStore.activeLanguage] || item.labels.default || Object.values(item.labels)[0] }}
        </SelectItem>

        <RecursiveSelect v-for="child in node.next" :key="child.level" :node="child" />
    </SelectGroup>
</template>
