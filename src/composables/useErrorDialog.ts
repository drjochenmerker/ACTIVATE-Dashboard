import { ref } from 'vue';

export type ErrorType = 'validation' | 'llm' | 'unexpected';
export type MultiLangText = { en?: string; de?: string; sv?: string };

/**
 * ErrorDialog State and Service Composable
 * Handles temporary error dialog state
 */
const isOpen = ref(false);
const errorType = ref<ErrorType>('unexpected');
const errorMessage = ref<string | MultiLangText>('');
const llmError = ref('');

/**
 * Show error dialog with a message
 * @param type - Type of error for UX-specific title/message handling
 * @param message - Error message to display (string or multilingual object)
 * @param llmErrorText - Optional LLM error details
 */
export function showError(type: ErrorType, message?: string | MultiLangText, llmErrorText?: string) {
    errorType.value = type;
    errorMessage.value = message ?? '';
    llmError.value = llmErrorText || '';
    isOpen.value = true;
}

/**
 * Close error dialog
 */
export function closeError() {
    isOpen.value = false;
    errorType.value = 'unexpected';
    errorMessage.value = '';
    llmError.value = '';
}

/**
 * Get reactive error state (for use in components)
 */
export function useErrorDialog() {
    return {
        isOpen,
        errorType,
        errorMessage,
        llmError,
        showError,
        closeError,
    };
}
