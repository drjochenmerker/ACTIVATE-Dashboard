<script setup lang="ts">
import NavBar from './components/NavBar.vue';
import { addExampleConflictData } from './data/examples';
import { getConflictDetail, getExampleActivity } from './data/knowledge_graph/read_operations';
import { RDFOperation, RDFTriple } from './data/knowledge_graph/structures';
import { updateTriple } from './data/knowledge_graph/write_operations';
addExampleConflictData().then(async (conflictIds) => {
    console.log('Example conflict data added', conflictIds);
    for (const conflictId of conflictIds) {
        console.log('Example conflict detail', await getConflictDetail(conflictId));
    }
});
getExampleActivity().then((activity) => {
    console.log('Example activity', activity);
    updateTriple({
        subject: "NursingSpecialist1",
        predicate: "Uses",
        object: "Sedatives",
    } as RDFTriple, RDFOperation.insert).then((result) => {
        console.log('Triple updated', result);
        getExampleActivity().then((activityUpdate) => {
            console.log('Example activity after update', activityUpdate);
        });
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
