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
 * Uploads an audio file (.wav, .flac, .ogg) to the backend for diarization and transcription.
 * The request goes through the Node.js proxy defined in feedback-parser.
 *
 * @param audioFile The audio File object to upload.
 * @param languageCode Optional ISO-639-1 language code (e.g., 'de', 'en'). If null/undefined, auto-detection is attempted.
 * @returns Promise resolving to DiarizationSuccessResult or DiarizationErrorResult
 */
export async function uploadAndDiarizeAudio(
    audioFile: File,
    languageCode?: string | null
): Promise<DiarizationSuccessResult | DiarizationErrorResult> {

    // --- 1. Construct the API URL (pointing to the Node.js proxy) ---
    // It uses VITE_LLM_URL/PORT because feedback-parser acts as the main backend entry point
    const baseUrl = `${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? '' : ':' + import.meta.env.VITE_LLM_PORT}`;
    // The path includes the proxy path prefix '/api/diarize' and the actual Python API path '/api/diarize_and_transcribe'
    let apiUrl = `${baseUrl}/whisper-proxy/api/diarize_and_transcribe`;

    if (languageCode) {
        apiUrl += `?language_code=${encodeURIComponent(languageCode)}`;
    }

    // --- 2. Prepare FormData ---
    const formData = new FormData();
    formData.append('audio_file', audioFile);

    // --- 3. Make the Fetch Request ---
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
            // DO NOT set 'Content-Type': 'multipart/form-data'.
            // The browser sets it automatically with the correct boundary for FormData.
        });

        // --- 4. Handle Response ---
        const data = await response.json();

        if (!response.ok) {
            // Handle errors reported by the backend (FastAPI validation or runtime errors)
            console.error("Backend Error:", data);
            return {
                success: false,
                message: data.detail || data.message || `Server error: ${response.status}`,
                status_code: response.status,
            };
        }

        // Check if the response structure matches the expected success result
        if (data.status === "success" && Array.isArray(data.diarized_transcription)) {
             // Type assertion might be needed if TypeScript can't infer the type correctly
             return data as DiarizationSuccessResult;
        } else {
             // Handle unexpected success response structure
            console.error("Unexpected success response structure:", data);
            return {
                success: false,
                message: "Received an unexpected response format from the server.",
            };
        }

    } catch (error) {
        // Handle network errors or other fetch-related issues
        console.error("Fetch Error:", error);
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
