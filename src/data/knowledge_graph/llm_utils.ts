import { sparqlTemplate, StringAccessObject } from "./structures";
import { fetchSparql, getSparqlTemplate } from "./utils";

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
 * @param defaultRole default role for the setting - will be generated if not provided
 * @returns LLMParsingResult
 */
export async function llmSettingGeneration(description: string, title?: string, defaultRole?: string): Promise<LLMParsingResult> {
    // Generate TTL using the LLM Backend
    const llmRes = await fetch(`${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? '' : ':' + import.meta.env.VITE_LLM_PORT}/api/feedback/settingGen`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify({
            description,
            title: title ?? "",
            defaultRole: defaultRole ?? ""
        })
    });
    console.log("llm res", llmRes);
    const data = await llmRes.json();
    if (!llmRes.ok || data.error) {
        return {
            success: false,
            message: data.error
        }
    }
    // Add TTL to Sparql Backend
    const rdfRes = await fetch(`${import.meta.env.VITE_KNOWLEDGE_GRAPH_URL}${!import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT ? '' : ':' + import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT}/upload-ttl/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: data.ttl,
    });
    if (!rdfRes.ok) {
        return {
            success: false,
            message: "Failed to upload generated TTL"
        }
    }
    const rdfData = await rdfRes.json();
    if (rdfData.message === 'success') {
        return {
            success: true,
            message: "Setting generated and added successfully",
        }
    }
    return {
        success: false,
        message: "Uncaught error while generating and adding TTL"
    }
}

/**
 * Submits question and answer pairs to the LLM for a specific graph and role, generating tensions and entities.
 * @param graphID The ID of the graph the data relates to
 * @param role The role of the user submitting the data
 * @param data The question and answer pairs to submit
 * @returns LLMParsingResult
 */
export async function llmSubmit(graphID: string, role: { id: string, label: string }, data: { question: string, answer: string }[]): Promise<LLMParsingResult> {
    // Fetch description and entities from the graph
    let description: StringAccessObject = {};
    let entities: StringAccessObject[] = [];
    let query = await getSparqlTemplate(sparqlTemplate.getLLMDetail);
    const graphRes = await fetchSparql(query.replace("{{graph}}", graphID));
    graphRes.forEach((triple: StringAccessObject) => {
        if (triple.description) {
            description[triple.description["xml:lang"]] = triple.description.value;
        }
        else if (triple.entity && triple.property.value.split("#").pop() === "type") {
            const entity = entities.find(entity => entity.id === triple.entity.value.split("#").pop())
            if (entity) {
                entity.classes.push(triple.target.value.split("#").pop());
            } else {
                entities.push({
                    id: triple.entity.value.split("#").pop(),
                    classes: [triple.target.value.split("#").pop()],
                })
            }
        }
    });
    // Generate TTL using the LLM Backend
    const llmRes = await fetch(`${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? '' : ':' + import.meta.env.VITE_LLM_PORT}/api/feedback/submit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify({
            setting: description.en,
            entities,
            feedback: {
                role,
                data: data
            }
        })
    });
    const llmData = await llmRes.json();
    if (!llmRes.ok || llmData.error) {
        return {
            success: false,
            message: llmData.error
        }
    }
    // Save results temporary in the graph as a literal
    // Entities
    query = await getSparqlTemplate(sparqlTemplate.addLLMSubmission);
    const EntityMapObj = {
        "{{graph}}": graphID,
        "{{predicate}}": "llmSubmissionEntity",
        "{{object}}": llmData.ttl.entities
    };
    query = query.replaceMultiple(EntityMapObj);
    const EntityRes = await fetchSparql(query, true);
    // Tensions
    query = await getSparqlTemplate(sparqlTemplate.addLLMSubmission);
    const TensionMapObj = {
        "{{graph}}": graphID,
        "{{predicate}}": "llmSubmissionTension",
        "{{object}}": llmData.ttl.tensions
    };
    query = query.replaceMultiple(TensionMapObj);
    const TensionRes = await fetchSparql(query, true);
    if (!EntityRes.ok || !TensionRes.ok) {
        return {
            success: false,
            message: "Failed to stash results"
        }
    }
    return {
        success: true,
        message: "Results stashed successfully"
    }
}

/**
 * Pools all temporary saved submission results and pools them into a single result, finally adding it to the specified graph.
 * @param graphID The ID of the graph to parse
 * @returns LLMParsingResult
 */
