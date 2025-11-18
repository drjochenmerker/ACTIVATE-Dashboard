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

export async function mergeTranscript(graphID: string, diarizedTranscript: any): Promise<LLMParsingResult> {
    console.log("Merging transcript for graph:", graphID);
    try {
        const mergeRes = await fetch(`${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? '' : ':' + import.meta.env.VITE_LLM_PORT}/api/feedback/transcriptionPool`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                graph_id: graphID,
                diarizedTranscript: diarizedTranscript.diarized_transcription,
            })
        });
        try {

            const data = await mergeRes.json();
            console.log("Merge response data:", data);
            return {
                success: true,
                message: "backend called",
            }
        } catch (jsonError) {
            console.error("Error parsing JSON response:", jsonError);
        }

        return {
            success: true,
            message: "Successfully called backend",

        }
    } catch(error){
        console.log("Error merging transcript:", error);
        return {
            success: false,
            message: "Failed to upload pooled TTL"
        }
    }
    
}