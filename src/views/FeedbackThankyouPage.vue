<script setup lang="ts">
import { computed } from 'vue'
import { staticContent } from '@/data/contentData'
import { useSessionStore } from '@/stores/sessionStore'

const sessionStore = useSessionStore()

const thankYouText = computed(() =>
    staticContent.feedbackpage.thankYou[sessionStore.activeLanguage] || "Thanks for your feedback!"
)
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-white text-center px-4">
        <div class="space-y-6 max-w-md w-full">
            <!-- Optional checkmark icon -->
            <div class="flex justify-center">
                <svg class="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <!-- Localized thank you message -->
            <h1 class="text-2xl font-bold text-gray-800">
                {{ thankYouText }}
            </h1>

            <!-- Optional subtext -->
            <p class="text-gray-500 text-base">
                {{ staticContent.feedbackpage.thankYouSubtext[sessionStore.activeLanguage] }}
            </p>
        </div>
    </div>
</template>

<style scoped>
/* Optionally add animation or fade-in */
</style>
