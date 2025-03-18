<script setup lang="ts">
import { ref } from 'vue';
import Button from '@/components/ui/button/Button.vue';

import { defineProps } from 'vue';
import { useColorMode } from '@vueuse/core';

defineProps<{
    isOpen: Boolean
}>();

const mode = useColorMode();
  
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
        alert("Subject can only contain letters without spaces, numbers, or special characters.");
        return;
    }
    if (!isValidWord(predicate.value)) {
        alert("Predicate can only contain letters without spaces, numbers, or special characters.");
        return;
    }
    if (!isValidWord(object.value)) {
        alert("Object can only contain letters without spaces, numbers, or special characters.");
        return;
    }

    // TODO: Implement Logic for adding RDF-Triples here
    console.log('Triple:', subject.value, predicate.value, object.value);
    closeDialog();
};
</script>

<template> 
    <Button class="mb-4" @click="openDialog">
        Add RDF Triple
    </Button>

    <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" @click.self="closeDialog">
        <div :class="mode === 'dark' ? 'rounded shadow p-6 w-full max-w-md bg-custom-bg-gray' : 'rounded shadow p-6 w-full max-w-md bg-white'">
            <h2 class="text-xl font-bold mb-4">Add New RDF-Triple</h2>
            <p class="mb-8">Only add single words without numbers, spaces, special characters</p>

        <div class="grid grid-cols-3 gap-4 mb-4" :class="mode === 'dark' ? 'text-white' : 'text-gray-700'">
            <div>
                <label class="block text-sm font-medium">Agent:</label>
                <input v-model="subject" type="text" class="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1" :class="mode === 'dark' ? 'bg-custom-bg-gray-2' : 'bg-white'"/>
            </div>
            <div>
                <label class="block text-sm font-medium">Predicate:</label>
                <input v-model="predicate" type="text" class="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1" :class="mode === 'dark' ? 'bg-custom-bg-gray-2' : 'bg-white'"/>
            </div>
            <div>
                <label class="block text-sm font-medium">Target:</label>
                <input v-model="object" type="text" class="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1" :class="mode === 'dark' ? 'bg-custom-bg-gray-2' : 'bg-white'"/>
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
  