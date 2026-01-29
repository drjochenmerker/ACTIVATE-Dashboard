<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

// UI components
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import RecursiveSelect from '@/components/RecursiveSelect.vue';

import { useSessionStore } from '@/stores/sessionStore'
import { staticContent } from '@/data/contentData'
import { buildTreeStructByLang } from '@/data/knowledge_graph/utils';
import { getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { KnowledgeGraphActivityClass } from '@/data/knowledge_graph/structures';
import { llmSubmit } from '@/data/knowledge_graph/llm_utils';
import { staticContentFeedback } from '@/data/feedbackQuestions';


const props = defineProps<{
    graph: string,
    sessionRole: string | null
}>()

const emit = defineEmits(['update:role'])

const sessionStore = useSessionStore()

// 1. Define groups
const questionGroups = Object.keys(staticContentFeedback)
    .filter(key => key !== 'feedbackpage') as (keyof typeof staticContentFeedback)[];

// 2. Helper function to initialize the 'answers' state
const initializeAnswers = (): Record<string, Record<string, string>> => {
    const initialState: Record<string, Record<string, string>> = {};
    for (const groupKey of questionGroups) {
        initialState[groupKey] = {};
        const groupData = staticContentFeedback[groupKey];
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
    return questionGroups.map(groupKey => {
        const groupData = staticContentFeedback[groupKey];
        let title: string = String(groupKey);
        if ('title' in groupData && groupData.title) {
            title = groupData.title[sessionStore.activeLanguage] || groupData.title['de'] || String(groupKey);
        }
        const questions = Object.keys(groupData)
            .filter(key => key.startsWith('question'))
            .map(questionKey => {
                const gd = groupData as Record<string, Record<string, string>>;
                const texts = gd[questionKey] || {};
                const text = texts[sessionStore.activeLanguage] || texts['de'] || '';
                return { key: questionKey, text: text };
            })
            .filter(q => q.text && q.text.trim() !== '');
        return { key: groupKey, title: title, questions: questions };
    })
        .filter(g => g.questions.length > 0);
});

// const feedbackAnswerPlaceholder = computed(() => {
//     const lang = props.activeLang as keyof typeof staticContent.placeholders.feedbackAnswer;
//     return staticContent.placeholders.feedbackAnswer[lang] ?? '';
// });

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
        sessionStore.activeLanguage
    );
}

// defines submit function to be called from parent component
defineExpose({
    submit: async (): Promise<boolean> => {
        if (!props.sessionRole) {
            alert('Please select your role before submitting.')
            return false;
        }
        const roles = await getActivityClassIds(props.graph, KnowledgeGraphActivityClass.subject);
        const selectedRole = roles.find(role => role.id === props.sessionRole);
        if (!selectedRole) {
            alert('Selected role not found!');
            return false;
        }
        const roleLabel = selectedRole.labels[sessionStore.activeLanguage] || selectedRole.labels['default'] || selectedRole.labels['en'];
        const roleForSubmit = { id: selectedRole.id, label: roleLabel };
        const fullData = [];
        const lang = sessionStore.activeLanguage;
        for (const groupKey in answers.value) {
            const groupAnswers = answers.value[groupKey];
            for (const questionKey in groupAnswers) {
                const answer = groupAnswers[questionKey];
                const groupStatic = (staticContentFeedback as any)[groupKey];
                const questionText = groupStatic?.[questionKey]?.[lang] || groupStatic?.[questionKey]?.['de'];
                if (questionText && questionText.trim() !== '') {
                    fullData.push({ question: questionText, answer: answer || '' });
                }
            }
        }
        const feedbackData = { graph: props.graph, role: roleForSubmit, data: fullData };
        try {
            await llmSubmit(feedbackData.graph, feedbackData.role, feedbackData.data);
            return true; // Erfolg
        } catch (error) {
            console.error("Error submitting feedback:", error);
            alert('Failed to submit feedback. Please try again.');
            return false; // Fehler
        }
    }
});
</script>

<template>
    <div class="space-y-6">
        <div class="mb-6">
            <Select :model-value="sessionRole ?? undefined" @update:model-value="emit('update:role', $event as string)"
                id="roleSelect" class="my-4">
                <SelectTrigger>
                    <SelectValue
                        :placeholder="staticContent.placeholders.roleSelect[sessionStore.activeLanguage] ?? (sessionRole ?? undefined)" />
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
                    rows="4" :placeholder="staticContent.placeholders.feedbackAnswer[sessionStore.activeLanguage]" />
            </div>
        </div>
    </div>
</template>
