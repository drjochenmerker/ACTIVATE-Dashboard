<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/stores/sessionStore';
import { staticContent } from "@/data/contentData";
import { useRouter } from 'vue-router'


const router = useRouter()
const sessionStore = useSessionStore()
const activeLang = computed(() => sessionStore.activeLanguage)

const localizedQuestions = computed(() => [
    staticContent.feedbackpage.question1[activeLang.value],
    staticContent.feedbackpage.question2[activeLang.value],
    staticContent.feedbackpage.question3[activeLang.value]
])
const answers = ref(['', '', ''])
const selectedRole = ref('bla')

const submitFeedback = async () => {
    if (!selectedRole.value) {
        alert("Please select your role before submitting.");
        return;
    }

    const feedbackData = {
        role: selectedRole.value,
        answers: answers.value
    };

    console.log("Submitted feedback object:", feedbackData);

    try {
        await router.push({ name: 'FeedbackThankYou' });
        console.log("Navigation successful");
    } catch (err) {
        console.error("Navigation failed:", err);
    }
};

</script>

<template>
    <div class="min-h-screen flex flex-col justify-between bg-gray-100 p-4 text-gray-800">
        <div>
            select role:
        </div>
        <div class="space-y-6">

            <div v-for="(question, index) in localizedQuestions" :key="index" class="space-y-2">
                <label :for="'q' + index" class="block text-lg font-medium">
                    {{ question }}
                </label>
                <textarea :id="'q' + index" v-model="answers[index]"
                    class="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    rows="4" :placeholder="staticContent.placeholders.feedbackAnswer[sessionStore.activeLanguage]" />
            </div>
        </div>

        <div class="mt-8">
            <Button @click="submitFeedback()">
                {{ staticContent.noteCards.save[sessionStore.activeLanguage] }}
            </Button>
        </div>
    </div>
</template>

<style scoped>
/* Optional custom styling for extra control if not using Tailwind */
</style>
