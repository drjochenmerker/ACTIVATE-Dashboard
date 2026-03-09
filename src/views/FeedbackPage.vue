<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// UI components
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import RecursiveSelect from '@/components/RecursiveSelect.vue';
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import LanguageSelect from '@/components/LanguageSelect.vue'

import { useSessionStore } from '@/stores/sessionStore'
import { staticContent } from '@/data/contentData'
import { buildTreeStructByLang } from '@/data/knowledge_graph/utils';
import { getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { KnowledgeGraphActivityClass } from '@/data/knowledge_graph/structures';
import { llmSubmit } from '@/data/knowledge_graph/llm_utils';
import { staticContentFeedback } from '@/data/feedbackQuestions';
import { useLLMSettingsStore } from '@/stores/llmSettingsStore';
import LogoutButton from '@/components/LogoutButton.vue';
import OptionsButton from '@/components/OptionsButton.vue';
import ThemeSwitchButton from '@/components/ThemeSwitchButton.vue';
import HomeButton from '@/components/HomeButton.vue';
import ErrorDialog from '@/components/ErrorDialog.vue';
import { showError, useErrorDialog } from '@/composables/useErrorDialog';

const { isOpen: errorDialogOpen } = useErrorDialog();

const props = defineProps<{ graph: string }>()

const router = useRouter()
const sessionStore = useSessionStore()

const activeLang = computed(() => sessionStore.activeLanguage)
const loading = ref(false);

// 1. Define groups
const questionGroups = Object.keys(staticContentFeedback)
    .filter(key => key !== 'feedbackpage') as (keyof typeof staticContentFeedback)[];

// 2. Helper function to initialize the 'answers' state
const initializeAnswers = (): Record<string, Record<string, string>> => {
    const initialState: Record<string, Record<string, string>> = {};
    for (const groupKey of questionGroups) {
        initialState[groupKey] = {};
        const groupData = staticContentFeedback[groupKey];

        // Find all 'questionX' keys in the group
        const questionKeys = Object.keys(groupData)
            .filter(key => key.startsWith('question'));

        for (const questionKey of questionKeys) {
            initialState[groupKey][questionKey] = '';
        }
    }
    return initialState;
};

// 3. Initialize 'answers' as a reactive object
const answers = ref<Record<string, Record<string, string>>>(initializeAnswers());

const groupedQuestionData = computed(() => {
    const lang = activeLang.value;

    return questionGroups.map(groupKey => {
        const groupData = staticContentFeedback[groupKey];

        // 1. Get title of group
        let title: string = String(groupKey);
        if ('title' in groupData && groupData.title) {
            title = groupData.title[lang] || groupData.title['de'] || String(groupKey);
        }

        // 2. Get all questions of the group
        const questions = Object.keys(groupData)
            .filter(key => key.startsWith('question'))
            .map(questionKey => {
                const gd = groupData as Record<string, Record<string, string>>;
                const texts = gd[questionKey] || {};
                const text = texts[lang] || texts['de'] || '';
                return {
                    key: questionKey,
                    text: text
                };
            })
            // Filter out empty questions
            .filter(q => q.text && q.text.trim() !== '');

        return {
            key: groupKey,
            title: title,
            questions: questions
        };
    })
        // Filter out entire groups if they have no questions for the language
        .filter(g => g.questions.length > 0);
});

onMounted(async () => {
    await getRoles();
});

/**
 * Retrieves available roles for the current activity graph.
 */
const getRoles = async () => {
    const roles = await getActivityClassIds(props.graph, KnowledgeGraphActivityClass.subject);
    sessionStore.availableRoles = buildTreeStructByLang(
        roles,
        activeLang.value
    );
}

const submitFeedback = async () => {
    if (!sessionStore.sessionRole) {
        alert('Please select your role before submitting.')
        return
    }

    const roles = await getActivityClassIds(props.graph, KnowledgeGraphActivityClass.subject);
    const selectedRole = roles.find(role => role.id === sessionStore.sessionRole);

    if (!selectedRole) {
        alert('Selected role not found!');
        return;
    }

    const roleLabel = selectedRole.labels[activeLang.value] || selectedRole.labels['default'] || selectedRole.labels['en'];

    // Build correct role object
    const roleForSubmit = {
        id: selectedRole.id,
        label: roleLabel
    };

    // --- Build full feedback object (NEUE LOGIK aus Version 2) ---
    const fullData = [];
    const lang = activeLang.value;

    // Iterate through our 'answers' object
    for (const groupKey in answers.value) {
        const groupAnswers = answers.value[groupKey];

        for (const questionKey in groupAnswers) {
            const answer = groupAnswers[questionKey];

            // Find the question text in the original data (with fallback)
            const groupStatic = (staticContentFeedback as any)[groupKey];
            const questionText = groupStatic?.[questionKey]?.[lang] || groupStatic?.[questionKey]?.['de'];

            // Add only if question text exists
            if (questionText && questionText.trim() !== '') {
                fullData.push({
                    question: questionText,
                    answer: answer || ''
                });
            }
        }
    }

    // TODO console.log("Submitting feedback data:", fullData);

    const feedbackData = {
        graph: props.graph,
        role: roleForSubmit,
        data: fullData
    };

    try {
        loading.value = true;
        const llmSettingsStore = useLLMSettingsStore();
        const result = await llmSubmit(feedbackData.graph, feedbackData.role, feedbackData.data, llmSettingsStore.getCurrentModelRequestConfig());
        loading.value = false;
        
        if (!result.success) {
            showError(
                result.message || staticContent.errors.llmActionFailed,
                result.llmError
            );
            return;
        }
    } catch (error) {
        loading.value = false;
        console.error("Error submitting feedback:", error);
        showError(staticContent.errors.llmActionFailed);
        return;
    }
    try {
        await router.push('/feedback-thank-you')
        // TODO maybe show feedback success message earlier because right now it takes too long
    } catch (err) {
        console.error('Navigation failed:', err)
    }
}
</script>

<template>
    <div class="min-h-screen flex flex-col lg:w-[1024px] lg:mx-auto justify-between bg-gray-100 p-4 text-gray-800">
        <ErrorDialog v-if="errorDialogOpen" />

        <div class="flex items-center gap-2 justify-end w-full mb-4">
            <LanguageSelect />
            <template v-if="sessionStore.instructorMode">
                <OptionsButton />
            </template>
            <HomeButton />
            <LogoutButton />
            <ThemeSwitchButton />
        </div>

        <div class="space-y-6">
            <div class="mb-6">
                <Select :model-value="sessionStore.sessionRole" @update:model-value="sessionStore.sessionRole = $event"
                    id="roleSelect" class="my-4">
                    <SelectTrigger>
                        <SelectValue
                            :placeholder="staticContent.placeholders.roleSelect[sessionStore.activeLanguage] || sessionStore.sessionRole" />
                    </SelectTrigger>
                    <SelectContent>
                        <RecursiveSelect :node="sessionStore.availableRoles" />
                    </SelectContent>
                </Select>
            </div>

            <div v-for="group in groupedQuestionData" :key="group.key"
                class="mb-6 p-4 border rounded-lg bg-white shadow-sm space-y-4">

                <h2 class="text-xl font-semibold text-gray-900 border-b pb-2">
                    {{ group.title }}
                </h2>

                <div v-for="question in group.questions" :key="question.key" class="space-y-2">
                    <label :for="group.key + question.key" class="block text-lg font-medium">
                        {{ question.text }}
                    </label>
                    <textarea :id="group.key + question.key" v-model="answers[group.key][question.key]"
                        class="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        rows="4" :placeholder="staticContent.placeholders.feedbackAnswer[activeLang]" />
                </div>
            </div>


        </div>

        <div class="mt-8">
            <Button class="w-full" @click="submitFeedback">
                {{ staticContent.noteCards.save[activeLang] }}
            </Button>
        </div>
        <LoadingOverlay :visible="loading" :message="staticContent.placeholders.loading[activeLang]" />
    </div>
</template>