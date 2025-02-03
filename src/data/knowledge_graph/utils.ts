import { KnowledgeGraphData, sparqlTemplate } from "./interfaces";

/**
 * Internal function that allows to load a SPARQL query template from the filesystem
 * @param template sparqlTemplate enum value
 * @returns A Query template as a string
 */
export async function getSparqlTemplate(template: sparqlTemplate): Promise<string> {
    const queries = import.meta.glob("./queries/*.sparql", { query: "?raw", import: "default" });
    const filepath = `./queries/${template}.sparql`;
    try {
        return await queries[filepath]() as string;
    }
    catch (e) {
        throw new Error(`Query Template ${template} not found`);
    }
}

/**
 * Internal function that fetches data from a SPARQL endpoint and handles potential errors
 * @param query SPARQL template filled already filled with values
 * @param update Flag that defines whether the query is an update or a select query
 * @returns Response from the server (update == true) or the data (update == false)
 */
export async function fetchSparql(query: string, update: boolean = false): Promise<KnowledgeGraphData> {
    const res = await fetch(`${import.meta.env.VITE_KNOWLEDGE_GRAPH_URL}:${import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT}`, {
        method: "POST",
        headers: {
            "Content-Type": update ? "application/x-www-form-urlencoded" : "application/sparql-query",
            "Accept": "application/json",
        },
        body: update ? new URLSearchParams({
            "update": query
        }) : query
    });
    const response = update ? res : (await res.json() as KnowledgeGraphData).results.bindings
    return response
}