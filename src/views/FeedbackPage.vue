<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// UI components
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import RecursiveSelect from '@/components/RecursiveSelect.vue';

import LanguageSelect from '@/components/LanguageSelect.vue'

import { useSessionStore } from '@/stores/sessionStore'
import { staticContent } from '@/data/contentData'
import { buildTreeStructByLang } from '@/data/knowledge_graph/utils';
import { getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { KnowledgeGraphActivityClass } from '@/data/knowledge_graph/structures';

const props = defineProps<{ graph: string }>()

const router = useRouter()
const sessionStore = useSessionStore()

const activeLang = computed(() => sessionStore.activeLanguage)
const answers = ref(['', '', ''])


const localizedQuestions = computed(() => [
    staticContent.feedbackpage.question1[activeLang.value],
    staticContent.feedbackpage.question2[activeLang.value],
    staticContent.feedbackpage.question3[activeLang.value]
])

onMounted(async () => {
    await getRoles();
    // LOG the available roles to the console
    // if (sessionStore.availableRoles.values) {
    //     sessionStore.availableRoles.values.forEach(role => {
    //         console.log("rollens: ", role.labels[sessionStore.activeLanguage]);
    //     });
    // }
});
const selectedRoleLabel = computed(() => {
    const roles = sessionStore.availableRoles.values || [];
    const selected = roles.find(role => role.id === sessionStore.sessionRole);
    return selected
        ? selected.labels[activeLang.value]
        : '';
});


/**
 * Retrieves available roles for the current activity graph.
 * Fetches subject class IDs from the knowledge graph and populates the session store's available roles.
 */
const getRoles = async () => {
    const roles = await getActivityClassIds(props.graph, KnowledgeGraphActivityClass.subject);
    sessionStore.availableRoles = buildTreeStructByLang(
        roles,
        activeLang.value,
        true
    );
    // available roles are now set in the sessionstore with
    // {id: "", labels: {de: "", en: "", sv: ""}, value:""}
    // console.log('Available roles:', sessionStore.availableRoles.values);

}

const submitFeedback = async () => {
    if (!sessionStore.sessionRole) {
        alert('Please select your role before submitting.')
        return
    }
    console.log("sessionrole", sessionStore.sessionRole)

    const fullData = answers.value.map(answer => ({
        question: localizedQuestions.value[answers.value.indexOf(answer)],
        answer: answer
    }));
    const feedbackData = {
        graph: props.graph,
        role: sessionStore.sessionRole, // todo correct role_id
        data: fullData
    }

    //sowohl antworten als fragen
    // so strukturiert wie doc example 
    // data: question und answer
    console.log('Submitted feedback object from student:', feedbackData)

    try {
        await router.push('/feedback-thank-you')
        console.log('Navigation to FeedbackThankyouPage was successful')
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
                    <Select v-model="sessionStore.sessionRole" id="roleSelect" class="my-4">
                        <SelectTrigger>
                            <span>
                                {{ selectedRoleLabel ||
                                    staticContent.placeholders.roleSelect[sessionStore.activeLanguage] }}
                            </span>
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
    </div>
</template>

<style scoped>
/* Optional: Adjust vertical spacing for smaller screens */
</style>
