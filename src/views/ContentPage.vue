<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { contentData } from '@/data/contentData';
import ContentTemplate from '@/components/ContentTemplate.vue';
import { getMiscComments } from '@/data/knowledge_graph/read_operations';
import { onMounted, ref } from 'vue';
import NoteCardMisc from '@/components/NoteCardMisc.vue';
import { Comment } from '@/data/knowledge_graph/structures';
import { useSessionStore } from '@/stores/sessionStore';

// Define props
const props = defineProps<{ conflicts: any[], activity: any }>();

// stores
const sessionStore = useSessionStore();

const route = useRoute();


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

const fetchMiscs = async () => {
    if (route.params.id === 'misc') {
        // Get miscellaneous comments from the graph
        miscComments.value = await getMiscComments(graph);
    }
}


const removeComment = (id: string) => {
    miscComments.value = miscComments.value.filter(comment => comment.id !== id);
};


</script>

<template>
    <div>
        <h1 class="text-2xl font-semibold mb-4">{{ pageData?.title }}</h1>


        <ContentTemplate v-if="route.params.id !== 'misc' && pageData" :pageData="pageData"
            :conflicts="props.conflicts" />


        <!--when on misc page, show misc comments-->
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
