<script setup lang="ts">
import { computed, ref } from 'vue'

// *** Korrekten Pfad zur Diarisierungs-Utility sicherstellen ***
import {
    uploadAndDiarizeAudio,
    type DiarizationSuccessResult,
    type DiarizationErrorResult
} from '@/data/knowledge_graph/transcribe_utils';

import { useSessionStore } from '@/stores/sessionStore'

const sessionStore = useSessionStore()

// --- Refs für Datei-Upload ---
const selectedFile = ref<File | null>(null);

// --- Refs für Diarisierungs-Ergebnis ---
const diarizationResult = ref<DiarizationSuccessResult | null>(null);
const diarizationError = ref<DiarizationErrorResult | null>(null);

// --- Refs für Mikrofon-Aufnahme ---
const isRecording = ref(false);
const mediaRecorderInstance = ref<MediaRecorder | null>(null);
const audioChunks = ref<BlobPart[]>([]);

// NEU: Wir benötigen zwei Blobs:
// 1. previewBlob: Das Original-Blob vom Browser (z.B. webm) für die <audio>-Vorschau
const previewBlob = ref<Blob | null>(null);
const previewUrl = ref<string | null>(null); // Für <audio> Player-Vorschau

// 2. wavBlobForUpload: Das konvertierte WAV-Blob, das wir an das Backend senden
const wavBlobForUpload = ref<Blob | null>(null);

const recordingError = ref<string | null>(null);

// --- NEU: AudioContext für die Konvertierung ---
// Wir initialisieren ihn einmal. 'webkitAudioContext' ist für ältere Safari-Versionen.
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();


// Funktion für die Datei-Auswahl
const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        selectedFile.value = target.files[0];
        // Stelle sicher, dass eine Aufnahme gelöscht wird, wenn eine Datei ausgewählt wird
        clearRecording();
        diarizationResult.value = null;
        diarizationError.value = null;
    } else {
        selectedFile.value = null;
    }
};

// --- Aufnahme-Funktionen ---

/**
 * Löscht die aktuelle Aufnahme und setzt die Refs zurück.
 */
const clearRecording = () => {
    previewBlob.value = null;
    previewUrl.value = null;
    wavBlobForUpload.value = null; // Wichtig
    audioChunks.value = [];
    recordingError.value = null;
};

/**
 * Startet die Mikrofon-Aufnahme.
 */
const startRecording = async () => {
    // Setze alle anderen Eingaben und Ergebnisse zurück
    selectedFile.value = null;
    diarizationResult.value = null;
    diarizationError.value = null;
    clearRecording();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        recordingError.value = "Ihr Browser unterstützt keine Audio-Aufnahme.";
        return;
    }

    try {
        // Sicherstellen, dass der AudioContext "aktiviert" wird (wichtig für einige Browser)
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        isRecording.value = true;
        recordingError.value = null;

        console.log("Starte Aufnahme mit Standard-MimeType des Browsers (wird zu WAV konvertiert).");
        let recorder: MediaRecorder = new MediaRecorder(stream);

        mediaRecorderInstance.value = recorder;

        recorder.ondataavailable = (event) => {
            audioChunks.value.push(event.data);
        };

        // Bei Stopp: Blob erstellen UND Konvertierung starten
        recorder.onstop = async () => {
            const mimeType = mediaRecorderInstance.value?.mimeType || 'audio/webm';
            const originalBlob = new Blob(audioChunks.value, { type: mimeType });

            // Speichere das Original-Blob für die <audio>-Vorschau
            previewBlob.value = originalBlob;
            previewUrl.value = URL.createObjectURL(originalBlob);
            audioChunks.value = [];

            // Stream-Tracks stoppen
            stream.getTracks().forEach(track => track.stop());

            // --- HIER PASSIERT DIE KONVERTIERUNG ---
            try {
                console.log("Konvertiere Aufnahme zu WAV...");
                // 1. Lese das Blob als ArrayBuffer
                const arrayBuffer = await originalBlob.arrayBuffer();
                // 2. Dekodiere den ArrayBuffer (webm/ogg/etc.) in rohe PCM-Daten (AudioBuffer)
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                // 3. Enkodiere die rohen PCM-Daten in ein WAV-Blob
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
            // recordingError.value = `Fehler beim Start der Aufnahme: ${err.message}`;
        }
        isRecording.value = false;
    }
};

/**
 * Stoppt die Mikrofon-Aufnahme.
 */
const stopRecording = () => {
    if (mediaRecorderInstance.value && isRecording.value) {
        mediaRecorderInstance.value.stop();
        isRecording.value = false;
        // Der 'onstop'-Handler kümmert sich um den Rest (inkl. Konvertierung)
    }
};


// Berechnet, ob eine Datei *oder* eine Aufnahme zum Absenden bereitsteht
// *** GEÄNDERT: Prüft jetzt auf 'wavBlobForUpload' ***
const hasFile = computed(() => !!selectedFile.value || !!wavBlobForUpload.value);

/**
 * Definiert die 'submit'-Methode, die von der Eltern-Komponente aufgerufen wird.
 */

// Type guard... (bleibt gleich)
const isDiarizationError = (r: DiarizationSuccessResult | DiarizationErrorResult): r is DiarizationErrorResult => {
    if ('status' in r) return (r as any).status !== 'success';
    if ('success' in r) return (r as any).success === false;
    return false;
};

