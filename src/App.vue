<script setup lang="ts">
import NavBar from './components/NavBar.vue';
// TODO Delete this code block after implementing the use of the API in the components
import { getActivities, getActivityDetail } from './data/knowledge_graph/knowledge_graph';
getActivities().then((data) => {
    console.log("Verfügbare Sprachen: ", Object.keys(data))
    console.log("getActivities - ", data);
    getActivityDetail(data["de"][0]).then((data_inner) => {
        console.log("getActivityDetail for", data["de"][0].label, data_inner);
    });
});
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
