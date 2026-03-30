import { LLMRequestConfig, useLLMSettingsStore } from "@/stores/llmSettingsStore";
import { sparqlTemplate, StringAccessObject } from "./structures";
import { fetchSparql, getSparqlTemplate } from "./utils";
import { addRequiredEntitiesToGraph } from "./requiredEntities";

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
                knowledgeGraphGenerationPrompt: llmSettingsStore.getPrompts().knowledgeGraphGeneration ?? null,
                entityAssignmentPrompt: llmSettingsStore.getPrompts().entityAssignment ?? null,
                predefinedEntities: llmSettingsStore.getPrompts().predefinedEntities ?? null,
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
        await addRequiredEntitiesToGraph(rdfData.graph_id, llmSettingsStore.getPrompts().predefinedEntities);

        return {
            success: true,
            message: "Setting generated and added successfully for graph ID: " + rdfData.graph_id, // debug message with graph ID
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

// /**
//  * Pools all temporary saved submission results and pools them into a single result, finally adding it to the specified graph.
//  * @param graphID The ID of the graph to parse
//  * @returns LLMParsingResult
//  */
// export async function llmPool(graphID: string): Promise<LLMParsingResult> {
//     // Fetch all submissions
//     let query = await getSparqlTemplate(sparqlTemplate.getLLMSubmissions);
//     const submissionRes = await fetchSparql(query.replace("{{graph}}", graphID));
//     if (submissionRes.length === 0) {
//         return {
//             success: false,
//             message:"Failed to fetch submissions"
//         }
//     }
//     const entitySubmissions: string[] = [];
//     const tensionSubmissions: string[] = [];
//     submissionRes.forEach((triple: StringAccessObject) => {
//         if (triple.predicate.value.split("#").pop() === "llmSubmissionEntity") {
//             entitySubmissions.push(triple.object.value);
//         } else if (triple.predicate.value.split("#").pop() === "llmSubmissionTension") {
//             tensionSubmissions.push(triple.object.value);
//         }
//     });
//     // Pool submissions
//     const poolRes = await fetch(`${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? '' : ':' + import.meta.env.VITE_LLM_PORT}/api/feedback/pool`, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             "Accept": "application/json",
//         },
//         body: JSON.stringify({
//             entities: entitySubmissions,
//             tensions: tensionSubmissions,
//         })
//     });
//     const data = await poolRes.json();
//     if (!poolRes.ok || data.error) {
//         return {
//             success: false,
//             message: data.error
//         }
//     }
//     console.log("DEBUG: 1. data ttl poolRes.json ", data);
//     // Add results from pooling to the graph
//     const backendRes = await fetch(`${import.meta.env.VITE_KNOWLEDGE_GRAPH_URL}${!import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT ? '' : ':' + import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT}/parse-pool/`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             graph_id: graphID,
//             ttl: data.ttl
//         }),
//     });
//     if (!backendRes.ok) {
//         return {
//             success: false,
//             message: "Failed to upload pooled TTL"
//         }
//     }
//     // Remove temporary submissions
//     query = await getSparqlTemplate(sparqlTemplate.deleteTriples);
//     const mapObj = {
//         "{{graph}}": graphID,
//         "{{subject}}": "llmSubmission",
//     };
//     query = query.replaceMultiple(mapObj);
//     const graphRes = await fetchSparql(query, true);
//     if (!graphRes.ok) {
//         return {
//             success: false,
//             message: "Failed to delete temporary submissions"
//         }
//     }
//     console.log("DEBUG: 2. data ttl poolRes.json ", data);
//     return {
//         success: true,
//         message: "Pooling successful"
//     }
// }
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
    // Pool submissions
    // const poolRes = await fetch(
    //     `${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? "" : ":" + import.meta.env.VITE_LLM_PORT}/api/feedback/pool`,
    //     {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json",
    //             Accept: "application/json",
    //         },
    //         body: JSON.stringify({
    //             entities: entitySubmissions,
    //             tensions: tensionSubmissions,
    //         }),
    //     },
    // );

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
    // Add results from pooling to the graph
    // const backendRes = await fetch(
    //     `${import.meta.env.VITE_KNOWLEDGE_GRAPH_URL}${!import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT ? "" : ":" + import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT}/parse-pool/`,
    //     {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json",
    //         },
    //         body: JSON.stringify({
    //             graph_id: graphID,
    //             ttl: data.ttl,
    //         }),
    //     },
    // );

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
// src/services/llm_utils.ts

/**
 * Helper to fetch the current graph content as TTL to serve as context for the LLM.
 * Note: This assumes your SPARQL endpoint supports CONSTRUCT queries.
 */
// async function fetchContextAsTTL(graphID: string): Promise<string> {
//     // Simple CONSTRUCT query to get all triples for the graph context
//     // You might need to adjust the WHERE clause if your named graphs are handled differently
//     const query = `
//         CONSTRUCT { ?s ?p ?o }
//         WHERE {
//             ?s ?p ?o .
//             FILTER(STRSTARTS(STR(?s), "http://activate.htwk-leipzig.de/model"))
//         }
//     `;

//     try {
//         // Assuming fetchSparql can handle CONSTRUCT and return a string or N-Triples
//         // If fetchSparql only returns JSON bindings, you might need a different approach
//         // or rely on fetchSparql returning the raw response for CONSTRUCT queries.
//         // For now, let's assume we pass the graphID context logic used in other functions.

//         // If direct CONSTRUCT isn't available/working in your setup,
//         // you can rely on the extraction logic you already used in llmSubmit (fetching entities & descriptions)
//         // and pass that as a string.

//         // For this example, let's assume we construct a minimal context from what we know:
//         let context = "@prefix : <http://activate.htwk-leipzig.de/model#> .\n";

//         // We reuse the logic from llmSubmit to at least get Entities
//         let entityQuery = await getSparqlTemplate(sparqlTemplate.getLLMDetail);
//         const graphRes = await fetchSparql(entityQuery.replace("{{graph}}", graphID));

//         graphRes.forEach((triple: any) => {
//              if(triple.entity && triple.target) {
//                  const s = triple.entity.value.split("#").pop();
//                  const o = triple.target.value.split("#").pop();
//                  context += `:${s} a :${o} .\n`;
//                  if(triple.label) {
//                      context += `:${s} rdfs:label "${triple.label.value}" .\n`;
//                  }
//              }
//         });
//         return context;

//     } catch (e) {
//         console.error("Error fetching context graph:", e);
//         return ""; // Return empty string on error to allow process to continue without context
//     }
// }

/**
 * Merges a diarized transcript into the LLM backend for a specified knowledge graph.
 */
// export async function mergeTranscript(graphID: string, diarizedTranscript: any): Promise<LLMParsingResult> {
//     console.log("Merging transcript for graph:", graphID);

//     // 1. Fetch Context (Existing Entities/Conflicts)
//     const existingTTL = await fetchContextAsTTL(graphID);

//     // 2. Call Node Backend to Generate New Triples
//     const llmRes = await fetch(`${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? '' : ':'
//         + import.meta.env.VITE_LLM_PORT}/api/feedback/transcriptionPool`, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             "Accept": "application/json",
//         },
//         body: JSON.stringify({
//             graph_id: graphID,
//             diarizedTranscript: diarizedTranscript.diarized_transcription,
//             existingTTL: existingTTL // Pass the context!
//         })
//     });

//     const llmData = await llmRes.json();

//     if (!llmRes.ok || llmData.error) {
//         return {
//             success: false,
//             message: llmData.error || "LLM Generation failed"
//         }
//     }

//     console.log("Generated TTL from Audio:", llmData.ttl);

//     // 3. Upload Result to Knowledge Graph Backend (main.py /parse-pool/)
//     // main.py expects: { "graph_id": "...", "ttl": "..." }
//     const rdfRes = await fetch(`${import.meta.env.VITE_KNOWLEDGE_GRAPH_URL}${!import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT ? '' : ':' + import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT}/parse-pool/`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             graph_id: graphID,
//             ttl: llmData.ttl
//         }),
//     });

//     if (!rdfRes.ok) {
//         const errText = await rdfRes.text();
//         console.error("KG Backend Error:", errText);
//         return {
//             success: false,
//             message: "Failed to save generated triples to Graph"
//         }
//     }

//     return {
//         success: true,
//         message: "Successfully merged audio transcription into graph.",
//         data: llmData.ttl
//     }
// }

export async function mapRolesToTranscript(transcript: { diarized_transcription?: any }): Promise<LLMParsingResult> {
    // transcript is already cut transcript to first utterance of each speaker and the speaker id starts with 00 according to utterance
    console.log("Map Roles for already cut transcript:", transcript.diarized_transcription);
    const llmSettingsStore = useLLMSettingsStore();
    const llmResMapping = await fetch(
        `${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? "" : ":" + import.meta.env.VITE_LLM_PORT}/api/audio/speaker-role-mapping`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                diarizedTranscript: transcript.diarized_transcription,
                llm: llmSettingsStore.getCurrentModelRequestConfig(),
            }),
        },
    );

    const data = await llmResMapping.json();

    return {
        success: true,
        message: "Successfully mapped roles for audio transcription.",
        data: data,
    };
}

