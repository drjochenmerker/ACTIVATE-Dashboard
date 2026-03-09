import { ref } from 'vue';

/**
 * ErrorService - Handles temporary error dialog state
 * This is a simple service, not a Pinia store, as it doesn't persist data
 */

const isOpen = ref(false);
const errorMessage = ref('');
const errorTitle = ref('');
const llmError = ref('');

/**
 * Show error dialog with a message
 * @param message - Error message to display
 * @param title - Optional title for the error dialog
 * @param llmErrorText - Optional LLM error details
 */
export function showError(message: string, title?: string, llmErrorText?: string) {
    errorMessage.value = message;
    errorTitle.value = title || '';
    llmError.value = llmErrorText || '';
    isOpen.value = true;
}

/**
 * Close error dialog
 */
export function closeError() {
    isOpen.value = false;
    errorMessage.value = '';
    errorTitle.value = '';
    llmError.value = '';
}

/**
 * Get reactive error state (for use in components)
 */
export function useErrorService() {
    return {
        isOpen,
        errorMessage,
        errorTitle,
        llmError,
        showError,
        closeError,
    };
}
