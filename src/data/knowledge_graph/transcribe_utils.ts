// Types: Added DiarizedSegment, DiarizationSuccessResult, and DiarizationErrorResult to define the expected data structures based on your Python backend's response.
// uploadAndDiarizeAudio Function:
// Takes the File object and optional languageCode.
// URL Construction: Builds the URL pointing to your Node.js proxy (feedback-parser on port 8005) including the proxy path (/api/diarize) and the actual API endpoint (/api/diarize_and_transcribe).
// FormData: Creates FormData to send the file correctly.
// Fetch: Makes the POST request using fetch. Note the comment about not setting the Content-Type header manually.
// Error Handling: Checks response.ok, parses potential error messages from the backend (data.detail is common for FastAPI), and handles network errors (catch).
// Success Handling: Returns the parsed JSON data if the request was successful and matches the expected structure.

/**
 * Type definition for a single segment in the diarized transcription result.
 */
export interface DiarizedSegment {
    speaker: string; // e.g., "SPEAKER_00", "SPEAKER_01", "UNKNOWN"
    start: number;   // Start time in seconds
    end: number;     // End time in seconds
    text: string;    // Transcribed text for this segment
}

/**
 * Type definition for the successful result from the diarization API.
 */
export interface DiarizationSuccessResult {
    status: "success";
    detected_language: string; // e.g., "de", "en"
    diarized_transcription: DiarizedSegment[];
    total_duration_s: number;
    processing_times_s: {
        load_audio: number;
        diarization: number;
        transcription: number;
        alignment: number;
        total: number;
    };
}

/**
 * Type definition for an error result from the diarization API or fetch operation.
 */
export interface DiarizationErrorResult {
    success: false; // Added for consistency with LLMParsingResult structure
    message: string; // Error message from backend or fetch error
    status_code?: number; // Optional HTTP status code
}

/**
 * *** AKTUALISIERTE FUNKTION (ersetzt uploadAndDiarizeAudio) ***
 *
 * Lädt eine Audiodatei UND eine Liste von Session-Rollen an das Node.js-Backend
 * zur vollständigen Verarbeitung (Diarisierung -> Transkription -> KI-Rollen-Mapping).
 *
 * @param audioFile The audio File object to upload.
 * @param languageCode Optional ISO-639-1 language code.
 * @param roles Ein flaches Array von Rollennamen (z.B. ['Ausbilder', 'Arzt 01', ...]).
 * @returns Promise resolving to DiarizationSuccessResult or DiarizationErrorResult
 */
export async function processAudioSession(
    audioFile: File,
    languageCode: string | null,
    roles: string[] // Nimmt jetzt das korrekte string[] entgegen
): Promise<DiarizationSuccessResult | DiarizationErrorResult> {

    console.log("processAudioSession: Starte Upload mit:", {
        fileName: audioFile.name,
        languageCode: languageCode,
        roles: roles
    });

    // --- 1. Construct the API URL (pointing to the Node.js backend) ---
    // Verwendet VITE_LLM_URL/PORT, da feedback-parser der Haupteinstiegspunkt ist
    const baseUrl = `${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? '' : ':' + import.meta.env.VITE_LLM_PORT}`;

    // *** NEUER ENDPUNKT (muss im Node.js-Backend erstellt werden) ***
    // Wir rufen den neuen, intelligenten Orchestrator-Endpunkt auf.
    const apiUrl = `${baseUrl}/api/process-audio-session`;

    // --- 2. Prepare FormData ---
    // FormData ist erforderlich, um die Datei zu senden.
    // Wir fügen die anderen Daten als JSON-Strings hinzu.
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('language_code', languageCode || ''); // Sende leeren String statt null
    formData.append('roles', JSON.stringify(roles)); // Sende die Rollenliste als JSON-String

    // --- 3. Make the Fetch Request ---
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
            // KEIN 'Content-Type' Header, der Browser setzt ihn für FormData korrekt
        });

        // --- 4. Handle Response ---
        const data = await response.json();

        if (!response.ok) {
            // Fehler vom Backend (z.B. 404, 500)
            console.error("Backend Error (von /api/process-audio-session):", data);
            return {
                success: false,
                message: data.detail || data.message || `Server error: ${response.status}`,
                status_code: response.status,
            };
        }

        // Wir erwarten, dass 'data' jetzt das *endgültige* Ergebnis
        // nach der Gemini-Verarbeitung ist.
        if (data.status === "success" && Array.isArray(data.diarized_transcription)) {
             return data as DiarizationSuccessResult;
        } else {
            // Backend meldet Erfolg, aber die Datenstruktur ist unerwartet
            console.error("Unexpected success response structure:", data);
            return {
                success: false,
                message: "Received an unexpected response format from the server.",
            };
        }

    } catch (error) {
        // Netzwerkfehler oder komplett fehlgeschlagene Anfrage
        console.error("Fetch Error (processAudioSession):", error);
        let message = "Network error or failed to fetch.";
        if (error instanceof Error) {
            message = error.message;
        }
        return {
            success: false,
            message: message,
        };
    }
}