/**
 * Type definition for a single segment in the diarized transcription result.
 */
export interface DiarizedSegment {
    speaker: string; // e.g., "SPEAKER_00", "SPEAKER_01", or "Instructor"
    start: number;   // Start time in seconds
    end: number;     // End time in seconds
    text: string;    // Transcribed text for this segment
}

/**
 * Type definition for the successful result from the orchestration
 */
export interface DiarizationSuccessResult {
    status: "success";
    detected_language: string; // e.g., "de", "en", "sv"
    diarized_transcription: DiarizedSegment[]; // The final, assigned transcript
    total_duration_s: number;
    role_mapping?: { speaker_id: string; role: string; confidence: string; reason: string; }[];
}

/**
 * Type definition for an error result from the diarization API or fetch operation.
 */
export interface DiarizationErrorResult {
    success: false;
    message: string;
    status_code?: number;
}

/**
 * Definition des Job-Status-Objekts, das vom Backend kommt.
 * (Exportiert, damit FeedbackAudio.vue es verwenden kann)
 */
export type JobStatus =
    | { status: 'processing'; progress: number; message: string }
    | { status: 'complete'; data: DiarizationSuccessResult }
    | { status: 'error'; message: string };


/**
 * *** FUNKTION 1 (STARTET DEN JOB) ***
 *
 * Lädt eine Audiodatei und eine Rollenliste hoch, um die asynchrone Verarbeitung zu starten.
 * Gibt sofort eine Job-ID zurück.
 * (Exportiert, damit FeedbackAudio.vue es verwenden kann)
 *
 * @param audioFile The audio File object to upload.
 * @param languageCode Optional ISO-639-1 language code.
 * @param roles A flat array of role names (e.g., ['Ausbilder', 'Arzt 01', ...]).
 * @returns Promise, der zu einem Objekt mit der job_id auflöst.
 */
export async function startAudioProcessingJob(
    audioFile: File,
    languageCode: string | null,
    roles: string[]
): Promise<{ job_id: string }> {

    console.log("startAudioProcessingJob: Start upload with:", {
        fileName: audioFile.name,
        languageCode: languageCode,
        roles: roles
    });

    // (URL-Konstruktion bleibt gleich)
    const baseUrl = `${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? '' : ':' + import.meta.env.VITE_LLM_PORT}`;
    const apiUrl = `${baseUrl}/api/process-audio-session`;

    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('language_code', languageCode || '');
    formData.append('roles', JSON.stringify(roles));

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.job_id) {
            // error starting the job 
            throw new Error(data.message || "Error starting the job.");
        }

        // Returns the job ID
        return { job_id: data.job_id };

    } catch (error) {
        console.error("Fetch Error (startAudioProcessingJob):", error);
        if (error instanceof Error) {
            throw error; // Rethrow error so the Vue component can catch it
        }
        throw new Error("Unknown network error while starting the job.");
    }
}


/**
 * *** FUNKTION 2 (FRAGT STATUS AB) ***
 *
 * Fragt den Status eines laufenden Jobs beim Backend ab.
 * (Exportiert, damit FeedbackAudio.vue es verwenden kann)
 *
 * @param jobId Die ID des Jobs, der überprüft werden soll.
 * @returns Promise, das zum JobStatus-Objekt auflöst.
 */
export async function checkJobStatus(
    jobId: string
): Promise<JobStatus> {
    
    const baseUrl = `${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? '' : ':' + import.meta.env.VITE_LLM_PORT}`;
    const apiUrl = `${baseUrl}/api/job-status/${jobId}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Serverfehler beim Abrufen des Status: ${response.status}`);
        }

        return data as JobStatus;

    } catch (error) {
         console.error("Fetch Error (checkJobStatus):", error);
         // Im Falle eines Abruffehlers geben wir einen 'error'-Status zurück
         return {
            status: 'error',
            message: error instanceof Error ? error.message : "Fehler beim Abrufen des Job-Status."
         };
    }
}


/**
 * TODO: is this important?
 * *** FUNCTION 3 (TRANSLATION) ***
 *
 * Sends text to the translation endpoint.

 */
export async function fetchTranslation(
    text: string,
    targetLanguage: string
): Promise<any> { // Typisierung vereinfacht
    
    const baseUrl = `${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? '' : ':' + import.meta.env.VITE_LLM_PORT}`;
    const apiUrl = `${baseUrl}/api/translate-text`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targetLanguage })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Error during translation.");
        }
        return data; // Expected { status: 'success', translatedText: '...' }
    } catch (error) {
         console.error("Fetch Error (fetchTranslation):", error);
         return { status: 'error', message: error instanceof Error ? error.message : "Error." };
    }
}
// transcribe_utils.ts

export async function startDirectDiarization(
    audioFile: File,
    languageCode: string | null
): Promise<DiarizationSuccessResult> {

    // 1. Basis-URL vom Node-Backend
    const baseUrl = `${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? '' : ':' + import.meta.env.VITE_LLM_PORT}`;
    
    // 2. NEU: Wir rufen den neuen Endpunkt in audio.ts auf
    // Beachte: In audio.ts ist der router wahrscheinlich unter '/api' gemountet? 
    // Falls in deiner server.ts steht: app.use('/api', audioRouter); -> dann ist der Pfad '/api/direct-diarization'
    let apiUrl = `${baseUrl}/api/direct-diarization`;

    // Query Params anhängen
    if (languageCode) {
        apiUrl += `?language_code=${encodeURIComponent(languageCode)}`;
    }

    console.log("startDirectDiarization: Sende an Node-Backend:", apiUrl);

    const formData = new FormData();
    formData.append('audio_file', audioFile);
    // language_code ist im Query-String, muss oft nicht nochmal in den Body, 
    // aber deine audio.ts liest es aus req.body.language_code ODER du passt audio.ts an req.query an.
    // Sicherer ist es, es auch in den Body zu packen:
    if (languageCode) formData.append('language_code', languageCode);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || data.message || `Server error: ${response.status}`);
        }

        return data as DiarizationSuccessResult;

    } catch (error) {
        console.error("Fetch Error:", error);
        throw error;
    }
}