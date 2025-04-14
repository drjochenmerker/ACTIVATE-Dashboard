<script lang="ts" setup>
import { defineProps, onMounted } from 'vue';
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
import { getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { KnowledgeGraphActivityClass } from '@/data/knowledge_graph/structures';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { Delete, BookCopy, Play, Loader2 } from 'lucide-vue-next';
import { cloneActivity, deleteActivity } from '@/data/knowledge_graph/write_operations';

useColorMode();
const sessionStore = useSessionStore();
const props = defineProps({
    activity: {
        type: Object,
        required: true,
    },
});
let newTitle = '';
const graph = props.activity.graph;

// Handle session start when user clicks start button
const handleStartSession = async () => {
    sessionStore.sessionActivity = props.activity;
    sessionStore.startSession();
};

const cloneThisActivity = async (newTitle: string) => {

    await cloneActivity(graph, newTitle);
    console.log('Activity cloned');
}

const deleteThisActivity = async () => {
    await deleteActivity(graph);
    console.log('Activity deleted');
}

const sessionStartAllowed = () => !sessionStore.sessionRole;

onMounted(async () => {
    try {
        sessionStore.availableRoles = await getActivityClassIds(props.activity.graph, KnowledgeGraphActivityClass.subject);
        sessionStore.sessionRole = ''; // Reset role selection
    } catch (error) {
        console.error("Fehler beim Laden der Aktivitäten:", error);
    }
});

</script>

<template>
    <div class="card">
        <Accordion type="single" class="w-full" collapsible>
            <AccordionItem :value="props.activity.graph">
                <AccordionTrigger class="accordion-title">{{ props.activity.name }}</AccordionTrigger>
                <AccordionContent>
                    <div>
                        {{ props.activity.description }}
                    </div>
                    <div class="buttons">
                        <div class="delete-activity-button">
                            <Dialog>
                                <DialogTrigger as-child>
                                    <Button variant="outline">
                                        <Delete />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent class="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Delete Activity</DialogTitle>
                                        <DialogDescription>Are you sure you want to delete this Activity?
                                        </DialogDescription>
                                        <Button @click="() => deleteThisActivity()"> delete </Button>
                                    </DialogHeader>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div class="clone-activity-button">
                            <Dialog>
                                <DialogTrigger as-child>
                                    <Button variant="outline">
                                        <BookCopy />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent class="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Clone Activity</DialogTitle>
                                        <DialogDescription>Set new title</DialogDescription>
                                        <textarea v-model="newTitle" />
                                        <Button @click="() => cloneThisActivity(newTitle)"> clone </Button>
                                    </DialogHeader>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div class="start-session-button">
                            <!-- Dialog to select role -->
                            <Dialog>
                                <DialogTrigger as-child>
                                    <Button variant="outline">
                                        <Play />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent class="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Select your role for the debriefing.</DialogTitle>
                                        <DialogDescription>
                                            Please select your role for the debriefing.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <!-- Select Role -->
                                    <!-- todo: show real roles lol-->
                                    <Select v-model="sessionStore.sessionRole" id="roleSelect">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Click to select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem v-for="role in sessionStore.availableRoles" :value="role">
                                                {{ role }}
                                            </SelectItem>
                                        </SelectContent>

                                        <DialogFooter>
                                            <Button type="submit" @click="() => handleStartSession()">
                                                <!-- Button content changes based on selection state -->
                                                <template v-if="sessionStartAllowed()">
                                                    <Loader2 class="w-4 h-4 mr-2 animate-spin" />
                                                    Select activity and role
                                                </template>
                                                <template v-else>
                                                    <Play />
                                                    Start debriefing
                                                </template>
                                            </Button>
                                        </DialogFooter>
                                    </Select>
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
</style>