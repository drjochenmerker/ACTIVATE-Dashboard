<script lang="ts" setup>
// TODO: implement the functionality for cloning activities, editing and maybe bring back the role selection from INPROGRESS FILE

// functions
import { onMounted, computed, ref, nextTick } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';
import { getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { useActivityStore } from '@/stores/activityStore';
import { buildTreeStructByLang } from '@/data/knowledge_graph/utils';

// functional components
import { Activity, KnowledgeGraphActivityClass, NestedMultiLangObject } from '@/data/knowledge_graph/structures';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import QrcodeVue from 'qrcode.vue'

// ui components
import { Button } from '@/components/ui/button';
// import Label from '@/components/ui/label/Label.vue';
// import Checkbox from '@/components/ui/checkbox/Checkbox.vue';
// import { Play, Loader2 } from 'lucide-vue-next';
import { Play } from 'lucide-vue-next';
// import { BookCopy, Play, Loader2 } from 'lucide-vue-next';
// import { contentData, staticContent } from '@/data/contentData';
import { staticContent } from '@/data/contentData';
import { llmPool } from '@/data/knowledge_graph/llm_utils';
import LoadingOverlay from '@/components/LoadingOverlay.vue';
import RecursiveSelect from './RecursiveSelect.vue';
import { Select, SelectTrigger, SelectContent, SelectValue } from '@/components/ui/select';
import DeletionPopUp from './DeletionPopUp.vue';

// consts and props defintion
const sessionStore = useSessionStore();
const props = defineProps({
    activity: {
        type: Object,
        required: true,
    },
});
const graph = props.activity.graph;
const feedbackUrl = computed(() => {
    return `${window.location.origin}/feedback/${graph}`;
});

//  state management for available roles
sessionStore.availableRoles = {} as NestedMultiLangObject;
// let newTitle = '';
// let newDescription = '';

// const editTitle = ref('');
// const editDescription = ref('');
// todo
// const isCloneDialogOpen = ref(false);
// const isEditDialogOpen = ref(false);
// const cloneTitleError = ref(false);
// const editTitleError = ref(false);
const showPoolingDialog = ref(false)
const nothingToPool = ref(false);
const loading = ref(false);
const copied = ref(false);


// activity store management
const activityStore = useActivityStore();
let activities = ref<Activity[]>([]);

// load all activities on component mount
onMounted(async () => {
    activities.value = await activityStore.getAllActivities();
});

// Handle session start when user clicks start button
const handleStartSession = async () => {
    const roles = sessionStore.availableRoles.next;
    let instructorId = null;

    if (roles && Array.isArray(roles)) {
        for (const role of roles) {
            // look for the role with the english label "Instructor"
            if (
                role.values &&
                role.values.length > 0 &&
                role.values[0].labels &&
                (
                    role.values[0].labels.en === "Instructor"
                )
            ) {
                instructorId = role.values[0].id; // z.B. "Dozent"
                break;
            }
        }
    }
    // set instructor ID as default if no role is selected
    if (!sessionStore.sessionRole && instructorId) {
        sessionStore.sessionRole = instructorId;
    }

    sessionStore.sessionActivity = {
        graph: props.activity.graph,
        name: props.activity.name,
        description: props.activity.description
    };
    sessionStore.startSession();
};

// copy link functionality
const copyUrlToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(feedbackUrl.value);
        copied.value = true;

        // Auswahl des URL-Textes im sichtbaren Bereich
        if (showUrl.value) {
            await nextTick(); // Sicherstellen, dass DOM aktualisiert ist
            const el = document.getElementById('feedback-url-text');
            if (el) {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(el);
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        }

        setTimeout(() => {
            copied.value = false;
            // Auswahl aufheben nach 2 Sekunden
            const selection = window.getSelection();
            selection?.removeAllRanges();
        }, 2000);
    } catch (err) {
        console.error('Fehler beim Kopieren: ', err);
    }
};

// clone activity functionality
// TODO
//      step 1:
// const openCloneDialog = () => {
//     newTitle = props.activity.name;
//     newDescription = props.activity.description;
//     isCloneDialogOpen.value = true;
// }
// //      step 2
// const cloneThisActivity = async (newTitle: string, newDescription: string) => {
//     if (!newTitle.trim()) {
//         cloneTitleError.value = true;
//         return;
//     }
//     cloneTitleError.value = false;

