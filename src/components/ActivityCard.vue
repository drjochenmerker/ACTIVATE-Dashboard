<script lang="ts" setup>
// functions
import { defineProps, onMounted, ref } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';
import { getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { useActivityStore } from '@/stores/activityStore';
import { buildTreeStructByLang } from '@/data/knowledge_graph/utils';

// functional components
import RecursiveSelect from './RecursiveSelect.vue';
import { Activity, KnowledgeGraphActivityClass, NestedMultiLangObject } from '@/data/knowledge_graph/structures';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';

// ui components
import { Button } from '@/components/ui/button';
import Label from '@/components/ui/label/Label.vue';
import Checkbox from '@/components/ui/checkbox/Checkbox.vue';
import { BookCopy, Play, Loader2 } from 'lucide-vue-next';
import { staticContent } from '@/data/contentData';

// consts and props defintion
const sessionStore = useSessionStore();
const props = defineProps({
    activity: {
        type: Object,
        required: true,
    },
});
const graph = props.activity.graph;

//  state management for available roles
sessionStore.availableRoles = {} as NestedMultiLangObject;
let newTitle = '';
let newDescription = '';

const editTitle = ref('');
const editDescription = ref('');

// Refs for dialog interaction
const isDeleteDialogOpen = ref(false);
const isCloneDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const cloneTitleError = ref(false);
const editTitleError = ref(false);

// activity store management
const activityStore = useActivityStore();
let activities = ref<Activity[]>([]);

// load all activities on component mount
onMounted(async () => {
    activities.value = await activityStore.getAllActivities();
});

// Handle session start when user clicks start button
const handleStartSession = async () => {
    sessionStore.sessionActivity = {
        graph: props.activity.graph,
        name: props.activity.name,
        description: props.activity.description
    };
    sessionStore.startSession();
};

// clone activity functionality
//      step 1:
const openCloneDialog = () => {
    newTitle = props.activity.name;
    newDescription = props.activity.description;
    isCloneDialogOpen.value = true;
}
//      step 2
const cloneThisActivity = async (newTitle: string, newDescription: string) => {
    if (!newTitle.trim()) {
        cloneTitleError.value = true;
        return;
    }
    cloneTitleError.value = false;

    const clonedActivity = {
        graph: props.activity.graph,
        name: newTitle,
        description: newDescription || props.activity.description,
    };
    activityStore.cloneThisActivity(clonedActivity);
    activityStore.refreshActivityList();

    isCloneDialogOpen.value = false;
}

//delete activity function
const deleteThisActivity = async () => {
    activityStore.removeActivity(graph);
    activityStore.refreshActivityList();

    isDeleteDialogOpen.value = false;
}

// edit activity:
//      first step
const openEditDialog = () => {
    editTitle.value = props.activity.name;
    editDescription.value = props.activity.description;
    isEditDialogOpen.value = true;
}
//      second step
const updateActivity = async (newTitle: string, newDescription: string) => {
    if (!newTitle.trim()) {
        editTitleError.value = true;
        return;
    }
    editTitleError.value = false;


    const updatedActivity = {
        graph: props.activity.graph,
        name: newTitle,
        description: newDescription || props.activity.description,
    };
    activityStore.editActivity(updatedActivity);
    await activityStore.refreshActivityList();
    isEditDialogOpen.value = false;
}

/**
 * Retrieves available roles for the current activity graph.
 * Fetches subject class IDs from the knowledge graph and populates the session store's available roles.
 */
const getRoles = async () => {
    sessionStore.availableRoles = buildTreeStructByLang(
        await getActivityClassIds(props.activity.graph, KnowledgeGraphActivityClass.subject),
        sessionStore.activeLanguage);
}

const sessionStartAllowed = () => !sessionStore.sessionRole;
</script>

<template>
    <div class="rounded-xl shadow-md bg-white dark:bg-gray-900 p-4 transition-all hover:shadow-lg">

        <Accordion type="single" class="w-full" collapsible>
            <AccordionItem :value="props.activity.graph" class="accordion-item border-0">

                <AccordionTrigger class="accordion-trigger text-lg font-semibold text-middle flex justify-center"
                    @click="getRoles">
                    {{ props.activity.name }}
                </AccordionTrigger>




                <AccordionContent class="pt-4 space-y-4 text-sm text-gray-600 dark:text-gray-300">
                    <!-- slim line that separates the title from the content -->
                    <div class="h-[1px] bg-gray-200 dark:bg-gray-700 my-2"></div>

                    <!-- Description -->
                    <p class="text-base">{{ props.activity.description }}</p>

                    <!-- Buttons-->
                    <div class="flex justify-between items-center gap-4 flex-wrap">
                        <!-- Delete Button -->
                        <div>
                            <Dialog v-model:open="isDeleteDialogOpen">
                                <DialogTrigger as-child>
                                    <button class="icon-button">
                                        <span class="material-symbols-outlined">delete</span>
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{{
                                            staticContent.startPage.deleteActivity[sessionStore.activeLanguage] }}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {{ staticContent.startPage.deleteConfirm[sessionStore.activeLanguage] }}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button @click="() => deleteThisActivity()">{{
                                            staticContent.terms.delete[sessionStore.activeLanguage] }}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <!-- Edit Button -->
                        <div>
                            <Dialog v-model:open="isEditDialogOpen">
                                <DialogTrigger as-child>
                                    <Button variant="secondary" size="icon" @click="openEditDialog">
                                        <span class="material-symbols-outlined">edit</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{{ staticContent.startPage.editSetting[sessionStore.activeLanguage]
                                        }}</DialogTitle>
                                        <DialogDescription>
                                            {{ staticContent.startPage.editTitle[sessionStore.activeLanguage] }}:
                                        </DialogDescription>
                                        <input v-model="editTitle" :class="[
                                            'w-full border rounded p-2 my-2 dark:bg-gray-900',
                                            editTitleError ? 'border-red-500' : 'border-gray-300'
                                        ]"
                                            :placeholder="staticContent.startPage.editTitle[sessionStore.activeLanguage]" />
                                        <p v-if="editTitleError" class="text-red-500 text-sm mb-2">
                                            {{ staticContent.startPage.titleRequired[sessionStore.activeLanguage] }}.
                                        </p>

                                        <DialogDescription>{{
                                            staticContent.startPage.newTitle[sessionStore.activeLanguage] }}
                                        </DialogDescription>
                                        <textarea v-model="editDescription"
                                            class="w-full border rounded p-2 my-2  dark:bg-gray-900"
                                            :placeholder="staticContent.startPage.editDescription[sessionStore.activeLanguage]" />
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button @click="() => updateActivity(editTitle, editDescription)">{{
                                            staticContent.startPage.saveChanges[sessionStore.activeLanguage] }}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>


                        <!-- Clone Button -->
                        <div>
                            <Dialog v-model:open="isCloneDialogOpen">
                                <DialogTrigger as-child>
                                    <Button variant="secondary" size="icon" @click="openCloneDialog">
                                        <BookCopy class="w-4 h-4" />
                                    </Button>

                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{{
                                            staticContent.startPage.cloneActivity[sessionStore.activeLanguage] }}
                                        </DialogTitle>
                                        <input v-model="newTitle" :class="[
                                            'w-full border rounded p-2 my-2  dark:bg-gray-900',
                                            cloneTitleError ? 'border-red-500' : 'border-gray-300'
                                        ]"
                                            :placeholder="staticContent.placeholders.newTitle[sessionStore.activeLanguage]" />
                                        <p v-if="cloneTitleError" class="text-red-500 text-sm mb-2">Title is required.
                                        </p>
                                        <DialogDescription>{{
                                            staticContent.startPage.newDescription[sessionStore.activeLanguage] }}
                                        </DialogDescription>
                                        <textarea v-model="newDescription"
                                            class="w-full border rounded p-2 my-2  dark:bg-gray-900"
                                            :placeholder="staticContent.placeholders.newDescriptionOptional[sessionStore.activeLanguage]" />
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button @click="cloneThisActivity(newTitle, newDescription)">{{
                                            staticContent.terms.clone[sessionStore.activeLanguage] }}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <!-- Start Session Button -->
                        <div>
                            <Dialog>
                                <DialogTrigger as-child>
                                    <Button variant="default" size="icon">
                                        <Play class="w-4 h-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{{ staticContent.startPage.roleSelect[sessionStore.activeLanguage]
                                        }}</DialogTitle>
                                        <DialogDescription>{{
                                            staticContent.startPage.roleSelectText[sessionStore.activeLanguage] }}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <!-- Select a role-->
                                    <Select v-model="sessionStore.sessionRole" id="roleSelect" class="my-4">
                                        <SelectTrigger>
                                            <SelectValue
                                                :placeholder="staticContent.placeholders.roleSelect[sessionStore.activeLanguage]" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <RecursiveSelect :node="sessionStore.availableRoles" />
                                        </SelectContent>

                                    </Select>


                                    <!-- Instructor mode toggle -->
                                    <div class="flex items-center space-x-2 mt-4">
                                        <Checkbox id="cbInstructorMode" :checked="sessionStore.instructorMode"
                                            @update:checked="sessionStore.instructorMode = $event" />
                                        <Label for="cbInstructorMode" class="text-sm font-normal">
                                            {{ staticContent.startPage.instructorMode[sessionStore.activeLanguage] }}
                                        </Label>
                                    </div>


                                    <DialogFooter>
                                        <Button type="submit" :disabled="sessionStartAllowed()"
                                            @click="() => handleStartSession()">
                                            <template v-if="sessionStartAllowed()">
                                                <Loader2 class="w-4 h-4 mr-2 animate-spin" />
                                                {{
                                                    staticContent.startPage.activityRoleSelect[sessionStore.activeLanguage]
                                                }}
                                            </template>
                                            <template v-else>
                                                <Play class="w-4 h-4 mr-2" />
                                                {{ staticContent.startPage.startDebriefing[sessionStore.activeLanguage]
                                                }}
                                            </template>
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
</template>

<style scoped>
.card {
    border: 1px solid #ccc;
    padding: 5px;
}

.buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 5px;
}

textarea {
    resize: vertical;
    min-height: 60px;
}

textarea::placeholder {
    color: #888;
}
</style>