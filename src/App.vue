<script setup lang="ts">
import NavBar from './components/NavBar.vue';
// TODO Delete this code block after implementing the use of the API in the components
// import { getActivities, getActivityDetail, getExampleActivity } from './data/knowledge_graph/knowledge_graph';
// import { addConflict } from './data/knowledge_graph/write_operations';
// getActivities().then((data) => {
//     console.log("Verfügbare Sprachen: ", Object.keys(data))
//     console.log("getActivities - ", data);
//     getExampleActivity().then(res => {
//         console.log(res)
//     })
//     getActivityDetail(data["de"][0]).then((data_inner) => {
//         console.log("getActivityDetail for", data["de"][0].label, data_inner);
//     });
// });
// getExampleActivity().then(res => {
//     console.log(res)
// });
// addConflict("Arztbesuch", ["Arzt", "Patient"], "Anonym").then(res => {console.log(res)})
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
