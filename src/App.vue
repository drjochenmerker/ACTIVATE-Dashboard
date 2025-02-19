<script setup lang="ts">
import NavBar from './components/NavBar.vue';
// Backend Tests
import { addExampleConflictData } from './data/examples';
import { getActivities, getActivityDetail, getAllConflictsWithDetail, getConflictDetail, getConflictIds } from './data/knowledge_graph/read_operations';
import { conflictStatus, RDFOperation, RDFTriple } from './data/knowledge_graph/structures';
import { deleteComment, deleteConflict, updateConflictStatus, updateTriple } from './data/knowledge_graph/write_operations';
// Example Data must be added every time since the current backend solution does not retain data
getActivities().then((activities) => {
    console.log("Activities", activities);
    addExampleConflictData(activities[0].graph).then(async (conflictIds) => {
        // Add example data and print to console
        console.log("Example conflict data added", conflictIds);
        let conflictDetail = [];
        for (const conflictId of conflictIds) { 
            const detail = await getConflictDetail(activities[0].graph, conflictId);
            conflictDetail.push(detail);
            console.log('Example conflict detail for ID', conflictId, detail);
        }
        // Delete Conflict
        console.log("Trying to delete a conflict. ID:", conflictIds[1], "Result",(await deleteConflict(activities[0].graph, conflictIds[1])).status);
        console.log("Trying to fetch detail again", (await getConflictDetail(activities[0].graph, conflictIds[1])).status)
        // Update Conflict-Status
        console.log("Trying to update the status of a conflict. ID:", conflictIds[0], "Result", (await updateConflictStatus(activities[0].graph, conflictIds[0], conflictStatus.resolved)).status);
        console.log("Fetching detail again", await getConflictDetail(activities[0].graph, conflictIds[0]))
        // Delete Comments
        console.log("Trying to delete a nested comment within the first conflict. ID:", (conflictDetail[0].replies || [])[1].id, "Result", (await deleteComment(activities[0].graph,(conflictDetail[0].replies || [])[1].id, true)).status);
        console.log("Trying to delete a non-nested comment within the first conflict. ID:", (conflictDetail[0].replies || [])[0].id, "Result", (await deleteComment(activities[0].graph,(conflictDetail[0].replies || [])[0].id, false)).status);
        console.log("Fecthing details again", await getConflictDetail(activities[0].graph, conflictIds[0]));
    }).finally(async () => {
        for (const activity of activities) {
            console.log("Fetching all conflict ids for", activity.name, await getConflictIds(activity.graph))
            getActivityDetail(activity).then(activity => {
                console.log(`Fetching activity detail from graph ${activity.graph}`, activity)
                updateTriple(activities[0].graph,{
                    subject: "NursingSpecialist1",
                    predicate: "Uses",
                    object: "Sedatives",
                } as RDFTriple, RDFOperation.insert).then((result) => {
                    console.log("Triple updated", result);
                    getActivityDetail(activities[0]).then((activityUpdate) => {
                        console.log("Example activity after update", activityUpdate);
                });
            });
            })
            console.log("Fetching all conflicts in detail for", activity.name)
            console.log("Result:", await getAllConflictsWithDetail(activity.graph))
        }
    });
})
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
