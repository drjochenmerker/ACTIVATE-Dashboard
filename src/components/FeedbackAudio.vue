<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

import {
    startAudioProcessingJob, // Umbenannt
    checkJobStatus,        // NEU
    fetchTranslation,
    type DiarizationSuccessResult,
    type DiarizationErrorResult,
    type JobStatus // NEU
} from '@/data/knowledge_graph/transcribe_utils';

import { useSessionStore } from '@/stores/sessionStore'
import { getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { KnowledgeGraphActivityClass } from '@/data/knowledge_graph/structures';
import { buildTreeStructByLang } from '@/data/knowledge_graph/utils';

// (Typ-Definitionen für RoleNode etc. bleiben gleich)
interface RoleLabel { de?: string; en?: string; sv?: string; }
interface RoleValue { id: string; labels: RoleLabel; value: string; }
interface RoleNode { level: string; values: RoleValue[]; next: RoleNode[]; }

// *** HIER IST DER FIX: Fehlende Props hinzugefügt ***
const props = defineProps<{
    graph: string,
    activeLang: 'de' | 'en' | 'sv'
}>()

const sessionStore = useSessionStore()

// --- Refs (bleiben gleich) ---
const selectedFile = ref<File | null>(null);
const diarizationResult = ref<DiarizationSuccessResult | null>(null);
const diarizationError = ref<DiarizationErrorResult | null>(null);
const isRecording = ref(false);
const mediaRecorderInstance = ref<MediaRecorder | null>(null);
const audioChunks = ref<BlobPart[]>([]);
const previewBlob = ref<Blob | null>(null);
const previewUrl = ref<string | null>(null);
const wavBlobForUpload = ref<Blob | null>(null);
const recordingError = ref<string | null>(null);
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

// --- NEU: Refs für Job-Polling ---
const jobId = ref<string | null>(null);
const isPolling = ref(false);
const pollingInterval = ref<NodeJS.Timeout | null>(null);
const pollingMessage = ref<string>("");

// --- Refs für Übersetzung (bleiben gleich) ---
const isTranslating = ref(false);
const translationError = ref<string | null>(null);
const translatedTextDE = ref<string | null>(null);
const translatedTextSV = ref<string | null>(null);

// --- Datei- & Aufnahme-Funktionen (bleiben unverändert) ---
// (handleFileChange, clearRecording, startRecording, stopRecording, audioBufferToWav)
const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        selectedFile.value = target.files[0];
        clearRecording();
        clearResults();
    } else {
        selectedFile.value = null;
    }
};
const clearRecording = () => {
    previewBlob.value = null;
    previewUrl.value = null;
    wavBlobForUpload.value = null;
    audioChunks.value = [];
    recordingError.value = null;
};
const clearResults = () => {
    diarizationResult.value = null;
    diarizationError.value = null;
    translatedTextDE.value = null;
    translatedTextSV.value = null;
    translationError.value = null;
    jobId.value = null;
    isPolling.value = false;
    pollingMessage.value = "";
    if (pollingInterval.value) clearInterval(pollingInterval.value);
}
const startRecording = async () => {
    selectedFile.value = null;
    clearResults();
    clearRecording();
    // ... (Rest der startRecording-Funktion) ...
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        recordingError.value = "Ihr Browser unterstützt keine Audio-Aufnahme.";
        return;
    }
    try {
        if (audioContext.state === 'suspended') await audioContext.resume();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        isRecording.value = true;
        recordingError.value = null;
        let recorder: MediaRecorder = new MediaRecorder(stream);
        mediaRecorderInstance.value = recorder;
        recorder.ondataavailable = (event) => audioChunks.value.push(event.data);
        recorder.onstop = async () => {
            const mimeType = mediaRecorderInstance.value?.mimeType || 'audio/webm';
            const originalBlob = new Blob(audioChunks.value, { type: mimeType });
            previewBlob.value = originalBlob;
            previewUrl.value = URL.createObjectURL(originalBlob);
            audioChunks.value = [];
            stream.getTracks().forEach(track => track.stop());
            try {
                console.log("Konvertiere Aufnahme zu WAV...");
                const arrayBuffer = await originalBlob.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                wavBlobForUpload.value = audioBufferToWav(audioBuffer);
                console.log("Konvertierung zu WAV erfolgreich.");
            } catch (convertError) {
                console.error("Fehler bei der Audio-Konvertierung:", convertError);
                recordingError.value = "Fehler bei der Konvertierung der Aufnahme in das WAV-Format.";
            }
        };
        recorder.start();
    } catch (err) {
        console.error("Fehler beim Zugriff auf das Mikrofon:", err);
        if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
            recordingError.value = "Mikrofon-Zugriff verweigert. Bitte Berechtigung in den Browser-Einstellungen erteilen.";
        } else {
            recordingError.value = `Fehler beim Start der Aufnahme: ${err}`;
        }
        isRecording.value = false;
    }
};
const stopRecording = () => {
    if (mediaRecorderInstance.value && isRecording.value) {
        mediaRecorderInstance.value.stop();
        isRecording.value = false;
    }
};
// --- Ende Aufnahme-Funktionen ---


