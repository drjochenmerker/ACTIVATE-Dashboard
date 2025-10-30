<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

// UI components
import { Button } from '@/components/ui/button'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import LanguageSelect from '@/components/LanguageSelect.vue'

import FeedbackForm from '@/components/FeedbackForm.vue'
import FeedbackAudio from '@/components/FeedbackAudio.vue'

import { useSessionStore } from '@/stores/sessionStore'
import { staticContent } from '@/data/contentData'

const props = defineProps<{ graph: string }>()

const router = useRouter()
const sessionStore = useSessionStore()

const activeLang = computed(() => sessionStore.activeLanguage)
const loading = ref(false);

// Statusvariable für die Ansicht (default auf 'form')
type ViewMode = 'form' | 'upload'
const viewMode = ref<ViewMode>('form');

// Refs, um auf die Methoden der Kind-Komponenten zuzugreifen
const formComponent = ref<InstanceType<typeof FeedbackForm> | null>(null);
const audioComponent = ref<InstanceType<typeof FeedbackAudio> | null>(null);

// Überprüft, ob im Audio-Modus eine Datei ausgewählt ist
const audioHasFile = computed(() => audioComponent.value?.hasFile ?? false);

// Angepasst: Ruft die 'submit'-Methode der aktiven Kind-Komponente auf
const submitFeedback = async () => {
    loading.value = true;
    let success = false;

    try {
        if (viewMode.value === 'form') {
            if (formComponent.value) {
                // Ruft die 'submit'-Methode der FeedbackForm-Komponente auf
                success = await formComponent.value.submit();
            }
        } else { // 'upload'
            if (audioComponent.value) {
                // Ruft die 'submit'-Methode der FeedbackAudio-Komponente auf
                success = await audioComponent.value.submit();
            }
        }
    } catch (error) {
        console.error("Ungefangener Fehler in submitFeedback (Parent):", error);
        success = false;
    } finally {
        loading.value = false;
    }

    // Navigation zur "Danke"-Seite nur bei erfolgreicher Formular-Übermittlung
    if (success && viewMode.value === 'form') {
        try {
            await router.push('/feedback-thank-you')
        } catch (err) {
            console.error('Navigation failed:', err)
        }
    }
    // Bei Audio-Upload bleiben wir auf der Seite, um das Ergebnis anzuzeigen
}
</script>

<template>
    <div class="min-h-screen flex flex-col justify-between bg-gray-100 p-4 text-gray-800">
        <div class="space-y-6">
            <div>
                <LanguageSelect class="absolute top-0 right-0 mt-4 mr-4" />
            </div>
            <div>
                <!-- Umschalter für die Ansicht -->
                <div class="flex justify-center space-x-4 border-b pb-4 mb-6">
                    <Button :variant="viewMode === 'form' ? 'default' : 'outline'" @click="viewMode = 'form'">
                        Feedback-Formular
                    </Button>
                    <Button :variant="viewMode === 'upload' ? 'default' : 'outline'" @click="viewMode = 'upload'">
                        Audio-Datei-Upload
                    </Button>
                </div>

                <!-- Feedback Formular Komponente -->
                <FeedbackForm v-if="viewMode === 'form'" ref="formComponent" :graph="props.graph"
                    :session-role="sessionStore.sessionRole ?? null" @update:role="sessionStore.sessionRole = $event" />

                <!-- Audio Upload Komponente -->
                <FeedbackAudio v-if="viewMode === 'upload'" ref="audioComponent" />

            </div>
        </div>

        <!-- Globaler Submit-Button -->
        <div class="mt-8">
            <Button class="w-full" @click="submitFeedback"
                :disabled="loading || (viewMode === 'upload' && !audioHasFile)">
                <span v-if="viewMode === 'form'">{{ staticContent.noteCards.save[activeLang] }}</span>
                <span v-else>
                    {{ loading ? 'Verarbeite Audio...' : 'Audio hochladen & verarbeiten' }}
                </span>
            </Button>
        </div>
        <LoadingOverlay :visible="loading"
            :message="loading ? (viewMode === 'upload' ? 'Audio wird verarbeitet...' : staticContent.placeholders.loading[activeLang]) : ''" />
    </div>
</template>
