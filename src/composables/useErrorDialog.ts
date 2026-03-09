import { ref } from 'vue';

/**
 * ErrorDialog State and Service Composable
 * Handles temporary error dialog state
 */
const isOpen = ref(false);
const errorMessage = ref<string | { en?: string; de?: string; sv?: string }>('');
const llmError = ref('');

/**
 * Show error dialog with a message
 * @param message - Error message to display (string or multilingual object)
 * @param llmErrorText - Optional LLM error details
 */
export function showError(message: string | { en?: string; de?: string; sv?: string }, llmErrorText?: string) {
    errorMessage.value = message;
    llmError.value = llmErrorText || '';
    isOpen.value = true;
}

/**
 * Close error dialog
 */
export function closeError() {
    isOpen.value = false;
    errorMessage.value = '';
    llmError.value = '';
}

/**
 * Get reactive error state (for use in components)
 */
export function useErrorDialog() {
    return {
        isOpen,
        errorMessage,
        llmError,
        showError,
        closeError,
    };
}
