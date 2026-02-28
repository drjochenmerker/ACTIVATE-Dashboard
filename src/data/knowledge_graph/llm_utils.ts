import { LLMRequestConfig, useLLMSettingsStore } from "@/stores/llmSettingsStore";
import { sparqlTemplate, StringAccessObject } from "./structures";
import { fetchSparql, getSparqlTemplate } from "./utils";

/**
 * Type definition for the result of LLM parsing operations.
 * It includes a success flag, a message, and optional data.
 */
export type LLMParsingResult = {
    success: boolean;
    message: string;
    data?: { question: string; answer: string };
};

/**
 * Generates a valid TTL of a setting containing everything needed to view it in the UI.
 * The basis for the generation is the description.
 *
 * @param description Setting Description that the ttl will be generated from
 * @param title Title of the setting - will be generated from the description if not provided
 * @param defaultRole default role for the setting - will be generated if not provided
 * @returns LLMParsingResult
 */
export async function llmSettingGeneration(
    description: string,
    llmDetail: LLMRequestConfig,
    title?: string,
    defaultRole?: string,
): Promise<LLMParsingResult> {
    const llmSettingsStore = useLLMSettingsStore();
    // Generate TTL using the LLM Backend
    const llmRes = await fetch(
        `${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? "" : ":" + import.meta.env.VITE_LLM_PORT}/api/feedback/settingGen`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                description,
                llmDetail: JSON.stringify(llmDetail),
                kgGenPrompt: llmSettingsStore.getPrompts().knowledgeGraphGeneration ?? null,
                entityExtractionPrompt: llmSettingsStore.getPrompts().entityExtraction ?? null,
                title: title ?? "",
                defaultRole: defaultRole ?? "",
            }),
        },
    );
    const data = await llmRes.json();
    if (!llmRes.ok || data.error) {
        return {
            success: false,
            message: data.error,
        };
    }
    // Add TTL to Sparql Backend
    const rdfRes = await fetch(
        `${import.meta.env.VITE_KNOWLEDGE_GRAPH_URL}${!import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT ? "" : ":" + import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT}/upload-ttl/`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: data.ttl,
        },
    );
    if (!rdfRes.ok) {
        return {
            success: false,
            message: "Failed to upload generated TTL",
        };
    }
    const rdfData = await rdfRes.json();
    if (rdfData.message === "success") {
        return {
            success: true,
            message: "Setting generated and added successfully",
        };
    }
    return {
        success: false,
        message: "Uncaught error while generating and adding TTL",
    };
}

/**
 * Submits question and answer pairs to the LLM for a specific graph and role, generating tensions and entities.
 * @param graphID The ID of the graph the data relates to
 * @param role The role of the user submitting the data
 * @param data The question and answer pairs to submit
 * @returns LLMParsingResult
 */
export async function llmSubmit(
    graphID: string,
    role: { id: string; label: string },
    data: { question: string; answer: string }[],
    llmDetail: LLMRequestConfig,
): Promise<LLMParsingResult> {
    const llmSettingsStore = useLLMSettingsStore();
    // Fetch description and entities from the graph
    const description: StringAccessObject = {};
    const entities: StringAccessObject[] = [];
    let query = await getSparqlTemplate(sparqlTemplate.getLLMDetail);
    const graphRes = await fetchSparql(query.replace("{{graph}}", graphID));
    graphRes.forEach((triple: StringAccessObject) => {
        if (triple.description) {
            description[triple.description["xml:lang"]] = triple.description.value;
        } else if (triple.entity && triple.property.value.split("#").pop() === "type") {
            const entity = entities.find((entity) => entity.id === triple.entity.value.split("#").pop());
            if (entity) {
                entity.classes.push(triple.target.value.split("#").pop());
            } else {
                entities.push({
                    id: triple.entity.value.split("#").pop(),
                    classes: [triple.target.value.split("#").pop()],
                });
            }
        }
    });
    // Generate TTL using the LLM Backend
    const llmRes = await fetch(
        `${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? "" : ":" + import.meta.env.VITE_LLM_PORT}/api/feedback/submit`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                setting: description.en,
                entities,
                feedback: {
                    role,
                    data: data,
                },
                llmDetail: JSON.stringify(llmDetail),
                entityExtractionPrompt: llmSettingsStore.getPrompts().entityExtraction,
                tensionExtractionPrompt: llmSettingsStore.getPrompts().tensionExtraction,
            }),
        },
    );
    const llmData = await llmRes.json();
    if (!llmRes.ok || llmData.error) {
        return {
            success: false,
            message: llmData.error,
        };
    }
    // Save results temporary in the graph as a literal
    // Entities
    query = await getSparqlTemplate(sparqlTemplate.addLLMSubmission);
    const EntityMapObj = {
        "{{graph}}": graphID,
        "{{predicate}}": "llmSubmissionEntity",
        "{{object}}": llmData.ttl.entities,
    };
    query = query.replaceMultiple(EntityMapObj);
    const EntityRes = await fetchSparql(query, true);
    // Tensions
    query = await getSparqlTemplate(sparqlTemplate.addLLMSubmission);
    const TensionMapObj = {
        "{{graph}}": graphID,
        "{{predicate}}": "llmSubmissionTension",
        "{{object}}": llmData.ttl.tensions,
    };
    query = query.replaceMultiple(TensionMapObj);
    const TensionRes = await fetchSparql(query, true);
    if (!EntityRes.ok || !TensionRes.ok) {
        return {
            success: false,
            message: "Failed to stash results",
        };
    }
    return {
        success: true,
        message: "Results stashed successfully",
    };
}

