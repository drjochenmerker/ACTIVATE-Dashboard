<script lang="ts" setup>
import { defineProps, ref, defineEmits, onMounted } from 'vue';

const props = defineProps({
    conflictReply: {
        type: Object,
        required: true,
    }

});
const emit = defineEmits(['updateStatus']);


onMounted(() => {

});
</script>

<template>
    <div class="replies-section">
        <div v-html="props.conflictReply.author"></div>
        <div v-html="props.conflictReply.comment"></div>
    </div>
</template>

<style scoped>
/* Allgemeines Styling */
.replies-section {
    box-shadow: 0 2px 8px rgba(223, 223, 223, 0.5);
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin: 10px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    max-width: 100%;
    width: 100%;
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
    text-align: end;
}

/* dynamic shadow based on selected status */
.note-card.red {
    box-shadow: 0 2px 8px rgba(255, 182, 193, 0.5);
    /* Pastellrosa */
    border-color: rgba(255, 182, 193, 0.7);
}

.note-card.yellow {
    box-shadow: 0 2px 8px rgba(253, 253, 150, 0.5);
    /* Pastellgelb */
    border-color: rgba(253, 253, 150, 0.7);
}

.note-card.green {
    box-shadow: 0 2px 8px rgba(152, 251, 152, 0.5);
    /* Pastellgrün */
    border-color: rgba(152, 251, 152, 0.7);
}

/* Header Styling */
.note-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;
}

.note-card-status {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    color: white;
    border-radius: 20px;
}

.note-card-status.anonymous {
    background-color: #c6c6c6;
}

.note-card-status:not(.anonymous) {
    background-color: #0000009d;

}

/* Dropdown Styling */
.status-selector select {
    padding: 5px;
    font-size: 14px;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid #ccc;
    transition: background-color 0.2s ease;
}

.status-selector select:focus {
    outline: none;
    background-color: #f1f1f1;
}

.note-card-content {
    margin-bottom: 10px;
}
</style>