//     const clonedActivity = {
//         graph: props.activity.graph,
//         name: { ...props.activity.name, [sessionStore.activeLanguage]: newTitle },
//         description: { ...props.activity.description, [sessionStore.activeLanguage]: newDescription || props.activity.description[sessionStore.activeLanguage] },
//     };
//     activityStore.cloneThisActivity(clonedActivity);
//     activityStore.refreshActivityList();

//     isCloneDialogOpen.value = false;
// }

//delete activity function
const deleteThisActivity = async () => {
    activityStore.removeActivity(graph);
    activityStore.refreshActivityList();
}

// first step
// const openEditDialog = () => {
//     editTitle.value = props.activity.name[sessionStore.activeLanguage] || ''
//     editDescription.value = props.activity.description[sessionStore.activeLanguage] || ''
//     isEditDialogOpen.value = true
// }

//      second step
// const updateActivity = async (newTitle: string, newDescription: string) => {
//     if (!newTitle.trim()) {
//         editTitleError.value = true;
//         return;
//     }
//     editTitleError.value = false;

//     const updatedActivity = {
//         graph: props.activity.graph,
//         name: { ...props.activity.name, [sessionStore.activeLanguage]: newTitle },
//         description: { ...props.activity.description, [sessionStore.activeLanguage]: newDescription || props.activity.description[sessionStore.activeLanguage] },
//     };
//     activityStore.editActivity(updatedActivity);
//     await activityStore.refreshActivityList();
//     isEditDialogOpen.value = false;
// }

/**
 * Retrieves available roles for the current activity graph.
 * Fetches subject class IDs from the knowledge graph and populates the session store's available roles.
 */
const getRoles = async () => {
    try {

        const roles = await getActivityClassIds(props.activity.graph, KnowledgeGraphActivityClass.subject);
        sessionStore.availableRoles = buildTreeStructByLang(roles, sessionStore.activeLanguage);
    } catch (error) {
        console.error("Error fetching roles:", error);
    }
}

const sessionStartAllowed = () => true; // TODO tmp for no role selection
const handlePoolingStart = async () => {
    try {
        loading.value = true;
        const res = await llmPool(props.activity.graph);
        if (res.success === false) {
            nothingToPool.value = true;
            loading.value = false;
            return;
        }
        showPoolingDialog.value = false;
    } catch (error) {
        console.error("Error during pooling:", error);
    }
}

// work with the qr code
const showQrDialog = ref(false)
const showUrl = ref(false)


</script>

