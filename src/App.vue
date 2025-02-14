<script setup lang="ts">
import NavBar from './components/NavBar.vue';
// Backend Tests
import { addExampleConflictData } from './data/examples';
import { getConflictDetail, getExampleActivity } from './data/knowledge_graph/read_operations';
import { RDFOperation, RDFTriple } from './data/knowledge_graph/structures';
import { deleteComment, deleteConflict, updateTriple } from './data/knowledge_graph/write_operations';
// Example Data must be added every time since the current backend solution does not retain data
addExampleConflictData().then(async (conflictIds) => {
    // Add example data and print to console
    console.log('Example conflict data added', conflictIds);
    let conflictDetail = [];
    for (const conflictId of conflictIds) { 
        const detail = await getConflictDetail(conflictId);
        conflictDetail.push(detail);
        console.log('Example conflict detail', detail);
    }
    // Delete Conflict
    console.log("Trying to delete a conflict. ID:", conflictIds[1], "Result",(await deleteConflict(conflictIds[1])).status);
    console.log("Trying to fetch Detail again", (await getConflictDetail(conflictIds[1])).status)
    // Delete Comments
    console.log("Trying to delete a nested comment within the first conflict. ID:", (conflictDetail[0].replies || [])[1].id, "Result", (await deleteComment((conflictDetail[0].replies || [])[1].id, true)).status);
    console.log("Trying to delete a non-nested comment within the first conflict. ID:", (conflictDetail[0].replies || [])[0].id, "Result", (await deleteComment((conflictDetail[0].replies || [])[0].id, false)).status);
    console.log("Fecthing details again", await getConflictDetail(conflictIds[0]));
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
// Tests end here

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
