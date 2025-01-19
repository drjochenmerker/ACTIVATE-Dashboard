<script lang="ts" setup>
    import { ref, onMounted, computed } from 'vue';
    import NoteCard from './NoteCard.vue';

    // Defines the prop to receive the pageData
    const props = defineProps({
    pageData: {
        type: Object,
        required: true,
    },
    });


    const notes = ref<any[]>([]);
    const filteredNotes = ref<any[]>([]);

    // Loads notes from sessionStorage
    // TODO: 
    onMounted(() => {
        const storedNotes = JSON.parse(sessionStorage.getItem('notes') || '[]');
        notes.value = storedNotes;
        filterNotesBySelectedPoint();
    });

    // Filters notes based on the page id and the selected points
    const filterNotesBySelectedPoint = () => {
        filteredNotes.value = notes.value.filter(note => {
            // Test if partcipating exists and is an array
            if (Array.isArray(note.participatingPoints)) {
                // Test if participatingPoints matches the page id / the number 
                return note.participatingPoints.some((point: any) => point === props.pageData.number);
            }
            return false;
    });
};

</script>

<template>
    <div>
        <!-- Shows filtered notes -->
        <div v-if="filteredNotes.length > 0">
            <div v-for="(note, index) in filteredNotes" :key="index">
                <!-- Benutze die NoteCard-Komponente -->
                <NoteCard :content="note.content" :isAnonymous="note.isAnonymous" />
            </div>
        </div>
        <div v-else>
            <p>Es gibt keine Notizen für diese Seite.</p>
        </div>
  </div>

</template>

<style scoped></style>
