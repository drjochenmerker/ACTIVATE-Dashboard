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

const props = defineProps<{ graph: string }>()

const router = useRouter()
const sessionStore = useSessionStore()

const activeLang = computed(() => sessionStore.activeLanguage)
const answers = ref(['', '', ''])
const loading = ref(false);


const localizedQuestions = computed(() => [
    // staticContent.feedbackpage.question1[activeLang.value],
    staticContent.feedbackpage.question2[activeLang.value],
    staticContent.feedbackpage.question3[activeLang.value]
])

onMounted(async () => {
    await getRoles();
    // console.log("Available roles:", sessionStore.availableRoles);
});


/**
 * Retrieves available roles for the current activity graph.
 * Fetches subject class IDs from the knowledge graph and populates the session store's available roles.
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

    // Build full feedback object
    const fullData = answers.value.map(answer => ({
        question: localizedQuestions.value[answers.value.indexOf(answer)],
        answer: answer
    }));

    const feedbackData = {
        graph: props.graph,
        role: roleForSubmit,
        data: fullData
    };

    try {
        loading.value = true;
        const res = await llmSubmit(feedbackData.graph, feedbackData.role, feedbackData.data);

        loading.value = false;
        if (!res.success) {
            console.error("LLM submission failed:", res.message);
            alert(`Failed to submit feedback: ${res.message}`);
            return;
        }
        console.log("LLM submission succeeded:", res.message);

    } catch (error) {
        loading.value = false;
        console.error("Error submitting feedback:", error);
        alert('Failed to submit feedback. Please try again.');
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
    <div class="min-h-screen flex flex-col justify-between bg-gray-100 p-4 text-gray-800">
        <div class="space-y-6">
            <div>
                <LanguageSelect class="absolute top-0 right-0 mt-4 mr-4" />
            </div>
            <div>

                <!-- Role selection -->
                <div class="mb-6">
                    <Select :model-value="sessionStore.sessionRole"
                        @update:model-value="sessionStore.sessionRole = $event" id="roleSelect" class="my-4">
                        <SelectTrigger>
                            <SelectValue
                                :placeholder="staticContent.placeholders.roleSelect[sessionStore.activeLanguage] || sessionStore.sessionRole" />
                        </SelectTrigger>
                        <SelectContent>
                            <RecursiveSelect :node="sessionStore.availableRoles" />
                        </SelectContent>
                    </Select>
                </div>



                <!-- Questions -->
                <div v-for="(question, index) in localizedQuestions" :key="index" class="space-y-2">
                    <label :for="'q' + index" class="block text-lg font-medium">
                        {{ question }}
                    </label>
                    <textarea :id="'q' + index" v-model="answers[index]"
                        class="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        rows="4" :placeholder="staticContent.placeholders.feedbackAnswer[activeLang]" />
                </div>
            </div>
        </div>

        <!-- Submit button -->
        <div class="mt-8">
            <Button class="w-full" @click="submitFeedback">
                {{ staticContent.noteCards.save[activeLang] }}
            </Button>
        </div>
        <LoadingOverlay :visible="loading" :message="staticContent.placeholders.loading[activeLang]" />
    </div>
</template>