export async function llmPool(graphID: string): Promise<LLMParsingResult> {
    // Fetch all submissions
    let query = await getSparqlTemplate(sparqlTemplate.getLLMSubmissions);
    const submissionRes = await fetchSparql(query.replace("{{graph}}", graphID));
    if (submissionRes.length === 0) {
        return {
            success: false,
            message:"Failed to fetch submissions"
        }
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
    const poolRes = await fetch(`${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? '' : ':' + import.meta.env.VITE_LLM_PORT}/api/feedback/pool`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify({
            entities: entitySubmissions,
            tensions: tensionSubmissions,
        })
    });
    const data = await poolRes.json();
    if (!poolRes.ok || data.error) {
        return {
            success: false,
            message: data.error
        }
    }
    // Add results from pooling to the graph
    const backendRes = await fetch(`${import.meta.env.VITE_KNOWLEDGE_GRAPH_URL}${!import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT ? '' : ':' + import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT}/parse-pool/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            graph_id: graphID,
            ttl: data.ttl
        }),
    });
    if (!backendRes.ok) {
        return {
            success: false,
            message: "Failed to upload pooled TTL"
        }
    }
    // Remove temporary submissions
    query = await getSparqlTemplate(sparqlTemplate.deleteTriples);
    const mapObj = {
        "{{graph}}": graphID,
        "{{subject}}": "llmSubmission",
    };
    query = query.replaceMultiple(mapObj);
    const graphRes = await fetchSparql(query, true);
    if (!graphRes.ok) {
        return {
            success: false,
            message: "Failed to delete temporary submissions"
        }
    }
    return {
        success: true,
        message: "Pooling successful"
    }
}
// src/services/llm_utils.ts

/**
 * Helper to fetch the current graph content as TTL to serve as context for the LLM.
 * Note: This assumes your SPARQL endpoint supports CONSTRUCT queries.
 */
async function fetchContextAsTTL(graphID: string): Promise<string> {
    // Simple CONSTRUCT query to get all triples for the graph context
    // You might need to adjust the WHERE clause if your named graphs are handled differently
    const query = `
        CONSTRUCT { ?s ?p ?o }
        WHERE {
            ?s ?p ?o .
            FILTER(STRSTARTS(STR(?s), "http://activate.htwk-leipzig.de/model"))
        }
    `;
    
    try {
        // Assuming fetchSparql can handle CONSTRUCT and return a string or N-Triples
        // If fetchSparql only returns JSON bindings, you might need a different approach 
        // or rely on fetchSparql returning the raw response for CONSTRUCT queries.
        // For now, let's assume we pass the graphID context logic used in other functions.
        
        // If direct CONSTRUCT isn't available/working in your setup, 
        // you can rely on the extraction logic you already used in llmSubmit (fetching entities & descriptions)
        // and pass that as a string.
        
        // For this example, let's assume we construct a minimal context from what we know:
        let context = "@prefix : <http://activate.htwk-leipzig.de/model#> .\n";
        
        // We reuse the logic from llmSubmit to at least get Entities
        let entityQuery = await getSparqlTemplate(sparqlTemplate.getLLMDetail);
        const graphRes = await fetchSparql(entityQuery.replace("{{graph}}", graphID));
        
        graphRes.forEach((triple: any) => {
             if(triple.entity && triple.target) {
                 const s = triple.entity.value.split("#").pop();
                 const o = triple.target.value.split("#").pop();
                 context += `:${s} a :${o} .\n`;
                 if(triple.label) {
                     context += `:${s} rdfs:label "${triple.label.value}" .\n`;
                 }
             }
        });
        return context;

    } catch (e) {
        console.error("Error fetching context graph:", e);
        return ""; // Return empty string on error to allow process to continue without context
    }
}

/**
 * Merges a diarized transcript into the LLM backend for a specified knowledge graph.
 */
export async function mergeTranscript(graphID: string, diarizedTranscript: any): Promise<LLMParsingResult> {
    console.log("Merging transcript for graph:", graphID);

    // 1. Fetch Context (Existing Entities/Conflicts)
    const existingTTL = await fetchContextAsTTL(graphID);

    // 2. Call Node Backend to Generate New Triples
    const llmRes = await fetch(`${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? '' : ':'
        + import.meta.env.VITE_LLM_PORT}/api/feedback/transcriptionPool`, { 
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify({
            graph_id: graphID,
            diarizedTranscript: diarizedTranscript.diarized_transcription,
            existingTTL: existingTTL // Pass the context!
        })
    });

    const llmData = await llmRes.json();

    if (!llmRes.ok || llmData.error) {
        return {
            success: false,
            message: llmData.error || "LLM Generation failed"
        }
    }

    console.log("Generated TTL from Audio:", llmData.ttl);

    // 3. Upload Result to Knowledge Graph Backend (main.py /parse-pool/)
    // main.py expects: { "graph_id": "...", "ttl": "..." }
    const rdfRes = await fetch(`${import.meta.env.VITE_KNOWLEDGE_GRAPH_URL}${!import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT ? '' : ':' + import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT}/parse-pool/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            graph_id: graphID,
            ttl: llmData.ttl
        }),
    });

    if (!rdfRes.ok) {
        const errText = await rdfRes.text();
        console.error("KG Backend Error:", errText);
        return {
            success: false,
            message: "Failed to save generated triples to Graph"
        }
    }

    return {
        success: true,
        message: "Successfully merged audio transcription into graph.",
        data: llmData.ttl
    }
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