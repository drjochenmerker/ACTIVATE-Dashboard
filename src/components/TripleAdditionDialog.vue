<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import CustomButton from '@/components/ui/button/CustomButton.vue';
import { useColorMode } from '@vueuse/core';
import { addPredicate, updateTriple } from '@/data/knowledge_graph/write_operations';
import {
    Activity,
    KnowledgeGraphActivityClass,
    LanguageCode,
    LanguageLabel,
    Objective,
    Predicate,
    PredicateDict,
    RDFOperation,
} from '@/data/knowledge_graph/structures';
import { getActivityDetail, getPredicateObject } from '@/data/knowledge_graph/read_operations';
import { useSessionStore } from '@/stores/sessionStore';
import { staticContent } from '@/data/contentData';

/**
 * Props of the RDFTripleAdder component
 * @property isOpen - Determines if the modal is open (controlled from parent)
 */
const props = defineProps<{
    isOpen: boolean;
}>();

// Global state
const sessionStore = useSessionStore();
const mode = useColorMode();

// State variables
const isOpen = ref(props.isOpen);
const subject = ref({} as Objective);
const predicate = ref({} as Predicate);
const object = ref({} as Objective);
const selectedDuplicateClass = ref(false);
const noExistingPredicates = ref(false);
const noValidParticipants = ref(false);

// Participants and predicates
// participants are objectives here - should probably be renamed
const activityParticipants = ref([] as Array<Objective>);
const activityPredicates = ref<PredicateDict | null>(null);
const predicateOptions = ref([] as Array<Predicate>);
const predicates = ref([] as Array<Predicate>);

/**
 * Validation Computeds
 */
const isSubjectValid = computed(() => {
    return activityParticipants.value.some((item) => item.id === subject.value.id);
});

const isObjectValid = computed(() => {
    return activityParticipants.value.some((item) => item.id === object.value.id);
});

const isPredicateValid = computed(() => {
    const regex = /^[A-Za-z]+$/;
    return regex.test(predicate.value.id);
});

const isApplyEnabled = computed(() => {
    return (
        isSubjectValid.value &&
        isObjectValid.value &&
        isPredicateValid.value &&
        !selectedDuplicateClass.value &&
        !noValidParticipants.value
    );
});

/**
 * Opens the modal dialog
 * Fetches current activity detail to populate participants
 */
const openDialog = async () => {
    isOpen.value = true;
    activityParticipants.value = [];
    const activityData = await getActivityDetail(sessionStore.sessionActivity as Activity);
    Object.keys(activityData).forEach((key) => {
        const items = activityData[key];
        if (Array.isArray(items)) {
            items.forEach((item) => {
                if (item && item.labels) {
                    activityParticipants.value.push(item);
                }
            });
        }
    });
};

/**
 * Load predicates on component mount
 */
onMounted(async () => {
    selectedDuplicateClass.value = false;
    noExistingPredicates.value = false;
    noValidParticipants.value = false;
    activityPredicates.value = await getPredicateObject(sessionStore.sessionActivity!.graph);
});

/**
 * Watch subject/object input to determine valid predicates
 */
watch([subject, object], () => {
    predicate.value = { id: '', labels: { en: '' } };
    selectedDuplicateClass.value = false;
    noExistingPredicates.value = false;
    noValidParticipants.value = false;

    if (isSubjectValid.value && isObjectValid.value) {
        if (subject.value.type !== object.value.type) {
            if (subject.value.type && object.value.type && activityPredicates.value) {
                try {
                    predicates.value =
                        (activityPredicates.value.get([subject.value.type, object.value.type]) as Array<Predicate>) ||
                        [];
                } catch (_error) {
                    predicates.value = [];
                }
            }
            if (predicates.value.length > 0) {
                predicateOptions.value = predicates.value;
            } else {
                predicateOptions.value = [];
                noExistingPredicates.value = true;
            }
        } else {
            selectedDuplicateClass.value = true;
        }
    } else {
        noValidParticipants.value = true;
    }
});

/**
 * Resets form and closes dialog
 */
const resetInputs = () => {
    subject.value = {} as Objective;
    object.value = {} as Objective;
    predicate.value = {} as Predicate;
};