defineExpose({
    hasFile,
    submit: async (): Promise<boolean> => {
        // --- AKTUALISIERT: Prüft auf Datei ODER 'wavBlobForUpload' ---
        if (!selectedFile.value && !wavBlobForUpload.value) {
            alert('Bitte wählen Sie zuerst eine Datei aus oder nehmen Sie Audio auf (und warten Sie auf die Konvertierung).');
            return false;
        }

        diarizationResult.value = null;
        diarizationError.value = null;

        let fileToUpload: File;

        if (selectedFile.value) {
            // Option 1: Eine Datei wurde hochgeladen (ist bereits .wav, .flac, .ogg)
            fileToUpload = selectedFile.value;
            console.log('Starte Aktion mit hochgeladener Datei:', fileToUpload.name);
        } else if (wavBlobForUpload.value) {
            // Option 2: Eine Aufnahme wurde gemacht UND konvertiert

            // *** ÄNDERUNG: Wir senden das konvertierte WAV-Blob ***
            const fileName = `recording.wav`;
            fileToUpload = new File([wavBlobForUpload.value], fileName, { type: 'audio/wav' });
            console.log('Starte Aktion mit konvertierter WAV-Aufnahme:', fileToUpload.name, fileToUpload.type);
        } else {
            return false;
        }

        try {
            // Sprache dynamisch aus dem Store holen
            const result = await uploadAndDiarizeAudio(fileToUpload, sessionStore.activeLanguage);

            console.log('Ergebnis der Aktion:', result); // Log das gesamte Ergebnis

            if (!isDiarizationError(result)) {
                // Erfolgreich - Ergebnis speichern
                diarizationResult.value = result;
                console.log("Diarisierung erfolgreich abgeschlossen.");
                return true; // Erfolg
            } else {
                // Fehler vom Backend wurde zurückgegeben
                diarizationError.value = result;
                console.error("Fehler vom Backend:", result);
                return false; // Fehler
            }
        } catch (error) {
            // Unerwarteter Fehler (Netzwerk etc.) — set a structured error object
            diarizationError.value = {
                success: false,
                message: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.'
            };
            console.error('Unerwarteter Fehler in executeUploadAction:', error);
            return false; // Fehler
        }
    }
});

// --- HILFSFUNKTIONEN FÜR WAV-ENCODING (keine externen Libs nötig) ---
function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44; // * 2 für 16-bit samples
    const dataView = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    // Header schreiben
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

    // PCM-Daten schreiben
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    // Samples verschränken (Interleaving)
    for (let i = 0; i < buffer.length; i++) {
        for (let j = 0; j < numOfChan; j++) {
            let sample = Math.max(-1, Math.min(1, channels[j][i])); // clamp
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF; // convert to 16-bit int
            dataView.setInt16(offset + 44, sample, true); // true = little endian
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
// --- ENDE HILFSFUNKTIONEN ---

</script>

<template>
    <!-- Datei Upload Bereich -->
    <div class="p-6 border rounded-lg bg-white shadow-sm space-y-4 text-center">

        <h2 class="text-xl font-semibold text-gray-900">
            Audio-Datei hochladen
        </h2>
        <p class="text-lg text-gray-600">
            Laden Sie eine <code class="bg-gray-200 px-1 rounded">.wav</code>, <code
                class="bg-gray-200 px-1 rounded">.flac</code>, oder <code class="bg-gray-200 px-1 rounded">.ogg</code>
            Datei hoch.
        </p>

        <input type="file" @change="handleFileChange" accept=".wav,.flac,.ogg" :disabled="isRecording"
            class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" />

        <div v-if="selectedFile" class="mt-2 text-sm text-gray-600">
            Ausgewählt: <strong>{{ selectedFile.name }}</strong> ({{ (selectedFile.size / 1024 /
                1024).toFixed(2) }} MB)
        </div>

        <!-- *** NEU: Trennlinie *** -->
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

        <!-- *** NEU: Aufnahme-Bereich *** -->
        <div class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-900">
                Direktaufnahme
            </h2>
            <p class="text-lg text-gray-600">
                Nehmen Sie Audio direkt über Ihr Mikrofon auf.
            </p>

            <!-- Aufnahme-Buttons -->
            <div>
                <button v-if="!isRecording" @click="startRecording" :disabled="selectedFile != null" type="button"
                    class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
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
                    <span class="relative flex h-3 w-3 mr-2">
                        <span
                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-red-100"></span>
                    </span>
                    Aufnahme stoppen
                </button>
            </div>

            <!-- Aufnahme-Fehleranzeige -->
            <div v-if="recordingError"
                class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-left">
                <p><strong>Fehler bei der Aufnahme:</strong> {{ recordingError }}</p>
            </div>

            <!-- Aufnahme-Vorschau -->
            <!-- *** GEÄNDERT: Verwendet jetzt 'previewUrl' *** -->
            <div v-if="previewUrl" class="mt-4 space-y-2">
                <p class="text-sm text-gray-600">Aufnahme-Vorschau (Originalformat):</p>
                <audio :src="previewUrl" controls class="w-full"></audio>
                <button @click="clearRecording" type="button" class="text-sm text-red-600 hover:text-red-800">
                    Aufnahme löschen
                </button>
            </div>
            <!-- Info-Box, während die Konvertierung läuft -->
            <div v-if="isRecording === false && audioChunks.length === 0 && previewUrl && !wavBlobForUpload && !recordingError"
                class="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg text-left">
                <p><strong>Bitte warten...</strong> Aufnahme wird in WAV konvertiert.</p>
            </div>
        </div>

        <!-- Ergebnis- und Fehleranzeige (für Upload UND Aufnahme) -->
        <div v-if="diarizationError || diarizationResult" class="mt-6 text-left border-t pt-4">
            <div v-if="diarizationError" class="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <h3 class="font-semibold mb-1">Fehler bei der Verarbeitung:</h3>
                <p>{{ diarizationError.message }}</p>
            </div>

            <div v-if="diarizationResult"
                class="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg space-y-2">
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
            </div>
        </div>
    </div>
</template>
