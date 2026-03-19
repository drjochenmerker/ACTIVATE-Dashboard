<script lang="ts" setup>

// functions
import { onMounted, computed, ref, nextTick } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';
import { getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { useActivityStore } from '@/stores/activityStore';
import { buildTreeStructByLang } from '@/data/knowledge_graph/utils';
import { cloneActivity } from '@/data/knowledge_graph/write_operations';

// functional components
import { Activity, KnowledgeGraphActivityClass, NestedMultiLangObject } from '@/data/knowledge_graph/structures';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import QrcodeVue from 'qrcode.vue'

// ui components
import { ButtonComponent } from '@/components/ui/button';
import { Play, Archive, ArchiveRestore } from 'lucide-vue-next';
import { staticContent } from '@/data/contentData';
import { llmPool } from '@/data/knowledge_graph/llm_utils';
import LoadingOverlay from '@/components/LoadingOverlay.vue';
import RecursiveSelect from './RecursiveSelect.vue';
import { Select, SelectTrigger, SelectContent, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLLMSettingsStore } from '@/stores/llmSettingsStore';
import DeletionPopUp from './DeletionPopUp.vue';

// consts and props defintion
const sessionStore = useSessionStore();
const props = withDefaults(defineProps<{ activity: Activity; isArchivedView?: boolean }>(), {
    isArchivedView: false,
});
const graph = props.activity.graph;
const feedbackUrl = computed(() => {
    return `${window.location.origin}/feedback/${graph}`;
});

//  state management for available roles
sessionStore.availableRoles = {} as NestedMultiLangObject;

const showPoolingDialog = ref(false)
const nothingToPool = ref(false);
const loading = ref(false);
const copied = ref(false);
const createCopyBeforePooling = ref(false);


// activity store management
const activityStore = useActivityStore();

// load all activities on component mount
onMounted(async () => {
    await activityStore.getAllActivities();
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
        description: props.activity.description,
        isArchived: props.activity.isArchived
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
            // remove text selection after 2 seconds
            const selection = window.getSelection();
            selection?.removeAllRanges();
        }, 2000);
    } catch (err) {
        console.error('Fehler beim Kopieren: ', err);
    }
};


//delete activity function
const deleteThisActivity = async () => {
    activityStore.removeActivity(graph);
    activityStore.refreshActivityList();
}

const archiveThisActivity = async () => {
    if (!sessionStore.instructorMode) {
        return;
    }
    await activityStore.archiveActivity(graph);
};

