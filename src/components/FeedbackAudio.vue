<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

import {
    // startAudioProcessingJob,
    // checkJobStatus,
    // fetchTranslation,
    startDirectDiarization,
    type DiarizationSuccessResult,
    type DiarizationErrorResult,
    // type JobStatus
} from '@/data/knowledge_graph/transcribe_utils';

import { Mic } from "lucide-vue-next";

import { useSessionStore } from '@/stores/sessionStore'
import { getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { KnowledgeGraphActivityClass } from '@/data/knowledge_graph/structures';
import { buildTreeStructByLang } from '@/data/knowledge_graph/utils';
import { mapRolesToTranscript, transformMappedTrascriptToTtl } from '@/data/knowledge_graph/llm_utils';


interface RoleLabel { de?: string; en?: string; sv?: string; }
interface RoleValue { id: string; labels: RoleLabel; value: string; }
interface RoleNode { level: string; values: RoleValue[]; next: RoleNode[]; }

const props = defineProps<{
    graph: string,
    activeLang: 'de' | 'en' | 'sv',
    isMapped: boolean
}>()

const sessionStore = useSessionStore()

const selectedFile = ref<File | null>(null);
const diarizationResult = ref<DiarizationSuccessResult | null>(null);
const diarizationError = ref<DiarizationErrorResult | null>(null);
const adjustedTranscript = ref<DiarizationSuccessResult | null>(null); // transcript with sorted speaker ids according to first utterance

const mappedTranscript = ref<DiarizationSuccessResult | null>(null);
const mappedSpeakers = ref<Record<string, string> | null>(null); // speaker to role mapping array

const isRecording = ref(false);
const isMapped = ref(false);
const mediaRecorderInstance = ref<MediaRecorder | null>(null);
const audioChunks = ref<BlobPart[]>([]);
const previewBlob = ref<Blob | null>(null);
const previewUrl = ref<string | null>(null);
const wavBlobForUpload = ref<Blob | null>(null);
const recordingError = ref<string | null>(null);
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

// refs for polling job status
const jobId = ref<string | null>(null);
const isPolling = ref(false);
const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null);
const pollingMessage = ref<string>("");

// refs for translation
const translationError = ref<string | null>(null);
const translatedTextDE = ref<string | null>(null);
const translatedTextSV = ref<string | null>(null);

// file and recording handlers
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
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        recordingError.value = "Your browser does not support audio recording.";
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

// WAV-Encoding because of browser compatibility 
function audioBufferToWav(buffer: AudioBuffer): Blob {
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

// FUNCTION TO CORRECT THE SPEAKER ID SO IT IS SORTED FOR SPEAKER_00 TO SPEAKER_XX ACCORDING TO ITS FIRST UTTERANCE
const corectedIdTranscript = (transcript: DiarizationSuccessResult): DiarizationSuccessResult => {
    const speakerMap = new Map<string, string>();
    let speakerCount = 0;

    const sortedIdsTranscript: DiarizationSuccessResult = {
        ...transcript,
        diarized_transcription: transcript.diarized_transcription
            .sort((a, b) => a.start - b.start) // sort by start time
            .map((entry) => {
                if (!speakerMap.has(entry.speaker)) {
                    // Assign a new standardized name (e.g., SPEAKER_00)
                    const newName = `SPEAKER_${speakerCount.toString().padStart(2, "0")}`;
                    speakerMap.set(entry.speaker, newName);
                    speakerCount++;
                }
                return {
                    ...entry,
                    speaker: speakerMap.get(entry.speaker) || entry.speaker
                };
            })
    };

    // console.log("Transcript with corrected speaker IDs:", sortedIdsTranscript);
    return sortedIdsTranscript;
};
// FUNCTION TO EXTRACT FIRST UTTERANCE OF EACH SPEAKER FROM THE TRANSCRIPT
const firstUtterance = (transcript: DiarizationSuccessResult): DiarizationSuccessResult => {
    const firstUttTranscript: DiarizationSuccessResult = {
        ...transcript,
        diarized_transcription: []
    };

    const seenSpeakers = new Set<string>();

    for (const segment of transcript.diarized_transcription) {
        if (!seenSpeakers.has(segment.speaker)) {
            firstUttTranscript.diarized_transcription.push(segment);
            seenSpeakers.add(segment.speaker);
        }
    }

    // console.log("First utterance transcript:", firstUttTranscript);
    return firstUttTranscript;
};

onMounted(async () => {
    await getRoles();
});

onUnmounted(() => {
    if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
    }
});