const closeDialog = () => {
    isOpen.value = false;
    resetInputs();
};

/**
 * Applies the RDF triple by calling write operations
 */
const applyTriple = async () => {
    // TODO - Actually implement Multi-Language
    const languageLabelDummy: LanguageLabel[] = [
        { label: predicate.value.id, language: LanguageCode.Deutsch },
        { label: predicate.value.id, language: LanguageCode.English },
        { label: predicate.value.id, language: LanguageCode.Svenska },
    ];

    if (predicates.value.length === 0 || !predicates.value.some((item) => item.id === predicate.value.id)) {
        if (subject.value.type && object.value.type) {
            await addPredicate(
                sessionStore.sessionActivity!.graph,
                predicate.value.id,
                [subject.value.type as KnowledgeGraphActivityClass],
                [object.value.type as KnowledgeGraphActivityClass],
                languageLabelDummy,
            );
        }
    }
    updateTriple(
        sessionStore.sessionActivity!.graph,
        { subject: subject.value.id, predicate: predicate.value.id, object: object.value.id },
        'insert' as RDFOperation,
    );

    closeDialog();
};
</script>

<template>
    <CustomButton class="mb-4" @click="openDialog">
        {{ staticContent.tripleAdd.addTripleText[sessionStore.activeLanguage] }}
    </CustomButton>

    <div
        v-if="isOpen"
        class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        @click.self="closeDialog"
    >
        <div
            :class="
                mode === 'dark'
                    ? 'rounded shadow p-6 w-full max-w-5xl bg-gray-800 relative'
                    : 'rounded shadow p-6 w-full max-w-5xl bg-white relative'
            "
        >
            <button class="close-btn" @click="closeDialog">×</button>
            <div class="header-container flex items-center mb-4">
                <h2 class="text-xl font-bold">
                    {{ staticContent.tripleAdd.addTripleText[sessionStore.activeLanguage] }}
                </h2>
                <div class="alert-container">
                    <p v-if="selectedDuplicateClass" class="alert-message">
                        {{ staticContent.tripleAdd.alertDuplicateClass[sessionStore.activeLanguage] }}
                    </p>
                    <p v-else-if="noExistingPredicates" class="alert-message">
                        {{ staticContent.tripleAdd.alertNoExistingPredicates[sessionStore.activeLanguage] }}
                    </p>
                    <p v-else-if="noValidParticipants" class="alert-message">
                        {{ staticContent.tripleAdd.alertNoValidParticipants[sessionStore.activeLanguage] }}
                    </p>
                    <p v-else-if="isObjectValid && isSubjectValid && !isPredicateValid" class="alert-message">
                        {{ staticContent.tripleAdd.invalidPredicate[sessionStore.activeLanguage] }}
                    </p>
                </div>
            </div>
            <p class="mb-4">{{ staticContent.tripleAdd.mainText[sessionStore.activeLanguage] }}</p>

            <div class="flex space-x-4 mb-6">
                <!-- Subject Field -->
                <div class="flex-1">
                    <RDFAdditionDropdown
                        v-model="subject"
                        label="Agent"
                        :options="activityParticipants"
                        :disabled="false"
                    />
                </div>

                <!-- Predicate Field -->
                <div class="flex-1">
                    <RDFAdditionDropdown
                        v-model="predicate"
                        label="Predicate"
                        :options="predicateOptions"
                        :disabled="!isSubjectValid || !isObjectValid"
                    />
                </div>

                <!-- Object Field -->
                <div class="flex-1">
                    <RDFAdditionDropdown
                        v-model="object"
                        label="Target"
                        :options="activityParticipants"
                        :disabled="!isSubjectValid"
                    />
                </div>
            </div>

            <div class="flex gap-4">
                <CustomButton class="w-full" :disabled="!isApplyEnabled" @click="applyTriple">{{
                    staticContent.tripleAdd.addTripleText[sessionStore.activeLanguage]
                }}</CustomButton>
            </div>
        </div>
    </div>
</template>

<style scoped>
.close-btn {
    position: absolute;
    top: 0.5rem;
    right: 1rem;
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