// (hasFile, flattenRoles, getRoles bleiben gleich)
const hasFile = computed(() => !!selectedFile.value || !!wavBlobForUpload.value);
function flattenRoles(node: RoleNode | null, lang: 'de' | 'en' | 'sv'): string[] {
    if (!node) return [];
    let roles: string[] = [];
    if (node.values) {
        for (const val of node.values) {
            const label = val.labels[lang] || val.labels['de'];
            if (label) roles.push(label);
        }
    }
    if (node.next) {
        for (const nextNode of node.next) {
            roles = roles.concat(flattenRoles(nextNode, lang));
        }
    }
    return [...new Set(roles.filter(Boolean))];
}
const getRoles = async (): Promise<string[]> => {
    const rolesData = await getActivityClassIds(props.graph, KnowledgeGraphActivityClass.subject);
    sessionStore.availableRoles = buildTreeStructByLang(
        rolesData,
        sessionStore.activeLanguage
    );
    return flattenRoles(sessionStore.availableRoles as RoleNode, sessionStore.activeLanguage);
};
onMounted(async () => {
    await getRoles();
});

// Stellt sicher, dass das Polling gestoppt wird, wenn die Komponente verlassen wird
onUnmounted(() => {
    if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
    }
});

// --- NEU: Polling-Funktion ---
const pollJobStatus = async () => {
    if (!jobId.value) return;

    console.log(`Polling-Status für Job: ${jobId.value}...`);
    try {
        const result: JobStatus = await checkJobStatus(jobId.value);

        if (result.status === 'processing') {
            pollingMessage.value = `Verarbeite... ${result.message} (${result.progress}%)`;
        }
        else if (result.status === 'complete') {
            console.log("Job abgeschlossen!", result.data);
            if (pollingInterval.value) clearInterval(pollingInterval.value);
            isPolling.value = false;
            diarizationResult.value = result.data; // Das finale Ergebnis

            // WICHTIG: Die Parent-Komponente (FeedbackPage) muss 'loading' auf false setzen
            // Wir emittieren ein Event
            emit('processingComplete', true);
        }
        else if (result.status === 'error') {
            console.error("Job fehlgeschlagen:", result.message);
            if (pollingInterval.value) clearInterval(pollingInterval.value);
            isPolling.value = false;
            diarizationError.value = { success: false, message: result.message };
            emit('processingComplete', false); // Fehler
        }

    } catch (error) {
        console.error("Fehler beim Pollen:", error);
        isPolling.value = false;
        if (pollingInterval.value) clearInterval(pollingInterval.value);
        diarizationError.value = { success: false, message: "Fehler beim Abrufen des Job-Status." };
        emit('processingComplete', false); // Fehler
    }
};

// --- 'submit'-Methode (STARK GEÄNDERT) ---
const emit = defineEmits(['processingComplete']);

defineExpose({
    hasFile,
    submit: async (): Promise<boolean> => { // Gibt jetzt nur noch 'true' zurück, wenn der Job GESTARTET wurde
        if (!selectedFile.value && !wavBlobForUpload.value) {
            alert('Bitte wählen Sie zuerst eine Datei aus oder nehmen Sie Audio auf (und warten Sie auf die Konvertierung).');
            return false;
        }

        clearResults(); // Alle alten Ergebnisse löschen

        let fileToUpload: File;
        if (selectedFile.value) {
            fileToUpload = selectedFile.value;
        } else if (wavBlobForUpload.value) {
            fileToUpload = new File([wavBlobForUpload.value], "recording.wav", { type: 'audio/wav' });
        } else {
            return false;
        }

        // *** FIX: Greift jetzt auf props.activeLang zu ***
        const rolesForSession = flattenRoles(sessionStore.availableRoles as RoleNode, props.activeLang);
        if (!rolesForSession.includes("Schauspieler")) rolesForSession.push("Schauspieler");
        if (!rolesForSession.includes("Lehrperson")) rolesForSession.push("Lehrperson");

        console.log("Sende folgende Rollenliste an das Backend:", rolesForSession);

        try {
            // *** GEÄNDERT: Startet nur den Job ***
            const { job_id } = await startAudioProcessingJob(
                fileToUpload,
                sessionStore.activeLanguage,
                rolesForSession
            );

            jobId.value = job_id;
            isPolling.value = true;
            pollingMessage.value = "Job gestartet, warte auf ersten Status...";

            // Starte das Polling alle 5 Sekunden
            pollingInterval.value = setInterval(pollJobStatus, 5000);

            // Führe den ersten Poll sofort aus
            await pollJobStatus();

            return true; // Job wurde erfolgreich gestartet

        } catch (error) {
            diarizationError.value = {
                success: false,
                message: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.'
            };
            console.error('Fehler beim STARTEN des Jobs:', error);
            return false; // Job konnte nicht gestartet werden
        }
    }
});

