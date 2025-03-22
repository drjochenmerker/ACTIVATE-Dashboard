<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Button from '@/components/ui/button/Button.vue';
import RDFAdditionDropdown from './RDFAdditionDropdown.vue';
import { defineProps } from 'vue';
import { useColorMode } from '@vueuse/core';
import { updateTriple } from '@/data/knowledge_graph/write_operations';
import { PredicateDict, RDFOperation } from '@/data/knowledge_graph/structures';
import { getPredicateObject } from '@/data/knowledge_graph/read_operations';

const props = defineProps<{
    activity: any,
    isOpen: Boolean,
}>();


const mode = useColorMode();

const activityData = props.activity
const activityParticipants = ref([] as Array<{ label: string }>);
const activityPredicates = ref<PredicateDict | null>(null);
const predicateOptions = ref([] as Array<{ label: string }>);
const isOpen = ref(false);
const subject = ref('');
const predicate = ref('');
const object = ref('');
const selectedDuplicateClass = ref(false)
const noExistingPredicates = ref(false)
const noValidParticipants = ref(false)


const isSubjectValid = computed(() => {
    return activityParticipants.value.some(item => item.label === subject.value);
});

const isObjectValid = computed(() => {
    return activityParticipants.value.some(item => item.label === object.value);
});

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

const extractClass = (str: string): string | null => {
    const match = str.match(/\(([^)]+)\)/);
    return match ? match[1] : null;
};

onMounted(async () => {
    selectedDuplicateClass.value = false;
    noExistingPredicates.value = false;
    noValidParticipants.value = false;
    activityPredicates.value = await getPredicateObject('Urology_Emergency_after_Debriefing');
});

watch(object, () => {
    predicate.value = '';
    selectedDuplicateClass.value = false;
    noExistingPredicates.value = false;
    noValidParticipants.value = false;

    const subjectClass = extractClass(subject.value);
    const objectClass = extractClass(object.value);

    if (isSubjectValid.value && isObjectValid.value) {
        if (subjectClass !== objectClass) {
            let predicates: Array<{ predicate: string }> = [];
            if (subjectClass && objectClass && activityPredicates.value) {
                try {
                    predicates = (activityPredicates.value.get([subjectClass, objectClass]) as Array<{ predicate: string }>) || [];
                } catch (error) {
                    predicates = [];
                }      
            }
            if (predicates.length > 0) {
                predicateOptions.value = predicates.map(item => ({ label: item.predicate }));
                console.log(predicateOptions.value);
            } else {
                noExistingPredicates.value = true;
            }
        } else {
            selectedDuplicateClass.value = true;
        }
    } else {
        noValidParticipants.value = true;
    }
});

const closeDialog = () => {
    isOpen.value = false;
    resetInputs();
};

const resetInputs = () => {
    subject.value = '';
    object.value = '';
    predicate.value = '';
};

const cleanLabel = (label: string): string => {
    return label.replace(/\s*\(.*?\)\s*/g, '').replace(/\s+/g, '');
};

const applyTriple = () => {
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
        <div :class="mode === 'dark' ? 'rounded shadow p-6 w-full max-w-5xl bg-gray-800 relative' : 'rounded shadow p-6 w-full max-w-5xl bg-white relative'">

            <button class="close-btn" @click="closeDialog">×</button>
            <div class="header-container flex items-center mb-4">
                <h2 class="text-xl font-bold">Add New RDF-Triple</h2>
                <div class="alert-container">
                    <p v-if="selectedDuplicateClass" class="alert-message">
                        Subject and Object cannot be from the same class.
                    </p>
                    <p v-else-if="noExistingPredicates" class="alert-message">
                        No predicates available for the selected classes.
                    </p>
                    <p v-else-if="noValidParticipants" class="alert-message">
                        Please choose a valid agent and target to see associated predicates.
                    </p>
                </div>
            </div>

            <div class="flex space-x-4 mb-6">

                <!-- Subject Field -->
                <div class="flex-1">
                    <RDFAdditionDropdown label="Agent" :options="activityParticipants" v-model="subject"
                        :disabled="false" />
                </div>

                <!-- Predicate Field -->
                <div class="flex-1">
                    <RDFAdditionDropdown label="Predicate" :options="predicateOptions" v-model="predicate"
                        :disabled="!isSubjectValid || !isObjectValid" />
                </div>

                <!-- Object Field -->
                <div class="flex-1">
                    <RDFAdditionDropdown label="Target" :options="activityParticipants" v-model="object"
                        :disabled="!isSubjectValid" />
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
.close-btn {
  position: absolute;
  top: 0.5rem;
  right: 1.0rem;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: inherit;
}

.alert-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.alert-message {
    color: red;
    margin: 0;
}

.alert-placeholder {
    margin: 0;
}

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
