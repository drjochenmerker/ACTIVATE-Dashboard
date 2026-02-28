<script lang="ts" setup>
// TODO: implement the functionality for cloning activities, editing and maybe bring back the role selection from INPROGRESS FILE
import { onMounted, computed, ref, nextTick } from "vue";
import { useSessionStore } from "@/stores/sessionStore";
import { getActivityClassIds } from "@/data/knowledge_graph/read_operations";
import { useActivityStore } from "@/stores/activityStore";
import { buildTreeStructByLang } from "@/data/knowledge_graph/utils";

import { Activity, KnowledgeGraphActivityClass, NestedMultiLangObject } from "@/data/knowledge_graph/structures";
import { CustomAccordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
    CustomDialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import QrcodeVue from "qrcode.vue";

import { CustomButton } from "@/components/ui/button";

import { Play } from "lucide-vue-next";

import { staticContent } from "@/data/contentData";
import { llmPool } from "@/data/knowledge_graph/llm_utils";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import RecursiveSelect from "./RecursiveSelect.vue";
import { CustomSelect, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";
import { useLLMSettingsStore } from "@/stores/llmSettingsStore";
import DeletionPopUp from "./DeletionPopUp.vue";

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

// Refs for dialog interaction
const isDeleteDialogOpen = ref(false);

const showPoolingDialog = ref(false);
const nothingToPool = ref(false);
const loading = ref(false);
const copied = ref(false);

// activity store management
const activityStore = useActivityStore();
const activities = ref<Activity[]>([]);

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
                role.values[0].labels.en === "Instructor"
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
            const el = document.getElementById("feedback-url-text");
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
        console.error("Fehler beim Kopieren: ", err);
    }
};

//delete activity function
const deleteThisActivity = async () => {
    activityStore.removeActivity(graph);
    activityStore.refreshActivityList();

    isDeleteDialogOpen.value = false;
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
};

const sessionStartAllowed = () => true; // TODO tmp for no role selection
const handlePoolingStart = async () => {
    const llmSettingsStore = useLLMSettingsStore();
    try {
        loading.value = true;
        const res = await llmPool(props.activity.graph, llmSettingsStore.getCurrentModelRequestConfig());
        if (res.success === false) {
            nothingToPool.value = true;
            loading.value = false;
            return;
        }
        showPoolingDialog.value = false;
    } catch (error) {
        console.error("Error during pooling:", error);
    }
};

// work with the qr code
const showQrDialog = ref(false);
const showUrl = ref(false);
</script>

