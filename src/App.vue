<script setup lang="ts">
import NavBar from './components/NavBar.vue';
// Backend Tests
import { getPredicateObject } from './data/knowledge_graph/read_operations';
import { KnowledeGraphActivityClass, LanguageCode } from './data/knowledge_graph/structures';
import { vocabAddPredicate } from './data/knowledge_graph/write_operations';
getPredicateObject().then(async preds => {
    console.log("Getting all predicates for Subject -> Object", preds.get(["subject","object"]))
    console.log("Bidirectional predicate get for Subject <-> Object", preds.getBidirectional(["subject","object"]))
    console.log("Adding predicates", await vocabAddPredicate("BorrowsFrom", 
        [KnowledeGraphActivityClass.subject], [KnowledeGraphActivityClass.object, KnowledeGraphActivityClass.community], 
        [{label: "Borgt von", language: LanguageCode.german},{label: "Borrows from", language: LanguageCode.english}]
    ));
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
