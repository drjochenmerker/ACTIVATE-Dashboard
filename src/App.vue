<script setup lang="ts">
import NavBar from './components/NavBar.vue';
import { getActivities } from './data/knowledge_graph/knowledge_graph';
getActivities("de");
</script>

<template>
    <div class="flex flex-col h-screen">
        <NavBar />
        <main class="flex-grow h-full p-6">
            <router-view :key="$route.path" />
        </main>
    </div>
</template>

<style scoped></style>
