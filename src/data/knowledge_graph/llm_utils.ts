/**
 * Type definition for the result of LLM parsing operations.
 * It includes a success flag, a message, and optional data.
 */
export type LLMParsingResult = {
    success: boolean;
    message: string;
    data?: any;
}

/**
 * Generates a valid TTL of a setting containing everything needed to view it in the UI. 
 * The basis for the generation is the description. 
 * 
 * @param description Setting Description that the ttl will be generated from
 * @param title Title of the setting - will be generated from the description if not provided
 * @param defaultRole default role for the setting - will be "lecturer" if not provided
 * @returns LLMParsingResult
 */
export async function llmSettingGeneration(description: string, title?: string, defaultRole?: string): Promise<LLMParsingResult> {
    return {
        success: false,
        message: "TODO"
    }
}

/**
 * Submits question and answer pairs to the LLM for a specific graph and role, generating tensions and entities.
 * @param graphID The ID of the graph the data relates to
 * @param role The role of the user submitting the data
 * @param data The question and answer pairs to submit
 * @returns LLMParsingResult
 */
export async function llmSubmit(graphID: string, role: string, data: { question: string, answer: string }[]): Promise<LLMParsingResult> {
    return {
        success: false,
        message: "TODO"
    }
}

/**
 * Pools all temporary saved submission results and pools them into a single result, finally adding it to the specified graph.
 * @param graphID The ID of the graph to parse
 * @returns LLMParsingResult
 */
export async function llmPool(graphID: string): Promise<LLMParsingResult> {
    return {
        success: false,
        message: "TODO"
    }
}