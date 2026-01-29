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
const transcribed = ref(false);
const transcriptMapped = ref(false);

// mode 
type ViewMode = 'form' | 'upload'
const viewMode = ref<ViewMode>('form');

// get access to child components
const formComponent = ref<InstanceType<typeof FeedbackForm> | null>(null);
const audioComponent = ref<InstanceType<typeof FeedbackAudio> | null>(null);
const audioHasFile = computed(() => audioComponent.value?.hasFile ?? false);


// transcription and speaker diarization
const submitOnlyTranscription = async () => {
    loading.value = true;
    let success = false;

    try {
        if (audioComponent.value) {
            success = await audioComponent.value.submitOnlyDiarization();
            transcribed.value = true;
        }
    } catch (error) {
        console.error("Error in submitOnlyTranscription:", error);
        success = false;
    }
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
const submitRoleMapping = async () => {
    loading.value = true;
    let success = false;
    try {
        if (audioComponent.value) {
            success = await audioComponent.value.submitRoleMapping();
        }
    } catch (error) {
        console.error("Error in submitRoleMapping:", error);
        success = false;
    }
    if (!success) loading.value = false;
}

const mapSpeakerToTranscript = async () => {
    loading.value = true;
    let success = false;

    try {
        if (audioComponent.value && transcribed.value) {
            success = await audioComponent.value.mapSpeakerToTranscript();
            transcriptMapped.value = true;
            loading.value = false;
        }
    } catch (error) {
        console.error("Error in mapSpeakerToTranscript:", error);
        success = false;
        transcriptMapped.value = false; // just for safety
    }
    if (!success) loading.value = false;
}

const submitMappedTranscript = async () => {
    loading.value = true;
    let success = false;
    try {
        if (audioComponent.value) {
            success = await audioComponent.value.transformMappedTranscriptToTtl();
            loading.value = false; // finished processing
        }
    } catch (error) {
        console.error("Error in submitRoleMapping:", error);
        success = false;
    }
    if (!success) loading.value = false;
}

const onAudioProcessingComplete = () => {
    loading.value = false;
}
const handleMappingUpdate = () => {
    transcriptMapped.value = true;
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

                <!-- FORM COMPONENT -->
                <FeedbackForm v-if="viewMode === 'form'" ref="formComponent" :graph="props.graph"
                    :active-lang="activeLang" :session-role="sessionStore.sessionRole ?? null"
                    @update:role="sessionStore.sessionRole = $event" />

                <!-- AUDIO UPLOAD COMPONENT -->
                <FeedbackAudio v-if="viewMode === 'upload'" ref="audioComponent" :graph="props.graph"
                    :active-lang="activeLang" :is-mapped="transcriptMapped"
                    @processing-complete="onAudioProcessingComplete" @mapping-complete="handleMappingUpdate" />

            </div>
        </div>

        <div class="mt-8 flex flex-col gap-3">
            <Button v-if="viewMode === 'form'" class="w-full" @click="submitFeedback" :disabled="loading">
                <!-- BUTTON FOR SUBMITTING TEXTUAL FEEDBACK -->
                <span>{{ staticContent.noteCards.save[activeLang] }}</span>
            </Button>

            <!-- BUTTON FOR TRANSCRIPTION AND DIARIZATION WITHOUT ROLE MAPPING -->
            <Button v-if="viewMode === 'upload'" variant="secondary" class="w-full" @click="submitOnlyTranscription"
                :disabled="loading || !audioHasFile">
                {{ loading ? 'Processing...' : 'Transcribe Audio' }}
            </Button>
            <Button v-if="transcribed" @click="submitRoleMapping">
                Submit Role Mapping
            </Button>
            <Button v-if="transcribed" @click="mapSpeakerToTranscript">
                Speaker to Role mapping on transcript
            </Button>
            <Button v-if="transcriptMapped" @click="submitMappedTranscript">
                Submit Mapped Transcript as TTL
            </Button>

        </div>

        <!-- GLOBAL LOADING OVERLAY -->
        <LoadingOverlay :visible="loading"
            :message="loading ? (viewMode === 'upload' ? 'Audio is being processed...' : staticContent.placeholders.loading[activeLang]) : ''" />
    </div>
</template>