<script setup lang="ts">
import { ref } from 'vue';
import Button from '@/components/ui/button/Button.vue';
import RDFAdditionDropdown from './RDFAdditionDropdown.vue';
import { defineProps } from 'vue';
import { useColorMode } from '@vueuse/core';
import { updateTriple } from '@/data/knowledge_graph/write_operations';
import { RDFOperation } from '@/data/knowledge_graph/structures';

const props = defineProps<{
    activity: any,
    isOpen: Boolean,
}>();

const activityData = props.activity
const activityParticipants = ref([] as Array<{ label: string }>);

const mode = useColorMode();

const isOpen = ref(false);
const subject = ref('');
const predicate = ref('');
const object = ref('');

const openDialog = () => {
    isOpen.value = true;
    activityParticipants.value = [];
    Object.keys(activityData).forEach(key => {
        const items = activityData[key];
        if (Array.isArray(items)) {
            items.forEach(item => {
                if (item && item.label) {
                    activityParticipants.value.push({ label: `${item.label} (${key})` });
                }
            });
        }
    });
    console.log(activityParticipants);
};

const closeDialog = () => {
    isOpen.value = false;
    resetInputs();
};

const resetInputs = () => {
    subject.value = '';
    object.value = '';
    predicate.value = '';
};

const isValidPredicate = (word: string): boolean => {
    const regex = /^[A-Za-z]+$/;
    return regex.test(word);
};

const isValidSubjectOrObject = (word: string): boolean => {
    return activityParticipants.value.some(participant => participant.label === word);
}

const cleanLabel = (label: string): string => {
    return label.replace(/\s*\(.*?\)\s*/g, '').replace(/\s+/g, '');
};

const applyTriple = () => {
    if (!isValidSubjectOrObject(subject.value)) {
        alert("Agent does not exist in this Activity. Please add it seperately.");
        return;
    }
    if (!isValidPredicate(predicate.value)) {
        alert("Predicate can only contain letters without spaces, numbers, or special characters.");
        return;
    }

    if (!isValidSubjectOrObject(object.value)) {
        alert("Target does not exist in this Activity. Please add it seperately.");
        return;
    }

    const subjectString = cleanLabel(subject.value);
    const objectString = cleanLabel(object.value);

    updateTriple('Urology_Emergency_after_Debriefing', { subject: subjectString, predicate: predicate.value, object: objectString }, 'insert' as RDFOperation)

    console.log('Added Triple:', subjectString, predicate.value, objectString);
    closeDialog();
};
</script>

<template>
    <Button class="mb-4" @click="openDialog">
        Add RDF Triple
    </Button>

    <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        @click.self="closeDialog">
        <div
            :class="mode === 'dark' ? 'rounded shadow p-6 w-full max-w-5xl bg-gray-800' : 'rounded shadow p-6 w-full max-w-5xl bg-white'">
            <h2 class="text-xl font-bold mb-4">Add New RDF-Triple</h2>
            <p class="mb-8">Only add single words without numbers, spaces, or special characters</p>

            <!-- Felder in einer Zeile -->
            <div class="flex space-x-4 mb-6">
                <!-- Subject Field -->
                <div class="flex-1">
                    <RDFAdditionDropdown label="Agent" :options="activityParticipants" v-model="subject" />
                </div>

                <!-- Predicate Field -->
                <div class="flex-1">
                    <h3 class="mb-0">Predicate:</h3>
                    <div class="predicate-container">
                        <input v-model="predicate" type="text" placeholder="Choose Predicate..." />
                    </div>
                </div>

                <!-- Object Field -->
                <div class="flex-1">
                    <RDFAdditionDropdown label="Target" :options="activityParticipants" v-model="object" />
                </div>
            </div>

            <div class="flex justify-between">
                <Button @click="closeDialog">Cancel</Button>
                <Button @click="applyTriple">Apply</Button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.predicate-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    border: 1px solid #ccc;
    padding: 5px;
    border-radius: 4px;
}

.predicate-container input {
    flex-grow: 1;
    padding: 8px;
    border: none;
}

.predicate-container input:focus {
    outline: none;
}
</style>