<template>
    <div class="rounded-xl shadow-md bg-white dark:bg-gray-900 p-4 transition-all hover:shadow-lg">

        <Accordion type="single" class="w-full" collapsible>
            <AccordionItem :value="props.activity.graph" class="accordion-item border-0">

                <AccordionTrigger class="accordion-trigger text-lg font-semibold text-middle flex justify-center"
                    @click="getRoles">
                    {{ props.activity.name[sessionStore.activeLanguage] || props.activity.name['default'] }}
                </AccordionTrigger>


                <AccordionContent class="pt-4 space-y-4 text-sm text-gray-600 dark:text-gray-300">
                    <div class="h-[1px] bg-gray-200 dark:bg-gray-700 my-2"></div>

                    <!-- Description -->
                    <p class="text-base">{{ props.activity.description[sessionStore.activeLanguage]
                        || props.activity.description['default'] }}</p>

                    <!-- Buttons-->
                    <div class="flex justify-between items-center gap-4 flex-wrap">
                        <!-- Delete Button -->
                        <div>
                            <DeletionPopUp
                                :title="staticContent.startPage.deleteActivity[sessionStore.activeLanguage]"
                                :description="staticContent.startPage.deleteActivityConfirm[sessionStore.activeLanguage]"
                                :delete-function="() => deleteThisActivity()"
                            />
                        </div>

                        <!-- Edit Button -->
                        <!-- TODO - CURRENTLY DISABLED BECAUSE OF NOT IMPLEMENTED FUNCTIONALITY -->
                        <!-- <div>
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
                        </div> -->


                        <!-- Clone Button -->
                        <!-- TODO - CURRENTLY DISABLED BECAUSE OF NOT IMPLEMENTED FUNCTIONALITY -->
                        <!-- <div>
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
                        </div> -->

                        <!-- Feedback QR Code Button -->
                        <div>
                            <Dialog v-model:open="showQrDialog">
                                <DialogTrigger as-child>
                                    <Button variant="secondary" size="icon">
                                        <span class="material-symbols-outlined">qr_code</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Feedback QR Code</DialogTitle>
                                        <DialogDescription>
                                            {{ staticContent.feedbackpage.description[sessionStore.activeLanguage] }}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <!-- QR code -->
                                    <div class="flex justify-center py-4">
                                        <qrcode-vue :value="feedbackUrl" :size="200" />
                                    </div>

                                    <!-- Button to show/copy URL -->
                                    <!-- <div class="flex flex-col items-center gap-2">
                                        <Button variant="outline" @click="showUrl = !showUrl">
                                            {{ showUrl ? staticContent.startPage.hideQr[sessionStore.activeLanguage] :
                                                staticContent.startPage.showQr[sessionStore.activeLanguage] }}
                                        </Button>

                                        <div v-if="showUrl" class="break-all text-center p-2 border rounded bg-gray-50">
                                            {{ feedbackUrl }}
                                        </div>
                                    </div> -->
                                    <div class="flex flex-col items-center gap-2">
                                        <Button variant="outline" @click="showUrl = !showUrl">
                                            {{ showUrl ? staticContent.startPage.hideQr[sessionStore.activeLanguage] :
                                                staticContent.startPage.showQr[sessionStore.activeLanguage] }}
                                        </Button>

                                        <div v-if="showUrl"
                                            class="w-full max-w-md break-words text-center p-4 border rounded bg-gray-50 flex flex-col items-center gap-3">
                                            <div id="feedback-url-text">{{ feedbackUrl }}</div>
                                            <Button variant="outline" @click="copyUrlToClipboard">
                                                {{ copied ?
                                                    staticContent.startPage.copiedLink[sessionStore.activeLanguage] :
                                                    staticContent.startPage.copyLink[sessionStore.activeLanguage] }}
                                            </Button>
                                        </div>

                                    </div>

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
                                        <DialogTitle>
                                            {{ staticContent.startPage.startDebriefing[sessionStore.activeLanguage] }}
                                        </DialogTitle>
                                        <DialogDescription>{{
                                            staticContent.startPage.withoutRoleSelectText[sessionStore.activeLanguage]
                                            }}
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
                                    <!-- TODO tmp maybe bring back -->
                                    <!-- <div class="flex items-center space-x-2 mt-4">
                                        <Checkbox id="cbInstructorMode" :checked="sessionStore.instructorMode"
                                            @update:checked="sessionStore.instructorMode = $event" />
                                        <Label for="cbInstructorMode" class="text-sm font-normal">
                                            {{ staticContent.startPage.instructorMode[sessionStore.activeLanguage] }}
                                        </Label>
                                    </div> -->

                                    <!-- Pooling Button Dialog -->
                                    <DialogFooter class="flex justify-between">
                                        <DialogTrigger as-child>
                                            <Button class="mr-auto" type="button">
                                                {{
                                                    staticContent.startPage.poolingButton[sessionStore.activeLanguage]
                                                }}
                                            </Button>
                                        </DialogTrigger>

                                        <Dialog v-model:open="showPoolingDialog">
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        {{
                                                            staticContent.startPage.confirmation[sessionStore.activeLanguage]
                                                        }}
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        {{
                                                            staticContent.startPage.confirmationText[sessionStore.activeLanguage]
                                                        }}
                                                    </DialogDescription>
                                                    <div class="flex justify-between items-center mt-4">
                                                        <Button variant="secondary" @click="showPoolingDialog = false">
                                                            Cancel
                                                        </Button>
                                                        <Button variant="destructive" @click="handlePoolingStart()">
                                                            {{ staticContent.startPage.pool[sessionStore.activeLanguage]
                                                            }}
                                                        </Button>
                                                    </div>

                                                    <LoadingOverlay :visible="loading"
                                                        :message="staticContent.placeholders.loading[sessionStore.activeLanguage]" />
                                                    <p v-if="nothingToPool" class="mt-4 text-red-500 font-semibold">
                                                        {{
                                                            staticContent.startPage.noPoolAvailable[sessionStore.activeLanguage]
                                                        }}
                                                    </p>
                                                </DialogHeader>
                                            </DialogContent>
                                        </Dialog>

                                        <!-- Start Session Button -->
                                        <!-- TODO tmp maybe bring back
                                        <Button type="submit" :disabled="sessionStartAllowed()" -->
                                        <Button type="submit" @click="() => handleStartSession()">
                                            <template v-if="sessionStartAllowed()">
                                                {{
                                                    staticContent.startPage.startDebriefing[sessionStore.activeLanguage]
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