<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Button from '@/components/ui/button/Button.vue';
import RDFAdditionDropdown from './RDFAdditionDropdown.vue';
import { defineProps } from 'vue';
import { useColorMode } from '@vueuse/core';

const props = defineProps<{
    activity: any,
    isOpen: Boolean,
}>();

const activityData = props.activity
const activityParticipants = ref([] as Array<{ label: string }>);

onMounted(async () => {
    console.log(activityData)
});

const mode = useColorMode();

const isOpen = ref(false);
const subject = ref([] as Array<{ label: string }>);
const predicate = ref('');
const object = ref([] as Array<{ label: string }>);

// Dropdown-Werte (initial leer, damit "Choose Class" angezeigt wird)
const subjectType = ref('');
const predicateType = ref('');
const objectType = ref('');

// Dropdown Open States
const subjectDropdownOpen = ref(false);
const predicateDropdownOpen = ref(false);
const objectDropdownOpen = ref(false);

const openDialog = () => {
    isOpen.value = true;
    activityParticipants.value = [];
    // Alle Keys im JSON durchgehen und die 'label'-Werte sammeln
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
    subject.value = [];
    object.value = [];
    subjectType.value = '';
    predicateType.value = '';
    objectType.value = '';
    subjectDropdownOpen.value = false;
    predicateDropdownOpen.value = false;
    objectDropdownOpen.value = false;
};

const isValidWord = (word: string): boolean => {
    const regex = /^[A-Za-z]+$/;
    return regex.test(word);
};

const applyTriple = () => {
    if (!subject.value.every(item => isValidWord(item.label))) {
        alert("Subject can only contain letters without spaces, numbers, or special characters.");
        return;
    }
    if (!isValidWord(predicateType.value)) {
        alert("Predicate can only contain letters without spaces, numbers, or special characters.");
        return;
    }
    if (!object.value.every(item => isValidWord(item.label))) {
        alert("Object can only contain letters without spaces, numbers, or special characters.");
        return;
    }

    console.log('Triple:', subject.value, subjectType.value, predicate.value, predicateType.value, object.value, objectType.value);
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
                    <RDFAdditionDropdown label="Agent" :options="activityParticipants" :v-model="subject" />
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
                    <RDFAdditionDropdown label="Target" :options="activityParticipants" :v-model="object" />
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