export async function mappedTranscriptToTtl(graphID: string, mappedTranscript: any): Promise<LLMParsingResult> {
    // Fetch description and entities from the graph
    let description: StringAccessObject = {};
    let entities: StringAccessObject[] = [];
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
    const llmResTranscript = await fetch(
        `${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? "" : ":" + import.meta.env.VITE_LLM_PORT}/api/feedback/submitTranscript`,
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
                    data: mappedTranscript,
                },
                llm: useLLMSettingsStore().getCurrentModelRequestConfig(),
            }),
        },
    );
    const llmData = await llmResTranscript.json();
    if (!llmResTranscript.ok || llmData.error) {
        return {
            success: false,
            message: llmData.error,
        };
    }
    // Save results temporary in the graph as a literal
    // Entities
    query = await getSparqlTemplate(sparqlTemplate.addLLMSubmission); // todo what sparql query??
    const EntityMapObj = {
        "{{graph}}": graphID,
        "{{predicate}}": "llmSubmissionEntity",
        "{{object}}": llmData.ttl.entities,
    };
    query = query.replaceMultiple(EntityMapObj); // todo: check this function
    const EntityRes = await fetchSparql(query, true);

    // Tensions
    query = await getSparqlTemplate(sparqlTemplate.addLLMSubmission); // todo what sparql query??
    const TensionMapObj = {
        "{{graph}}": graphID,
        "{{predicate}}": "llmSubmissionTension",
        "{{object}}": llmData.ttl.tensions,
    };
    query = query.replaceMultiple(TensionMapObj); // todo: check this function
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

// export async function mergeTranscript(graphID: string, diarizedTranscript: any): Promise<LLMParsingResult> {
//     console.log("Merging transcript for graph:", graphID);
//     const mergeRes = await fetch(`${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? '' : ':'
//         + import.meta.env.VITE_LLM_PORT}/api/feedback/transcriptionPool`, { // endpoint of the feedback-parser backend
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             "Accept": "application/json",
//         },
//         body: JSON.stringify({
//             graph_id: graphID,
//             diarizedTranscript: diarizedTranscript.diarized_transcription,
//         })
//     });

//     try {
//         const data = await mergeRes.json();
//         console.log("Merge response data:", data);
//         return data;
//     } catch (jsonError) {
//         console.error("Error parsing JSON response:", jsonError);
//     }

//     if (!mergeRes.ok) {
//         console.error("Network or runtime error during merge request.");
//         return {
//             success: false,
//             message: "Failed to upload pooled TTL"
//         }
//     } else {
//         return {
//             success: true,
//             message: "Successfully called backend",
//         }
//     }

// }
