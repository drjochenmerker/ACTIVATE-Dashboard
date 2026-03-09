import { ref } from 'vue';

/**
 * ErrorDialog State and Service Composable
 * Handles temporary error dialog state
 */
const isOpen = ref(false);
const errorMessage = ref<string | { en?: string; de?: string; sv?: string }>('');
const errorTitle = ref('');
const llmError = ref('');

/**
 * Show error dialog with a message
 * @param message - Error message to display (string or multilingual object)
 * @param title - Optional title for the error dialog
 * @param llmErrorText - Optional LLM error details
 */
export function showError(message: string | { en?: string; de?: string; sv?: string }, title?: string, llmErrorText?: string) {
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
export function useErrorDialog() {
    return {
        isOpen,
        errorMessage,
        errorTitle,
        llmError,
        showError,
        closeError,
    };
}
