<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import NoteCard from './NoteCard.vue';
import { noteStatus } from '@/assets/constants/noteStatus';

const props = defineProps({
  pageData: {
    type: Object,
    required: true,
  },
});

const notes = ref<any[]>([]);
const filteredNotes = ref<any[]>([]);

onMounted(() => {
  notes.value = JSON.parse(sessionStorage.getItem('notes') || '[]');
  filterNotesBySelectedPoint();
});

const filterNotesBySelectedPoint = () => {
  // Filter nach dem `participatingPoints`
  filteredNotes.value = notes.value.filter(note =>
    Array.isArray(note.participatingPoints) &&
    note.participatingPoints.includes(props.pageData.number)
  );
  
  // sort "filteredNOtes" by the status 
  // TODO: not working correctly yet...
  sortNotesByStatus();
};

const sortNotesByStatus = () => {
    // sort the filtered notes by status
    // TODO: not working correctly yet...
  filteredNotes.value = filteredNotes.value.sort((a, b) => {
    const statusOrder = [noteStatus.RED, noteStatus.YELLOW, noteStatus.GREEN];
    return statusOrder.indexOf(a.noteStatus) - statusOrder.indexOf(b.noteStatus);
  });
};

</script>

<template>
  <div>
    <div v-if="filteredNotes.length > 0">
      <div v-for="(note, index) in filteredNotes" :key="note.content">
        <NoteCard :content="note.content" :isAnonymous="note.isAnonymous" :status="note.noteStatus" />
      </div>
    </div>
    <div v-else>
      <p>Es gibt keine Notizen für diese Seite.</p>
    </div>
  </div>
</template>

<style scoped>
</style>