const emit = defineEmits(['processingComplete', 'mapping-complete']);
const submitOnlyDiarization = async (): Promise<boolean> => {
    if (!selectedFile.value && !wavBlobForUpload.value) {
        alert('Bitte wählen Sie zuerst eine Datei aus oder nehmen Sie Audio auf.');
        return false;
    }

    clearResults();

    let fileToUpload: File;
    if (selectedFile.value) {
        fileToUpload = selectedFile.value;
    } else if (wavBlobForUpload.value) {
        fileToUpload = new File([wavBlobForUpload.value], "recording.wav", { type: 'audio/wav' });
    } else {
        return false;
    }

    try {
        isPolling.value = true;
        pollingMessage.value = "Transcribing & Diarizing (No Role mapping)...";
        const result = await startDirectDiarization(
            fileToUpload,
            sessionStore.activeLanguage
        );

        // success
        diarizationResult.value = result;
        isPolling.value = false;
        emit('processingComplete', true);
        console.log("Transcript:", result.diarized_transcription);
        return true;

    } catch (error) {
        diarizationError.value = {
            success: false,
            message: error instanceof Error ? error.message : 'An unknown error occurred during direct transcription.'
        };
        isPolling.value = false;
        emit('processingComplete', false);
        console.error('Error while DIRECT processing:', error);
        return false;
    }
};
const submitRoleMapping = async (): Promise<boolean> => {
    // CALLS LLM TO CREATE A MAP FOR THE SPEAKERS TO ROLES
    if (!diarizationResult.value) {
        alert('No diarization data available.');
        return false;
    } else {
        isPolling.value = true;
        pollingMessage.value = "Role mapping...";

        const tmpIdCorrectionTranscript = corectedIdTranscript(diarizationResult.value);
        adjustedTranscript.value = tmpIdCorrectionTranscript; // save the transcript with corrected speaker ids in adjustedTranscript for later use
        const firstUttTranscript = firstUtterance(tmpIdCorrectionTranscript);

        try {
            const result = await mapRolesToTranscript(
                firstUttTranscript, // for better llm performance we only send the first utterance of each speaker with corrected speaker ids
            );

            // success
            mappedSpeakers.value = result.data;
            console.log("Role-mapped Transcript:", mappedSpeakers.value);

            isPolling.value = false;
            emit('processingComplete', true);
            return true;
        } catch (error) {
            console.error("Error in role mapping:", error);
            isPolling.value = false;
            emit('processingComplete', false);
            return false;
        }
    }
};
const mapSpeakerToTranscript = async (): Promise<boolean> => {
    // FUNCTION TO MAP THE ROLES TO THE SPEAKER IDS IN THE TRANSCRIP

    // is there something to process?
    if (!diarizationResult.value || !mappedSpeakers.value) {
        alert('No diarization data or role mappings available to create the mapped transcript.');
        return false;
    }

    try {
        console.log("mapSpeakerToTranscript called...");

        // todo check if this works every time
        // DEEP COPY OF TRANSCRIPT
        const transcriptCopy = JSON.parse(JSON.stringify(adjustedTranscript.value)); // uses global adjustedTranscript which has already the speaker id sorted from 00 to XX

        // PREPARE MAPPING DATA
        // before ("{\"speaker_00\": ...}")
        // parse this string first to get the actual mapping object
        let rawMapping: Record<string, string> = {};

        try {
            // Check access to .res (in case the API structure varies)
            const mappingSource = mappedSpeakers.value.res || mappedSpeakers.value;

            if (typeof mappingSource === 'string') {
                rawMapping = JSON.parse(mappingSource);
            } else if (typeof mappingSource === 'object') {
                rawMapping = mappingSource as Record<string, string>;
            }
        } catch (parseError) {
            console.error("Error parsing speaker mapping:", parseError);
        }

        // normalize mapping (prepare case-insensitive lookup)
        const normalizedMapping: Record<string, string> = {};
        if (rawMapping) {
            Object.keys(rawMapping).forEach(key => {
                normalizedMapping[key.toUpperCase()] = rawMapping[key];
            });
        }

        // MAIN FUNCTIONALITY OF FUNCTION: replace speakers and their ids with roles in given transcript
        if (transcriptCopy.diarized_transcription) {
            transcriptCopy.diarized_transcription = transcriptCopy.diarized_transcription.map((segment: any) => {
                const originalSpeaker = segment.speaker;

                // search for the speaker in uppercase
                const searchKey = originalSpeaker ? originalSpeaker.toUpperCase() : "";

                // Find role or keep original
                const newRole = normalizedMapping[searchKey] || originalSpeaker;

                return {
                    ...segment,
                    speaker: newRole // replace speaker id with role
                };
            });
        }

        // save result in "mappedTranscript" to show in frontend or for later ttl transformation
        mappedTranscript.value = transcriptCopy;

        // console.log("After replaceSpeakerRoles:", mappedTranscript);
        isMapped.value = true;
        return true;

    } catch (error) {
        console.error("Critical error in mapSpeakerToTranscript:", error);
        return false;
    }
};
const transformMappedTranscriptToTtl = async (): Promise<boolean> => {
    // LLM FUNCTION CALL TO TRANSFORM AND ADD THE MAPPED TRANSCRIPT TO THE EXISTING TTL-FILE
    if (!isMapped.value) {
        alert('No mapped transcript available to transform to TTL.');
        return false;
    } else {
        isPolling.value = true;
        pollingMessage.value = "Transforming to ttl...";
        try {
            const result = await transformMappedTrascriptToTtl(
                props.graph,
                mappedTranscript.value
            );

            // success
            console.log("Generated ttl:", result);

            isPolling.value = false;
            // emit('processingComplete', true);
            return true;
        } catch (error) {
            console.error("Error in ttl generation:", error);
            isPolling.value = false;
            // emit('processingComplete', false);
            return false;
        }
    }
}

