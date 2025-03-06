<script setup lang="ts">
import { ref } from 'vue';
import Button from '@/components/ui/button/Button.vue';

import { defineProps } from 'vue';

defineProps<{
    isOpen: Boolean
}>();
  
const isOpen = ref(false);
const subject = ref('');
const predicate = ref('');
const object = ref('');
  
const openDialog = () => {
    isOpen.value = true;
};

const closeDialog = () => {
    isOpen.value = false;
    resetInputs();
};

const resetInputs = () => {
    subject.value = '';
    predicate.value = '';
    object.value = '';
};

const isValidWord = (word: string): boolean => {
    const regex = /^[A-Za-z]+$/;
    return regex.test(word);
};

const applyTriple = () => {
    if (!isValidWord(subject.value)) {
        alert("Subject darf nur Buchstaben enthalten, ohne Leerzeichen, Zahlen oder Sonderzeichen.");
        return;
    }
    if (!isValidWord(predicate.value)) {
        alert("Predicate darf nur Buchstaben enthalten, ohne Leerzeichen, Zahlen oder Sonderzeichen.");
        return;
    }
    if (!isValidWord(object.value)) {
        alert("Object darf nur Buchstaben enthalten, ohne Leerzeichen, Zahlen oder Sonderzeichen.");
        return;
    }

    // TODO: Hier die Logik zum Hinzufügen des Triples implementieren
    console.log('Triple:', subject.value, predicate.value, object.value);
    closeDialog();
};
</script>

<template> 
    <Button class="mb-4" @click="openDialog">
        Add RDF Triple
    </Button>

    <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" @click.self="closeDialog">
        <div class="bg-white rounded shadow p-6 w-full max-w-md">
            <h2 class="text-xl font-bold mb-4">Add New RDF-Triple</h2>
            <p class="mb-8">Only add single words without numbers, spaces, special characters</p>

        <div class="grid grid-cols-3 gap-4 mb-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Subject:</label>
                <input v-model="subject" type="text" class="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1"/>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Predicate:</label>
                <input v-model="predicate" type="text" class="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1"/>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Object:</label>
                <input v-model="object" type="text" class="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1"/>
            </div>
        </div>

        <div class="flex justify-between space-x-2">
            <Button @click="closeDialog">
            Cancel
            </Button>
            <Button @click="applyTriple">
            Apply
            </Button>
        </div>
    </div>
</div>
</template>
  
<style scoped>

</style>
  