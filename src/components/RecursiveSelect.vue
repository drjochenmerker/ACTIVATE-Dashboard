<script setup lang="ts">
import { NestedMultiLangObject } from "@/data/knowledge_graph/structures";
import {
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "./ui/select";

defineProps<{
  node: NestedMultiLangObject;
}>();
</script>

<template>
  <SelectGroup>
    <SelectLabel v-if="node.level !== 'root'" class=" font-extrabold">{{ node.level }}</SelectLabel>

    <SelectItem
      v-for="item in node.values"
      :key="item.id"
      :value="item.value!"
    >
      {{ item.value || item.id }}
    </SelectItem>

    <RecursiveSelect
      v-for="child in node.next"
      :key="child.level"
      :node="child"
    />
  </SelectGroup>
</template>