const restoreThisActivity = async () => {
    if (!sessionStore.instructorMode) {
        return;
    }
    await activityStore.restoreActivity(graph);
};

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
    const llmSettingsStore = useLLMSettingsStore();
    try {
        loading.value = true;
        nothingToPool.value = false;

        let snapshotGraphId: string | null = null;
        if (createCopyBeforePooling.value) {
            // Create a clone of the original activity before pooling
            const newActivityNames: Record<string, string> = {};
            const copySuffix = staticContent.terms.copySuffix;

            // Update name to "[...] - Copy" for all languages
            for (const [lang, name] of Object.entries((props.activity as Activity).name)) {
                // Get the suffix for this language, default to English if not found
                const suffix = copySuffix[lang as keyof typeof copySuffix] || copySuffix.en;
                newActivityNames[lang] = `${name} - ${suffix}`;
            }

            const cloneResult = await cloneActivity(props.activity as Activity, newActivityNames);
            if (cloneResult.status !== "OK") {
                console.error("Failed to create snapshot before pooling:", cloneResult);
                loading.value = false;
                return;
            }
            snapshotGraphId = cloneResult.modified;
            console.log(`Snapshot created: ${snapshotGraphId}`);
        }
        
        // Pool the feedback on the original activity
        const res = await llmPool(props.activity.graph, llmSettingsStore.getCurrentModelRequestConfig());
        if (res.success === false) {
            // If pooling fails, delete the snapshot we just created
            if (snapshotGraphId) {
                console.warn("Pooling failed, deleting snapshot:", snapshotGraphId);
                await activityStore.removeActivity(snapshotGraphId);
                console.log("Snapshot deleted after pooling failure");
            }
            nothingToPool.value = true;
            loading.value = false;
            return;
        }

        if (snapshotGraphId) {
            // Pooling succeeded - snapshot remains, both versions are now persistent
            console.log("Pooling succeeded. Snapshot and pooled version are now persistent.");
        }
        
        // Refresh activity list to show both versions
        await activityStore.refreshActivityList();
        
        showPoolingDialog.value = false;
    } catch (error) {
        console.error("Error during pooling:", error);
    } finally {
        loading.value = false;
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

                <AccordionTrigger
                    class="accordion-trigger text-lg font-semibold text-middle flex justify-center xl:text-xl"
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
                        <div v-if="sessionStore.instructorView">
                            <DeletionPopUp
:title="staticContent.startPage.deleteActivity[sessionStore.activeLanguage]"
                                :description="staticContent.startPage.deleteActivityConfirm[sessionStore.activeLanguage]"
                                :delete-function="() => deleteThisActivity()" />
                        </div>

                        <div v-if="sessionStore.instructorView">
                            <ButtonComponent
                                v-if="!props.isArchivedView"
                                variant="secondary"
                                size="icon"
                                @click="archiveThisActivity">
                                <Archive class="w-4 h-4" />
                            </ButtonComponent>
                            <ButtonComponent
                                v-else
                                variant="secondary"
                                size="icon"
                                @click="restoreThisActivity">
                                <ArchiveRestore class="w-4 h-4" />
                            </ButtonComponent>
                        </div>


                        <!-- Feedback QR Code Button -->
                        <div v-if="!props.isArchivedView">
                            <Dialog v-model:open="showQrDialog">
                                <DialogTrigger as-child>
                                    <ButtonComponent variant="secondary" size="icon">
                                        <span class="material-symbols-outlined">qr_code</span>
                                    </ButtonComponent>
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
                                    <div class="flex flex-col items-center gap-2">
                                        <ButtonComponent variant="outline" @click="showUrl = !showUrl">
                                            {{ showUrl ? staticContent.startPage.hideQr[sessionStore.activeLanguage] :
                                                staticContent.startPage.showQr[sessionStore.activeLanguage] }}
                                        </ButtonComponent>

                                        <div
v-if="showUrl"
                                            class="w-full max-w-md break-words text-center flex flex-col items-center gap-3 p-4 border rounded bg-gray-50 dark:bg-gray-900 border-gray-300">
                                            <div id="feedback-url-text">{{ feedbackUrl }}</div>
                                            <ButtonComponent variant="outline" @click="copyUrlToClipboard">
                                                {{ copied ?
                                                    staticContent.startPage.copiedLink[sessionStore.activeLanguage] :
                                                    staticContent.startPage.copyLink[sessionStore.activeLanguage] }}
                                            </ButtonComponent>
                                        </div>

                                    </div>

                                </DialogContent>
                            </Dialog>
                        </div>
                        <!-- Start Session Button -->
                        <div v-if="!props.isArchivedView">
                            <Dialog>
                                <DialogTrigger as-child>
                                    <ButtonComponent variant="default" size="icon">
                                        <Play class="w-4 h-4" />
                                    </ButtonComponent>
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
                                    <Select id="roleSelect" v-model="sessionStore.sessionRole" class="my-4">
                                        <SelectTrigger>
                                            <SelectValue
                                                :placeholder="staticContent.placeholders.roleSelect[sessionStore.activeLanguage]" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <RecursiveSelect :node="sessionStore.availableRoles" />
                                        </SelectContent>
                                    </Select>


                                    <!-- Pooling/combine Button Dialog -->
                                    <DialogFooter class="flex justify-between">
                                        <Dialog v-if="sessionStore.instructorView" v-model:open="showPoolingDialog">
                                            <DialogTrigger as-child>
                                                <ButtonComponent class="mr-auto" type="button">
                                                    {{
                                                        staticContent.startPage.poolingButton[sessionStore.activeLanguage]
                                                    }}
                                                </ButtonComponent>
                                            </DialogTrigger>

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
                                                    <div class="mt-4 flex items-center gap-2">
                                                        <Checkbox
id="create-copy-before-pooling"
                                                            v-model:checked="createCopyBeforePooling" />
                                                        <label
for="create-copy-before-pooling"
                                                            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                            {{
                                                                staticContent.startPage.createCopyBeforePooling[sessionStore.activeLanguage]
                                                            }}
                                                        </label>
                                                    </div>
                                                    <div class="flex justify-between items-center mt-4">
                                                        <ButtonComponent variant="secondary" @click="showPoolingDialog = false">
                                                            Cancel
                                                        </ButtonComponent>
                                                        <ButtonComponent variant="destructive" @click="handlePoolingStart()">
                                                            {{ staticContent.startPage.pool[sessionStore.activeLanguage]
                                                            }}
                                                        </ButtonComponent>
                                                    </div>

                                                    <LoadingOverlay
:visible="loading"
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
                                        <ButtonComponent type="submit" @click="() => handleStartSession()">
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
                                        </ButtonComponent>
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