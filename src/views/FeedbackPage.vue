<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

// UI components
import { Button } from '@/components/ui/button'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import LanguageSelect from '@/components/LanguageSelect.vue'
import FeedbackForm from '@/components/FeedbackForm.vue'
import FeedbackAudio from '@/components/FeedbackAudio.vue'

// stores and data
import { useSessionStore } from '@/stores/sessionStore'
import { staticContent } from '@/data/contentData'

const props = defineProps<{ graph: string }>()

const router = useRouter()
const sessionStore = useSessionStore()

const activeLang = computed(() => sessionStore.activeLanguage)
const loading = ref(false);

// mode 
type ViewMode = 'form' | 'upload'
const viewMode = ref<ViewMode>('form');

// get access to child components
const formComponent = ref<InstanceType<typeof FeedbackForm> | null>(null);
const audioComponent = ref<InstanceType<typeof FeedbackAudio> | null>(null);
const audioHasFile = computed(() => audioComponent.value?.hasFile ?? false);

const submitOnlyTranscription = async () => {
    loading.value = true;
    let success = false;

    try {
        if (audioComponent.value) {
            // Ruft die NEUE Methode im Child auf
            success = await audioComponent.value.submitOnlyDiarization();
        }
    } catch (error) {
        console.error("Error in submitOnlyTranscription:", error);
        success = false;
    }

    // Loading wird über den emit 'processing-complete' (via onAudioProcessingComplete) im Template ausgeschaltet,
    // oder wir machen es hier sicherheitshalber auch, falls kein Emit kommt:
    if (!success) loading.value = false;
}
const submitFeedback = async () => {
    loading.value = true;
    let success = false;

    try {
        if (viewMode.value === 'form') { // form mode
            if (formComponent.value) {
                success = await formComponent.value.submit();
            }
        } else { // 'upload' mode
            if (audioComponent.value) {
                // calls submit in FeedbackAudio.vue
                success = await audioComponent.value.submit();
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


const onAudioProcessingComplete = (success: boolean) => {
    console.log(`FeedbackPage: audio processing success: ${success}).`);
    loading.value = false;
}

</script>

<template>
    <div class="min-h-screen flex flex-col justify-between bg-gray-100 p-4 text-gray-800">
        <div class="space-y-6">
            <div>
                <LanguageSelect class="absolute top-0 right-0 mt-4 mr-4" />
            </div>
            <div>
                <!-- switch for modes -->
                <div class="flex justify-center space-x-4 border-b pb-4 mb-6">
                    <Button :variant="viewMode === 'form' ? 'default' : 'outline'" @click="viewMode = 'form'">
                        Feedback form
                    </Button>
                    <Button :variant="viewMode === 'upload' ? 'default' : 'outline'" @click="viewMode = 'upload'">
                        Audio file upload
                    </Button>
                </div>

                <!-- Feedback form component -->
                <FeedbackForm v-if="viewMode === 'form'" ref="formComponent" :graph="props.graph"
                    :active-lang="activeLang" :session-role="sessionStore.sessionRole ?? null"
                    @update:role="sessionStore.sessionRole = $event" />

                <!-- Audio upload component -->
                <FeedbackAudio v-if="viewMode === 'upload'" ref="audioComponent" :graph="props.graph"
                    :active-lang="activeLang" @processing-complete="onAudioProcessingComplete" />

            </div>
        </div>

        <!-- global Submit-Button -->
        <!-- <div class="mt-8">
            <Button class="w-full" @click="submitFeedback"
                :disabled="loading || (viewMode === 'upload' && !audioHasFile)">
                <span v-if="viewMode === 'form'">{{ staticContent.noteCards.save[activeLang] }}</span>
                <span v-else>
                    {{ loading ? 'Audio is being processed...' : 'Upload & process audio' }}
                </span>
            </Button>
        </div> -->
        <div class="mt-8 flex flex-col gap-3"> <Button class="w-full" @click="submitFeedback"
                :disabled="loading || (viewMode === 'upload' && !audioHasFile)">
                <span v-if="viewMode === 'form'">{{ staticContent.noteCards.save[activeLang] }}</span>
                <span v-else>
                    {{ loading ? 'Audio is being processed...' : 'Upload & process audio (Full)' }}
                </span>
            </Button>

            <Button v-if="viewMode === 'upload'" variant="secondary" class="w-full" @click="submitOnlyTranscription"
                :disabled="loading || !audioHasFile">
                {{ loading ? 'Processing...' : 'Transcribe only (Raw)' }}
            </Button>
        </div>

        <!-- Global loading overlay -->
        <LoadingOverlay :visible="loading"
            :message="loading ? (viewMode === 'upload' ? 'Audio is being processed...' : staticContent.placeholders.loading[activeLang]) : ''" />
    </div>
</template>