// --- Übersetzungsfunktion (bleibt gleich) ---
const translateFullTranscription = async (targetLang: 'de' | 'sv') => {
    // ... (Code bleibt unverändert) ...
    if (!diarizationResult.value) return;
    const fullText = diarizationResult.value.diarized_transcription
        .map(seg => `${seg.speaker}: ${seg.text}`)
        .join("\n");
    if (fullText.trim().length === 0) {
        translationError.value = "Es gibt keinen Text zum Übersetzen.";
        return;
    }
    isTranslating.value = true;
    translationError.value = null;
    try {
        const result = await fetchTranslation(fullText, targetLang);
        if (result.status === 'success') {
            if (targetLang === 'de') translatedTextDE.value = result.translatedText;
            else if (targetLang === 'sv') translatedTextSV.value = result.translatedText;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error(`Fehler bei der Übersetzung nach ${targetLang}:`, error);
        translationError.value = error instanceof Error ? error.message : "Unbekannter Übersetzungsfehler.";
    } finally {
        isTranslating.value = false;
    }
};

// --- WAV-Encoding (bleibt gleich) ---
function audioBufferToWav(buffer: AudioBuffer): Blob {
    // ... (Code bleibt unverändert) ...
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const dataView = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // format chunk size
    setUint16(1); // 1 = PCM
    setUint16(numOfChan); // Channel count
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // 16-bit
    setUint32(0x61746164); // "data" chunk
    setUint32(length - 44); // data chunk size
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }
    for (let i = 0; i < buffer.length; i++) {
        for (let j = 0; j < numOfChan; j++) {
            let sample = Math.max(-1, Math.min(1, channels[j][i]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            dataView.setInt16(offset + 44, sample, true);
            offset += 2;
        }
    }
    return new Blob([dataView], { type: 'audio/wav' });
    function setUint16(data: number) {
        dataView.setUint16(pos, data, true);
        pos += 2;
    }
    function setUint32(data: number) {
        dataView.setUint32(pos, data, true);
        pos += 4;
    }
}
</script>

<template>
    <!-- Datei Upload Bereich -->
    <div class="p-6 border rounded-lg bg-white shadow-sm space-y-4 text-center">

        <!-- (Input und Aufnahme-UI bleibt gleich) -->
        <h2 class="text-xl font-semibold text-gray-900">
            Audio-Datei hochladen
        </h2>
        <p class="text-lg text-gray-600">
            Laden Sie eine <code class="bg-gray-200 px-1 rounded">.wav</code>, <code
                class="bg-gray-200 px-1 rounded">.flac</code>, oder <code class="bg-gray-200 px-1 rounded">.ogg</code>
            Datei hoch.
        </p>
        <input type="file" @change="handleFileChange" accept=".wav,.flac,.ogg" :disabled="isRecording || isPolling"
            class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" />
        <div v-if="selectedFile" class="mt-2 text-sm text-gray-600">
            Ausgewählt: <strong>{{ selectedFile.name }}</strong> ({{ (selectedFile.size / 1024 /
                1024).toFixed(2) }} MB)
        </div>
        <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
                <span class="w-full border-t border-gray-300"></span>
            </div>
            <div class="relative flex justify-center text-sm">
                <span class="bg-white px-3 text-gray-500 uppercase tracking-wider">
                    Oder
                </span>
            </div>
        </div>
        <div class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-900">
                Direktaufnahme
            </h2>
            <p class="text-lg text-gray-600">
                Nehmen Sie Audio direkt über Ihr Mikrofon auf.
            </p>
            <div>
                <button v-if="!isRecording" @click="startRecording" :disabled="selectedFile != null || isPolling"
                    type="button"
                    class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
                    <!-- (SVG) -->
                    <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                        fill="currentColor">
                        <path fill-rule="evenodd"
                            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm-1 3a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1zm1 10a3 3 0 003-3V9a3 3 0 10-6 0v5a3 3 0 003 3zm-1 0a1 1 0 001 1h.01a1 1 0 100-2H9a1 1 0 00-1 1z"
                            clip-rule="evenodd" />
                        <path
                            d="M10 18a5 5 0 005-5V9a5 5 0 10-10 0v4a5 5 0 005 5zM4 9a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" />
                    </svg>
                    Aufnahme starten
                </button>
                <button v-if="isRecording" @click="stopRecording" type="button"
                    class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    <!-- (SVG) -->
                    <span class="relative flex h-3 w-3 mr-2"><span
                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span><span
                            class="relative inline-flex rounded-full h-3 w-3 bg-red-100"></span></span>
                    Aufnahme stoppen
                </button>
            </div>
            <div v-if="recordingError"
                class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-left">
                <p><strong>Fehler bei der Aufnahme:</strong> {{ recordingError }}</p>
            </div>
            <div v-if="previewUrl" class="mt-4 space-y-2">
                <p class="text-sm text-gray-600">Aufnahme-Vorschau (Originalformat):</p>
                <audio :src="previewUrl" controls class="w-full"></audio>
                <button @click="clearRecording" type="button" :disabled="isPolling"
                    class="text-sm text-red-600 hover:text-red-800 disabled:opacity-50">
                    Aufnahme löschen
                </button>
            </div>
            <div v-if="isRecording === false && audioChunks.length === 0 && previewUrl && !wavBlobForUpload && !recordingError && !isPolling"
                class="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg text-left">
                <p><strong>Bitte warten...</strong> Aufnahme wird in WAV konvertiert.</p>
            </div>
            <!-- *** NEU: Polling-Statusanzeige *** -->
            <div v-if="isPolling"
                class="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg text-left">
                <p><strong>Verarbeitung läuft...</strong> {{ pollingMessage }}</p>
                <!-- Optional: Ladebalken -->
                <!-- <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: pollingProgress + '%' }"></div>
                </div> -->
            </div>
        </div>

        <!-- Ergebnis- und Fehleranzeige (für Upload UND Aufnahme) -->
        <div v-if="diarizationError || diarizationResult" class="mt-6 text-left border-t pt-4">
            <div v-if="diarizationError" class="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <h3 class="font-semibold mb-1">Fehler bei der Verarbeitung:</h3>
                <p>{{ diarizationError.message }}</p>
            </div>

            <!-- ANZEIGE DES ORIGINAL-TRANSKRIPTS -->
            <div v-if="diarizationResult"
                class="p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg space-y-3">
                <h3 class="text-lg font-semibold text-gray-900">Ergebnis der Diarisierung & Transkription:
                </h3>
                <p class="text-sm text-gray-700">Erkannte Sprache: {{ diarizationResult.detected_language }}
                </p>
                <div
                    class="mt-2 max-h-96 overflow-y-auto bg-white p-3 rounded border border-gray-300 text-sm text-gray-800 shadow-inner">
                    <p v-if="!diarizationResult.diarized_transcription || diarizationResult.diarized_transcription.length === 0"
                        class="text-gray-500 italic">
                        Keine Sprechersegmente gefunden.
                    </p>
                    <div v-else v-for="(segment, index) in diarizationResult.diarized_transcription" :key="index"
                        class="mb-2 pb-2 border-b last:border-b-0">
                        <span class="font-semibold">[{{ segment.start.toFixed(2) }}s - {{
                            segment.end.toFixed(2) }}s] {{ segment.speaker }}:</span>
                        <span class="ml-2">{{ segment.text }}</span>
                    </div>
                </div>

                <!-- (Übersetzungs-UI bleibt gleich) -->
                <div class="border-t border-green-300 pt-3 space-y-2">
                    <h4 class="text-md font-semibold text-gray-800">Übersetzungen (via Gemini):</h4>
                    <div class="flex gap-2">
                        <button @click="translateFullTranscription('de')" :disabled="isTranslating"
                            class="px-3 py-1 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                            {{ isTranslating && !translatedTextDE ? 'Übersetze...' : 'Nach Deutsch' }}
                        </button>
                        <button @click="translateFullTranscription('sv')" :disabled="isTranslating"
                            class="px-3 py-1 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                            {{ isTranslating && !translatedTextSV ? 'Übersetze...' : 'Nach Schwedisch' }}
                        </button>
                    </div>
                    <div v-if="translationError"
                        class="mt-2 p-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg">
                        <strong>Übersetzungsfehler:</strong> {{ translationError }}
                    </div>
                    <div v-if="translatedTextDE"
                        class="mt-2 bg-white p-3 rounded border border-gray-300 text-sm text-gray-800 shadow-inner">
                        <h5 class="font-semibold mb-1 text-gray-600">Übersetzung (Deutsch):</h5>
                        <p class="whitespace-pre-wrap">{{ translatedTextDE }}</p>
                    </div>
                    <div v-if="translatedTextSV"
                        class="mt-2 bg-white p-3 rounded border border-gray-300 text-sm text-gray-800 shadow-inner">
                        <h5 class="font-semibold mb-1 text-gray-600">Übersetzung (Schwedisch):</h5>
                        <p class="whitespace-pre-wrap">{{ translatedTextSV }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>