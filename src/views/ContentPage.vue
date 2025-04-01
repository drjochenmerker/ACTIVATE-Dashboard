<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import NoteCardMisc from '@/components/NoteCardMisc.vue';
import { contentData } from '@/data/contentData';
import ContentTemplate from '@/components/ContentTemplate.vue';
import { Comment } from '@/data/knowledge_graph/structures';
import { useSessionStore } from '@/stores/sessionStore';
import { getMiscComments } from '@/data/knowledge_graph/read_operations';

const route = useRoute();

// Define props
const props = defineProps<{ conflicts: any[], activity: any }>();

// Stores
const sessionStore = useSessionStore();



// Define the expected structure of pageData
type PageDataType = { id: string; title: string; number: number } | undefined;
// Assign pageData with a proper type
const pageData: PageDataType = contentData.find((item) => item.id === route.params.id);

const graph = sessionStore.sessionActivity!.graph;

// Reactive variable to hold miscellaneous comments
const miscComments = ref<Comment[]>([]);

// Fetch miscellaneous comments on mount
onMounted(async () => {
    fetchMiscs();
});

/**
 * Fetches miscellaneous comments from the knowledge graph when on the 'misc' page.
 * Updates the miscComments reactive reference with the retrieved comments.
 */
const fetchMiscs = async () => {
    if (route.params.id === 'misc') {
        // Get miscellaneous comments from the graph
        miscComments.value = await getMiscComments(graph);
    }
}

/**
 * Promised function
 * Removes a specific comment from the miscellaneous comments list.
 * @param id The unique identifier of the comment to be removed.
 */
const removeComment = (id: string) => {
    miscComments.value = miscComments.value.filter(comment => comment.id !== id);
};

</script>

<template>
    <div>
        <h1 class="text-2xl font-semibold mb-4">{{ pageData?.title }}</h1>

        <!-- When not on misc page, show the content -->
        <ContentTemplate v-if="route.params.id !== 'misc' && pageData" :pageData="pageData"
            :conflicts="props.conflicts" />


        <!-- When on misc page, show misc comments-->
        <div v-if="route.params.id === 'misc'">
            <div v-if="miscComments.length > 0">
                <ul>
                    <li v-for="(comment, index) in miscComments" :key="index">
                        <NoteCardMisc :comment="comment" @deleteComment="removeComment" @refresh="fetchMiscs" />
                    </li>
                </ul>
            </div>

            <div v-else>
                There are no miscellaneous comments.
            </div>
        </div>

    </div>
</template>
