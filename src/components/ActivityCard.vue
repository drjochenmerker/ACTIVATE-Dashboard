<script lang="ts" setup>
import { defineProps, onMounted, ref } from 'vue';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { useColorMode } from '@vueuse/core';
import { useSessionStore } from '@/stores/sessionStore';
import { getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { Activity, KnowledgeGraphActivityClass } from '@/data/knowledge_graph/structures';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Label from '@/components/ui/label/Label.vue';
import Checkbox from '@/components/ui/checkbox/Checkbox.vue';
import { BookCopy, Play, Loader2 } from 'lucide-vue-next';
import { useActivityStore } from '@/stores/activityStore';

useColorMode();

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
sessionStore.availableRoles = [];
let newTitle = '';
let newDescription = '';

// Refs for dialog interaction
const isDeleteDialogOpen = ref(false);
const isCloneDialogOpen = ref(false);

// activity store management
const activityStore = useActivityStore();
let activities = ref<Activity[]>([]);

// load all activities on component mount
onMounted(async () => {
    activities.value = await activityStore.getAllActivities();
    //console.log("activities: ", activities.value);
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

// clone activity function
const cloneThisActivity = async (newTitle: string, newDescription: string) => {
    const clonedActivity = {
        graph: props.activity.graph,
        name: newTitle,
        description: newDescription
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

/**
 * Retrieves available roles for the current activity graph.
 * Fetches subject class IDs from the knowledge graph and populates the session store's available roles.
 */
const getRoles = async () => {
    const roles = await getActivityClassIds(props.activity.graph, KnowledgeGraphActivityClass.subject);
    sessionStore.availableRoles = Object.values(roles).flatMap(role => role.map(r => r.id));
}

const sessionStartAllowed = () => !sessionStore.sessionRole;
</script>

<template>
    <div class="rounded-xl shadow-md border bg-white dark:bg-gray-900 p-4 transition-all hover:shadow-lg">
        <Accordion type="single" class="w-full" collapsible>
            <AccordionItem :value="props.activity.graph">
                <AccordionTrigger class="text-lg font-semibold hover:underline" @click="getRoles">
                    {{ props.activity.name }}
                </AccordionTrigger>

                <AccordionContent class="pt-4 space-y-4 text-sm text-gray-600 dark:text-gray-300">
                    <p>{{ props.activity.description }}</p>

                    <div class="flex justify-between items-center gap-4 flex-wrap">

                        <!-- Delete Button -->
                        <Dialog v-model:open="isDeleteDialogOpen">
                            <DialogTrigger as-child>
                                <button class="icon-button">
                                    <span class="material-symbols-outlined">delete</span>
                                </button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Activity</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete this Activity?
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button @click="() => deleteThisActivity()">Delete</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <!-- Clone Button -->
                        <Dialog v-model:open="isCloneDialogOpen">
                            <DialogTrigger as-child>
                                <Button variant="secondary" size="icon">
                                    <BookCopy class="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Clone Activity</DialogTitle>
                                    <DialogDescription>Set a new title:</DialogDescription>
                                    <textarea v-model="newTitle" class="w-full border rounded p-2 my-2"
                                        placeholder="New title" />
                                    <DialogDescription>Set a new description:</DialogDescription>
                                    <textarea v-model="newDescription" class="w-full border rounded p-2 my-2"
                                        placeholder="Set new description (optional)" />
                                </DialogHeader>
                                <DialogFooter>
                                    <Button @click="() => cloneThisActivity(newTitle, newDescription)">Clone</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <!-- Start Session Button -->
                        <Dialog>
                            <DialogTrigger as-child>
                                <Button variant="default" size="icon">
                                    <Play class="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Role Selection</DialogTitle>
                                    <DialogDescription>Select your role for the debriefing:</DialogDescription>
                                </DialogHeader>

                                <!-- Select a role-->
                                <Select v-model="sessionStore.sessionRole" id="roleSelect" class="my-4">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem v-for="role in sessionStore.availableRoles" :value="role"
                                            :key="role">
                                            {{ role }}

                                        </SelectItem>
                                    </SelectContent>

                                </Select>


                                <!-- Instructor mode toggle -->
                                <div class="flex items-center space-x-2 mt-4">
                                    <Checkbox id="cbInstructorMode" :checked="sessionStore.instructorMode"
                                        @update:checked="sessionStore.instructorMode = $event" />
                                    <Label for="cbInstructorMode" class="text-sm font-normal">
                                        Enable Instructor Mode
                                    </Label>
                                </div>


                                <DialogFooter>
                                    <Button type="submit" :disabled="sessionStartAllowed()"
                                        @click="() => handleStartSession()">
                                        <template v-if="sessionStartAllowed()">
                                            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
                                            Select activity and role
                                        </template>
                                        <template v-else>
                                            <Play class="w-4 h-4 mr-2" />
                                            Start Debriefing
                                        </template>
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
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