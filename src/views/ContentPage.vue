<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { contentData } from '@/data/contentData';
import ContentTemplate from '@/components/ContentTemplate.vue';
import { getMiscComments } from '@/data/knowledge_graph/read_operations';
import { onMounted, ref } from 'vue';
import NoteCardMisc from '@/components/NoteCardMisc.vue';

// Define props
const props = defineProps<{ conflicts: any[], activity: any }>();

const route = useRoute();
const pageData = contentData.find((item) => item.id === route.params.id);
const graph = 'Urology_Emergency_after_Debriefing'; // todo: change to graph name

// Reactive variable to hold miscellaneous comments
const miscComments = ref<string[]>([]);

// Fetch miscellaneous comments on mount
onMounted(async () => {
    //console.log(props.conflicts[1].replies);
    //console.log(props.conflicts[0]);
    //console.log(props.conflicts[0].replies[0].id);
    if (route.params.id === 'misc') {
        // Get miscellaneous comments from the graph
        miscComments.value = await getMiscComments(graph);
    }
});
</script>

<template>
    <div>
        <h1 class="text-2xl font-semibold mb-4">{{ pageData?.title }}</h1>

        <ContentTemplate v-if="route.params.id !== 'misc'" :pageData="pageData" :conflicts="props.conflicts" />

        <!--when on misc page, show misc comments-->
        <div v-if="route.params.id === 'misc'">
            <div v-if="miscComments.length > 0">
                <ul>
                    <li v-for="(comment, index) in miscComments" :key="index">
                        <NoteCardMisc :comment="comment" />
                    </li>
                </ul>
            </div>

            <div v-else>
                There are no miscellaneous comments.
            </div>
        </div>

    </div>
</template>
