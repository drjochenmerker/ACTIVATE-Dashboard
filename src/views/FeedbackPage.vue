<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { ButtonComponent } from '@/components/ui/button'

import LoadingOverlay from '@/components/LoadingOverlay.vue'
import LanguageSelect from '@/components/LanguageSelect.vue'
import FeedbackForm from '@/components/FeedbackForm.vue'
import FeedbackAudio from '@/components/FeedbackAudio.vue'

import { useSessionStore } from '@/stores/sessionStore'
import { staticContent } from '@/data/contentData'
import { buildTreeStructByLang } from '@/data/knowledge_graph/utils';
import { getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { KnowledgeGraphActivityClass } from '@/data/knowledge_graph/structures';

// import { staticContentFeedback } from '@/data/feedbackQuestions';

import LogoutButton from '@/components/LogoutButton.vue';
import OptionsButton from '@/components/OptionsButton.vue';
import ThemeSwitchButton from '@/components/ThemeSwitchButton.vue';
import HomeButton from '@/components/HomeButton.vue';
import { useColorMode } from '@vueuse/core';

useColorMode();

const props = defineProps<{ graph: string }>()

const router = useRouter()
const sessionStore = useSessionStore()

const activeLang = computed(() => sessionStore.activeLanguage)
const loading = ref(false);
// const transcribed = ref(false);
const transcriptMapped = ref(false);
// mode 
type ViewMode = 'form' | 'upload'
const viewMode = ref<ViewMode>('form');
// get access to child components
const formComponent = ref<InstanceType<typeof FeedbackForm> | null>(null);
const audioComponent = ref<InstanceType<typeof FeedbackAudio> | null>(null);
const audioHasFile = computed(() => audioComponent.value?.hasFile ?? false);



onMounted(async () => {
    await getRoles();
});
// --- UNIFIED SUBMIT HANDLER ---
const handleUnifiedSubmit = async () => {
    loading.value = true;
    let success = false;

    try {
        if (viewMode.value === 'form') {
            // Handle Text Form
            if (formComponent.value) {
                success = await formComponent.value.submit();
            }
        } else {
            // Handle Audio Upload (One-Click)
            if (audioComponent.value) {
                // Calls the chained function in the child
                success = await audioComponent.value.submitAll();
            }
        }

        // If successful, navigate to thank you page
        if (success) {
            console.log('Submission successful, navigating to thank you page...');
            // todo 
            // await router.push('/feedback-thank-you');
        }

    } catch (error) {
        console.error("Error during submission:", error);
    } finally {
        loading.value = false;
    }
}
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
    loading.value = true;
    let success = false;

    try {
        if (viewMode.value === 'form') { // form mode
            if (formComponent.value) {
                success = await formComponent.value.submit();
            }
        }
    } catch (error) {
        console.error("uncatched error in submitFeedback (Parent):", error);
        success = false;
    }

    if (viewMode.value === 'form') {
        loading.value = false;
    }

    if (success && viewMode.value === 'form') {
        try {
            await router.push('/feedback-thank-you')
        } catch (err) {
            console.error('Navigation failed:', err)
        }
    }
}
const onAudioProcessingComplete = () => {
    loading.value = false;
}
const handleMappingUpdate = () => {
    transcriptMapped.value = true;
}
</script>

<template>

    <div class="min-h-screen flex flex-col lg:w-[1024px] lg:mx-auto justify-between p-4">

        <div class="space-y-6">
            <div class="flex justify-end space-x-4">
                <LanguageSelect />
                <template v-if="sessionStore.instructorMode">
                    <OptionsButton />
                </template>
                <HomeButton />
                <LogoutButton />
                <ThemeSwitchButton />
            </div>

            <div>
                <!-- switch for modes -->
                <div class="flex justify-center space-x-4 border-b pb-4 mb-6">
                    <ButtonComponent :variant="viewMode === 'form' ? 'default' : 'outline'" @click="viewMode = 'form'">
                        Feedback form
                    </ButtonComponent>
                    <ButtonComponent v-if="sessionStore.instructorMode"
                        :variant="viewMode === 'upload' ? 'default' : 'outline'" @click="viewMode = 'upload'">
                        Audio file upload
                    </ButtonComponent>
                </div>

                <!-- FORM COMPONENT -->
                <FeedbackForm v-if="viewMode === 'form'" ref="formComponent" :graph="props.graph"
                    :active-lang="activeLang" :session-role="sessionStore.sessionRole ?? null"
                    @update:role="sessionStore.sessionRole = $event" />

                <!-- AUDIO UPLOAD COMPONENT -->
                <FeedbackAudio v-if="viewMode === 'upload' && sessionStore.instructorMode" ref="audioComponent"
                    :graph="props.graph" :active-lang="activeLang" :is-mapped="transcriptMapped"
                    @processing-complete="onAudioProcessingComplete" @mapping-complete="handleMappingUpdate" />

            </div>
        </div>
        <div class="mt-8">
            <ButtonComponent v-if="viewMode === 'form'"
                class="w-full text-black bg-white border border-black hover:bg-black hover:text-white disabled:hover:bg-white disabled:hover:text-black"
                @click="submitFeedback">
                {{ staticContent.noteCards.save[activeLang] }}
            </ButtonComponent>
            <ButtonComponent v-if="viewMode === 'upload' && sessionStore.instructorMode" class="w-full"
                @click="handleUnifiedSubmit" :disabled="loading || !audioHasFile">
                <!-- ONE-CLICK BUTTON FOR AUDIO PROCESSING -->
                <span>{{ loading ? 'Processing...' : 'Submit Audio Feedback' }}</span>
            </ButtonComponent>
        </div>
        <LoadingOverlay :visible="loading" :message="staticContent.placeholders.loading[activeLang]" />
    </div>
</template>