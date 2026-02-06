<script setup lang="ts">
import { NestedMultiLangObject } from "@/data/knowledge_graph/structures";
import {
    SelectGroup,
    // SelectLabel,
    SelectItem,
} from "./ui/select";
import { useSessionStore } from "@/stores/sessionStore";

defineProps<{
    node: NestedMultiLangObject;
}>();
const sessionStore = useSessionStore();
</script>

<template>
    <SelectGroup>
        <!-- <SelectLabel v-if="node.level !== 'root'" class=" font-extrabold">{{ node.level }}</SelectLabel> -->

        <SelectItem v-for="item in node.values" :key="item.id" :value="item.id">
            {{ item.labels[sessionStore.activeLanguage] || item.labels.default || Object.values(item.labels)[0] }}
        </SelectItem>

        <RecursiveSelect v-for="child in node.next" :key="child.level" :node="child" />
    </SelectGroup>
</template>