const processAudioToTtl = async (): Promise<boolean> => {
    // Step 1: Diarize
    const step1 = await submitOnlyDiarization();
    if (!step1) return false;

    // Step 2: LLM Role Mapping
    const step2 = await submitRoleMapping();
    if (!step2) return false;

    // Step 3: Map Speakers to Transcript
    const step3 = await mapSpeakerToTranscript();
    if (!step3) return false;

    // Step 4: Convert to TTL
    const step4 = await transformMappedTranscriptToTtl();
    return step4;
};
defineExpose({
    hasFile,
    submitAll: processAudioToTtl,
});
</script>

<template>
    <!-- FILE UPLOAD -->
    <!-- TODO englisch mit festem text in verschiedenen sprachen ersetzen -->
    <div class="p-6 border rounded-lg bg-white shadow-sm space-y-4 text-center">

        <h2 class="text-xl font-semibold text-gray-900">
            Upload audio file
        </h2>
        <!-- todo: other formats !! -->
        <p class="text-lg text-gray-600">
            Upload a <code class="bg-gray-200 px-1 rounded">.wav</code>, <code
                class="bg-gray-200 px-1 rounded">.flac</code>, or <code class="bg-gray-200 px-1 rounded">.ogg</code>
            file.
        </p>
        <input type="file" @change="handleFileChange" accept=".wav,.flac,.ogg" :disabled="isRecording || isPolling"
            class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" />
        <div v-if="selectedFile" class="mt-2 text-sm text-gray-600">
            Selected: <strong>{{ selectedFile.name }}</strong> ({{ (selectedFile.size / 1024 /
                1024).toFixed(2) }} MB)
        </div>
        <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
                <span class="w-full border-t border-gray-300"></span>
            </div>
            <div class="relative flex justify-center text-sm">
                <span class="bg-white px-3 text-gray-500 uppercase tracking-wider">
                    Or
                </span>
            </div>
        </div>
        <div class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-900">
                Record audio directly
            </h2>
            <p class="text-lg text-gray-600">
                Record audio directly through your microphone.
            </p>
            <div>
                <button v-if="!isRecording" @click="startRecording" :disabled="selectedFile != null || isPolling"
                    type="button"
                    class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
                    <Mic class="w-5 h-5 mr-2" />
                    Start Recording
                </button>
                <button v-if="isRecording" @click="stopRecording" type="button"
                    class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    <!-- (SVG) -->
                    <span class="relative flex h-3 w-3 mr-2"><span
                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span><span
                            class="relative inline-flex rounded-full h-3 w-3 bg-red-100"></span></span>
                    Stop Recording
                </button>
            </div>
            <div v-if="recordingError"
                class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-left">
                <p><strong>Recording Error:</strong> {{ recordingError }}</p>
            </div>
            <div v-if="previewUrl" class="mt-4 space-y-2">
                <p class="text-sm text-gray-600">Recording Preview (Original Format):</p>
                <audio :src="previewUrl" controls class="w-full"></audio>
                <button @click="clearRecording" type="button" :disabled="isPolling"
                    class="text-sm text-red-600 hover:text-red-800 disabled:opacity-50">
                    Delete Recording
                </button>
            </div>
            <div v-if="isRecording === false && audioChunks.length === 0 && previewUrl && !wavBlobForUpload && !recordingError && !isPolling"
                class="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg text-left">
                <p><strong>Please wait...</strong> Recording is being converted to WAV.</p>
            </div>
            <!-- polling status bar -->
            <div v-if="isPolling"
                class="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg text-left">
                <p><strong>Processing...</strong> {{ pollingMessage }}</p>
            </div>
        </div>

        <!-- Result and Error Display (for Upload AND Recording) -->
        <div v-if="diarizationError || diarizationResult" class="mt-6 text-left border-t pt-4">
            <div v-if="diarizationError" class="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <h3 class="font-semibold mb-1">Processing Error:</h3>
                <p>{{ diarizationError.message }}</p>
            </div>

            <!-- DISPLAY OF ORIGINAL TRANSCRIPT -->
            <div v-if="diarizationResult"
                class="p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg space-y-3">
                <h3 class="text-lg font-semibold text-gray-900">Result of Diarization & Transcription:
                </h3>
                <p class="text-sm text-gray-700">Detected Language: {{ diarizationResult.detected_language }}
                </p>
                <div
                    class="mt-2 max-h-96 overflow-y-auto bg-white p-3 rounded border border-gray-300 text-sm text-gray-800 shadow-inner">
                    <p v-if="!diarizationResult.diarized_transcription || diarizationResult.diarized_transcription.length === 0"
                        class="text-gray-500 italic">
                        No speaker segments found.
                    </p>
                    <div v-else v-for="(segment, index) in diarizationResult.diarized_transcription" :key="index">
                        <div class="mb-2 pb-2 border-b last:border-b-0">
                            <span class="font-semibold">[{{ segment.start.toFixed(2) }}s - {{
                                segment.end.toFixed(2) }}s] {{ segment.speaker }}:</span>
                            <span class="ml-2">{{ segment.text }}</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
        <!-- todo: temporary show mapped speaker array -->
        <div v-if="mappedSpeakers" class="mt-6 text-left border-t pt-4">
            <div v-if="mappedSpeakers !== null"
                class="p-4 bg-blue-100 border border-blue-400 text-blue-800 rounded-lg space-y-3">
                <h3 class="text-lg font-semibold text-gray-900">Role-Speaker map:
                </h3>
                <div>
                    {{ mappedSpeakers.res }}
                </div>
            </div>

            <!-- temporary show diarized speaker-mapped transcript -->
            <div v-if="mappedTranscript && mappedSpeakers !== null" class="mt-6 text-left border-t pt-4">

                <div class="p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg space-y-3">
                    <h3 class="text-lg font-semibold text-gray-900">Result of mapped Diarization & Transcription:
                    </h3>
                    <p class="text-sm text-gray-700">Detected Language: {{ mappedTranscript.detected_language }}
                    </p>
                    <div
                        class="mt-2 max-h-96 overflow-y-auto bg-white p-3 rounded border border-gray-300 text-sm text-gray-800 shadow-inner">
                        <p v-if="!mappedTranscript.diarized_transcription || mappedTranscript.diarized_transcription.length === 0"
                            class="text-gray-500 italic">
                            No speaker segments found.
                        </p>
                        <div v-else v-for="(segment, index) in mappedTranscript.diarized_transcription" :key="index">
                            <div class="mb-2 pb-2 border-b last:border-b-0">
                                <span class="font-semibold">[{{ segment.start.toFixed(2) }}s - {{
                                    segment.end.toFixed(2) }}s] {{ segment.speaker }}:</span>
                                <span class="ml-2">{{ segment.text }}</span>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    </div>
</template>