/**
 * Pools all temporary saved submission results and pools them into a single result, finally adding it to the specified graph.
 * @param graphID The ID of the graph to parse
 * @returns LLMParsingResult
 */
export async function llmPool(graphID: string, llmDetail: LLMRequestConfig): Promise<LLMParsingResult> {
    const debugOn = true; // DEBUG: SET TO TRUE IF DEBUGGING IS NEEDED
    const logger = {
        log: (...args: string[]) => {
            if (debugOn) {
                console.log(...args);
            }
        },
        error: (...args: string[]) => {
            if (debugOn) {
                console.error(...args);
            }
        },
    };

    logger.log(`DEBUG: Starting llmPool for graphID: ${graphID}`);
    const totalStartTime = performance.now();

    // Step 1: Fetch submissions
    let stepStartTime = performance.now();
    let query = await getSparqlTemplate(sparqlTemplate.getLLMSubmissions);
    logger.log("DEBUG: Fetching submissions with query template...");
    const submissionRes = await fetchSparql(query.replace("{{graph}}", graphID));

    logger.log(
        `DEBUG: Fetched ${submissionRes.length} submission triples. (Duration: ${performance.now() - stepStartTime} ms)`,
    );

    if (submissionRes.length === 0) {
        logger.error("DEBUG: No submissions found. Aborting.");
        logger.log(`DEBUG: llmPool finished (FAILURE) in ${performance.now() - totalStartTime} ms.`);
        return {
            success: false,
            message: "Failed to fetch submissions",
        };
    }
    const entitySubmissions: string[] = [];
    const tensionSubmissions: string[] = [];
    submissionRes.forEach((triple: StringAccessObject) => {
        if (triple.predicate.value.split("#").pop() === "llmSubmissionEntity") {
            entitySubmissions.push(triple.object.value);
        } else if (triple.predicate.value.split("#").pop() === "llmSubmissionTension") {
            tensionSubmissions.push(triple.object.value);
        }
    });

    logger.log(
        `DEBUG: Sorted submissions. Entities: ${entitySubmissions.length}, Tensions: ${tensionSubmissions.length}`,
    );

    // Step 2: Pool submissions (LLM API)
    const llmSettingsStore = useLLMSettingsStore();
    stepStartTime = performance.now(); // Reset timer for step 2
    logger.log("DEBUG: Sending submissions to LLM pooling API...");
    const poolRes = await fetch(
        `${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? "" : ":" + import.meta.env.VITE_LLM_PORT}/api/feedback/pool`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                entities: entitySubmissions,
                tensions: tensionSubmissions,
                llmDetail: JSON.stringify(llmDetail),
                turtleFileMergePrompt: llmSettingsStore.getPrompts().turtleFileMerge,
                tensionExtractionPrompt: llmSettingsStore.getPrompts().tensionExtraction,
            }),
        },
    );

    logger.log(
        `DEBUG: LLM pooling API response status: ${poolRes.status}. (Dauer: ${performance.now() - stepStartTime} ms)`,
    );

    const data = await poolRes.json();
    if (!poolRes.ok || data.error) {
        logger.error(`DEBUG: LLM pooling failed. Status: ${poolRes.status}, Error: ${data.error}`);
        logger.log(`DEBUG: llmPool finished (FAILURE) in ${performance.now() - totalStartTime} ms.`);
        return {
            success: false,
            message: data.error,
        };
    }

    // Step 3: Add results to knowledge graph
    stepStartTime = performance.now(); // Reset timer for step 3
    logger.log(`DEBUG: Adding pooled TTL to knowledge graph: ${graphID}`);
    const backendRes = await fetch(
        `${import.meta.env.VITE_KNOWLEDGE_GRAPH_URL}${!import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT ? "" : ":" + import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT}/parse-pool/`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                graph_id: graphID,
                ttl: data.ttl,
            }),
        },
    );

    logger.log(
        `DEBUG: Knowledge graph API response status: ${backendRes.status}. (Dauer: ${performance.now() - stepStartTime} ms)`,
    );

    if (!backendRes.ok) {
        logger.error("DEBUG: Failed to upload pooled TTL to knowledge graph.");
        logger.log(`DEBUG: llmPool finished (FAILURE) in ${performance.now() - totalStartTime} ms.`);
        return {
            success: false,
            message: "Failed to upload pooled TTL",
        };
    }

    // Step 4: Delete temporary submissions
    stepStartTime = performance.now(); // Reset timer for step 4
    logger.log("DEBUG: Deleting temporary submissions...");
    query = await getSparqlTemplate(sparqlTemplate.deleteTriples);
    const mapObj = {
        "{{graph}}": graphID,
        "{{subject}}": "llmSubmission",
    };
    query = query.replaceMultiple(mapObj);
    const graphRes = await fetchSparql(query, true);

    logger.log(
        `DEBUG: Delete submissions response status: ${graphRes.status}. (Dauer: ${performance.now() - stepStartTime} ms)`,
    );

    if (!graphRes.ok) {
        logger.error("DEBUG: Failed to delete temporary submissions.");
        logger.log(`DEBUG: llmPool finished (FAILURE) in ${performance.now() - totalStartTime} ms.`);
        return {
            success: false,
            message: "Failed to delete temporary submissions",
        };
    }

    const totalEndTime = performance.now();
    logger.log(
        `DEBUG: llmPool completed successfully for graphID: ${graphID}. (Gesamtdauer: ${totalEndTime - totalStartTime} ms)`,
    );
    return {
        success: true,
        message: "Pooling successful",
    };
}
