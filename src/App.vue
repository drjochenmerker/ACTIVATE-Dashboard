<script setup lang="ts">
import NavBar from './components/NavBar.vue';
// TODO Delete this code block after implementing the use of the API in the components
// import { getActivities, getActivityDetail } from './data/knowledge_graph/knowledge_graph';
// getActivities("de").then((data) => {
//     console.log("Activities - ", data);
//     getActivityDetail(data[0],"de").then((data) => {
//         console.log("Detail - ", data);
//     });
// });
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