<template>
    <div class="rounded-xl shadow-md bg-white dark:bg-gray-900 p-4 transition-all hover:shadow-lg">
        <CustomAccordion type="single" class="w-full" collapsible>
            <AccordionItem :value="props.activity.graph" class="accordion-item border-0">
                <AccordionTrigger
                    class="accordion-trigger text-lg font-semibold text-middle flex justify-center xl:text-xl"
                    @click="getRoles"
                >
                    {{ props.activity.name[sessionStore.activeLanguage] || props.activity.name["default"] }}
                </AccordionTrigger>

                <AccordionContent class="pt-4 space-y-4 text-sm text-gray-600 dark:text-gray-300">
                    <div class="h-[1px] bg-gray-200 dark:bg-gray-700 my-2"></div>

                    <!-- Description -->
                    <p class="text-base">
                        {{
                            props.activity.description[sessionStore.activeLanguage] ||
                            props.activity.description["default"]
                        }}
                    </p>

                    <!-- Buttons-->
                    <div class="flex justify-between items-center gap-4 flex-wrap">
                        <!-- Delete Button -->
                        <div>
                            <DeletionPopUp
                                :title="staticContent.startPage.deleteActivity[sessionStore.activeLanguage]"
                                :description="
                                    staticContent.startPage.deleteActivityConfirm[sessionStore.activeLanguage]
                                "
                                :delete-function="() => deleteThisActivity()"
                            />
                        </div>

                        <!-- Feedback QR Code Button -->
                        <div>
                            <CustomDialog v-model:open="showQrDialog">
                                <DialogTrigger as-child>
                                    <CustomButton variant="secondary" size="icon">
                                        <span class="material-symbols-outlined">qr_code</span>
                                    </CustomButton>
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

                                    <div class="flex flex-col items-center gap-2">
                                        <CustomButton variant="outline" @click="showUrl = !showUrl">
                                            {{
                                                showUrl
                                                    ? staticContent.startPage.hideQr[sessionStore.activeLanguage]
                                                    : staticContent.startPage.showQr[sessionStore.activeLanguage]
                                            }}
                                        </CustomButton>

                                        <div
                                            v-if="showUrl"
                                            class="w-full max-w-md break-words text-center p-4 border rounded bg-gray-50 flex flex-col items-center gap-3"
                                        >
                                            <div id="feedback-url-text">{{ feedbackUrl }}</div>
                                            <CustomButton variant="outline" @click="copyUrlToClipboard">
                                                {{
                                                    copied
                                                        ? staticContent.startPage.copiedLink[
                                                              sessionStore.activeLanguage
                                                          ]
                                                        : staticContent.startPage.copyLink[sessionStore.activeLanguage]
                                                }}
                                            </CustomButton>
                                        </div>
                                    </div>
                                </DialogContent>
                            </CustomDialog>
                        </div>
                        <!-- Start Session Button -->
                        <div>
                            <CustomDialog>
                                <DialogTrigger as-child>
                                    <CustomButton variant="default" size="icon">
                                        <Play class="w-4 h-4" />
                                    </CustomButton>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {{ staticContent.startPage.startDebriefing[sessionStore.activeLanguage] }}
                                        </DialogTitle>
                                        <DialogDescription
                                            >{{
                                                staticContent.startPage.withoutRoleSelectText[
                                                    sessionStore.activeLanguage
                                                ]
                                            }}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <!-- Select a role-->
                                    <CustomSelect id="roleSelect" v-model="sessionStore.sessionRole" class="my-4">
                                        <SelectTrigger>
                                            <SelectValue
                                                :placeholder="
                                                    staticContent.placeholders.roleSelect[sessionStore.activeLanguage]
                                                "
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <RecursiveSelect :node="sessionStore.availableRoles" />
                                        </SelectContent>
                                    </CustomSelect>

                                    <!-- Pooling Button Dialog -->
                                    <DialogFooter class="flex justify-between">
                                        <CustomDialog v-model:open="showPoolingDialog">
                                            <DialogTrigger as-child>
                                                <CustomButton class="mr-auto" type="button">
                                                    {{
                                                        staticContent.startPage.poolingButton[
                                                            sessionStore.activeLanguage
                                                        ]
                                                    }}
                                                </CustomButton>
                                            </DialogTrigger>

                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        {{
                                                            staticContent.startPage.confirmation[
                                                                sessionStore.activeLanguage
                                                            ]
                                                        }}
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        {{
                                                            staticContent.startPage.confirmationText[
                                                                sessionStore.activeLanguage
                                                            ]
                                                        }}
                                                    </DialogDescription>
                                                    <div class="flex justify-between items-center mt-4">
                                                        <CustomButton
                                                            variant="secondary"
                                                            @click="showPoolingDialog = false"
                                                        >
                                                            Cancel
                                                        </CustomButton>
                                                        <CustomButton
                                                            variant="destructive"
                                                            @click="handlePoolingStart()"
                                                        >
                                                            {{
                                                                staticContent.startPage.pool[
                                                                    sessionStore.activeLanguage
                                                                ]
                                                            }}
                                                        </CustomButton>
                                                    </div>

                                                    <LoadingOverlay
                                                        :visible="loading"
                                                        :message="
                                                            staticContent.placeholders.loading[
                                                                sessionStore.activeLanguage
                                                            ]
                                                        "
                                                    />
                                                    <p v-if="nothingToPool" class="mt-4 text-red-500 font-semibold">
                                                        {{
                                                            staticContent.startPage.noPoolAvailable[
                                                                sessionStore.activeLanguage
                                                            ]
                                                        }}
                                                    </p>
                                                </DialogHeader>
                                            </DialogContent>
                                        </CustomDialog>

                                        <CustomButton type="submit" @click="() => handleStartSession()">
                                            <template v-if="sessionStartAllowed()">
                                                {{
                                                    staticContent.startPage.startDebriefing[sessionStore.activeLanguage]
                                                }}
                                            </template>
                                            <template v-else>
                                                <Play class="w-4 h-4 mr-2" />
                                                {{
                                                    staticContent.startPage.startDebriefing[sessionStore.activeLanguage]
                                                }}
                                            </template>
                                        </CustomButton>
                                    </DialogFooter>
                                </DialogContent>
                            </CustomDialog>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </CustomAccordion>
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
