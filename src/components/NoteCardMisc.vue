<script lang="ts" setup>
import { deleteComment } from '@/data/knowledge_graph/write_operations';
import { defineProps } from 'vue';

const graph = 'Urology_Emergency_after_Debriefing'; //todo hard coded graph title

const props = defineProps({
    comment: {
        type: Object,
        required: true,
    }
});
const [extractedTitle, extractedContent] = props.comment.comment.split('|');

// delete conflicts
const handleDelete = async (id: string) => {
    try {
        //comment cant be nested because its the misc card
        await deleteComment(graph, id, false);
    } catch (error) {
        console.error("Error deleting conflict: ", error);
    }
};

</script>

<template>
    <div class="misc-note-card">
        <div class="misc-note-header">
            <span class="misc-note-author">Author: {{ props.comment.author || 'Unknown' }}</span>
            <div>
                <button class="icon-button" @click="handleDelete(props.comment.id)">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        </div>
        <hr class="misc-note-divider" />
        <div class="misc-note-content">
            <div class="misc-note-title" v-html="extractedTitle"></div>
            <div class="misc-note-description" v-html="extractedContent"></div>
        </div>


    </div>
</template>

<style scoped>
.misc-note-card {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin: 10px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    max-width: 100%;
    width: 100%;
}

.misc-note-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;
}

.misc-note-author {
    font-size: 14px;
    font-weight: bold;
    color: #333;
}

.misc-note-divider {
    border: none;
    border-top: 1px solid #ddd;
    margin: 10px 0;
}

.misc-note-content {
    margin-bottom: 10px;
}

.misc-note-title {
    font-size: xx-large;
    font-weight: normal;
}

.misc-note-description {
    font-weight: normal;
}
</style>
