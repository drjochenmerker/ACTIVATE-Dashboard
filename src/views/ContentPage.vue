<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import NoteCardMisc from '@/components/NoteCardMisc.vue';
import { activateTerms, contentData, staticContent } from '@/data/contentData';
import ContentTemplate from '@/components/ContentTemplate.vue';
import { useSessionStore } from '@/stores/sessionStore';
import Editor from '@/components/Editor.vue';
import { Button } from '@/components/ui/button';
import { useActivityPointsStore } from "@/stores/activityPointsStore";
import { storeToRefs } from 'pinia';
import { PlusIcon } from 'lucide-vue-next';
import { useMiscsStore } from "@/stores/miscsStore";
import { Activity, Conflict } from "@/data/knowledge_graph/structures";


const route = useRoute();

// Define props
const props = defineProps<{ conflicts: Conflict[], activity: Activity }>();

// Stores
const sessionStore = useSessionStore();
const miscStore = useMiscsStore();

const activityPointStore = useActivityPointsStore();
const { getActivePoints } = storeToRefs(activityPointStore);

const isEditorDrawerOpen = ref(false);

// Define the expected structure of pageData
type PageDataType = { id: string; number: number } | undefined;
// Assign pageData with a proper type
const pageData: PageDataType = contentData.find((item) => item.id === route.params.id);



// Fetch miscellaneous comments on mount
onMounted(async () => {
    miscStore.fetchMiscs();
});



</script>

<template>
    <div>
        <h1 class="text-2xl font-semibold mb-4">{{ activateTerms[sessionStore.activeLanguage][pageData!.id] }}</h1>

        <!-- When not on misc page, show the content -->
        <ContentTemplate
v-if="route.params.id !== 'misc' && pageData" :page-data="pageData"
            :conflicts="props.conflicts" />

        <!-- When on misc page, show misc comments-->
        <div v-if="route.params.id === 'misc'">
            <div>
                <Button
:title="isEditorDrawerOpen ? 'Hide Editor' : 'Show Editor'"
                    variant="default" size="icon" :class="[
                    'z-50 rounded-full shadow transition-all',
                    isEditorDrawerOpen ? 'rotate-45' : ''
                    ]" @click="isEditorDrawerOpen = !isEditorDrawerOpen">
                    <PlusIcon class="h-6 w-6" />
                </Button>
                <div class="flex flex-col py-2">
                    <transition name="fade">
                    <div v-if="isEditorDrawerOpen" class="transition-all duration-300 ease-in-out">
                        <Editor :active-points="getActivePoints" :is-note="true" />
                    </div>
                    </transition>
                </div>
            </div>
            <div v-if="miscStore.miscComments.length > 0">
                <ul>
                    <li v-for="(comment, index) in miscStore.miscComments" :key="index">
                        <NoteCardMisc :comment="comment" />
                    </li>
                </ul>
            </div>

            <div v-else>
                {{ staticContent.errors.noMisc[sessionStore.activeLanguage] }}
            </div>
        </div>

    </div>
</template>