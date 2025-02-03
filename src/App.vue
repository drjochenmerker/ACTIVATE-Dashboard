<script setup lang="ts">
import NavBar from './components/NavBar.vue';
import { Conflict } from './data/knowledge_graph/interfaces';
// Comment/Conflict examples
// import { addComment, addConflict } from './data/knowledge_graph/write_operations';
// import { conflictStatus } from './data/knowledge_graph/interfaces';
// addConflict("Arztbesuch", ["Arzt", "Patient"], "Anonym", conflictStatus.open).then(res => {
    //     console.log(res)
    //     addComment(res.added, "Anonym", "Wieso ist hier ein Konflikt? Sehe ich nicht so").then(res => console.log(res))
    // })

// Insert example conflict and comments
import { getConflictDetail } from './data/knowledge_graph/read_operations';
import { addConflict } from './data/knowledge_graph/write_operations';
// addConflict({} as Conflict).then(res => console.log(res))
getConflictDetail("abc").then(res => console.log(res))
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
