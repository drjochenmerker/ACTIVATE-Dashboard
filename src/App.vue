<script setup lang="ts">
import NavBar from './components/NavBar.vue';
// Comment/Conflict examples
// import { addComment, addConflict } from './data/knowledge_graph/write_operations';
// import { conflictStatus } from './data/knowledge_graph/interfaces';
// addConflict("Arztbesuch", ["Arzt", "Patient"], "Anonym", conflictStatus.open).then(res => {
//     console.log(res)
//     addComment(res.added, "Anonym", "Wieso ist hier ein Konflikt? Sehe ich nicht so").then(res => console.log(res))
// })
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
