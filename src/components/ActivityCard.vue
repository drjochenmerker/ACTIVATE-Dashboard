<script lang="ts" setup>
import { defineProps, ref } from 'vue';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog'
import { useColorMode } from '@vueuse/core';
import { useSessionStore } from '@/stores/sessionStore';
import { getActivityClassIds, getActivityDetail } from '@/data/knowledge_graph/read_operations';
import { KnowledgeGraphActivityClass } from '@/data/knowledge_graph/structures';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Label from '@/components/ui/label/Label.vue';
import Checkbox from '@/components/ui/checkbox/Checkbox.vue';
import { BookCopy, Play, Loader2 } from 'lucide-vue-next';
import { cloneActivity, deleteActivity } from '@/data/knowledge_graph/write_operations';

useColorMode();
const sessionStore = useSessionStore();
const props = defineProps({
    activity: {
        type: Object,
        required: true,
    },
});
const graph = props.activity.graph;


let newTitle = '';
let newDescription = '';

// Refs for dialog interaction
const isDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const isCloneDialogOpen = ref(false);


const onDialogOpen = (open: boolean) => {
    isDialogOpen.value = open;

    if (open) {
        setTimeout(async () => {
            await getRoles();
        }, 50);
    }
};


// Handle session start when user clicks start button
const handleStartSession = async () => {
    sessionStore.sessionActivity = props.activity;
    sessionStore.startSession();
};

const cloneThisActivity = async (newTitle: string, newDescription: string) => {
    props.activity.name = newTitle;
    props.activity.description = newDescription;
    await cloneActivity(props.activity);
    console.log(props.activity)
    isCloneDialogOpen.value = false;
}
const deleteThisActivity = async () => {
    await deleteActivity(graph);
    isDeleteDialogOpen.value = false;
}

const getRoles = async () => {
    sessionStore.availableRoles = await getActivityClassIds(graph, KnowledgeGraphActivityClass.subject);
}

const sessionStartAllowed = () => !sessionStore.sessionRole;

</script>
<template>
    <div class="rounded-xl shadow-md border bg-white dark:bg-gray-900 p-4 transition-all hover:shadow-lg">
        <Accordion type="single" class="w-full" collapsible>
            <AccordionItem :value="props.activity.graph">
                <AccordionTrigger class="text-lg font-semibold hover:underline">
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
                                <Select v-model="sessionStore.sessionRole" id="roleSelect" class="my-4"
                                    @update:open="(isOpen) => { if (isOpen) getRoles(); }">
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
                                    <Button type="submit" @click="() => handleStartSession()">
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