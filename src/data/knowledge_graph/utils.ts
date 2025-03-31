import type { Comment, Conflict, RDFTriple, sparqlTemplate, StringAccessObject } from "./structures";

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
export async function fetchSparql(query: string, update: boolean = false): Promise<StringAccessObject> {
    const res = await fetch(`${import.meta.env.VITE_KNOWLEDGE_GRAPH_URL}`, {
        method: "POST",
        headers: {
            "Content-Type": update ? "application/x-www-form-urlencoded" : "application/sparql-query",
            "Accept": "application/json",
        },
        body: update ? new URLSearchParams({
            "update": query
        }) : query
    });
    const response = update ? res : (await res.json() as StringAccessObject).results.bindings;
    return response;
}

/**
 * Finds all comments that are nested in a conflict
 * @param commentId Comment id to search nested comments for in conflict
 * @param input Conflict or Comment object to search in
 * @returns nested Comment or undefined if nothing was found
 */
export function findNestedComment(commentId: string, input: Conflict | Comment[]): Comment | undefined {
    let searchArray: any;
    if (Array.isArray(input)) {
        searchArray = input;
    }
    else {
        searchArray = input.replies;
    }
    for (const reply of searchArray) {
        // console.log("Nested Search on", input, "for", commentId, "on", reply);
        const nestedReply = findNestedCommentR(commentId, reply);
        if (nestedReply) {
            return nestedReply;
        }
    }
    return undefined;
}

// Recursive part of nested comment search
function findNestedCommentR(commentId: string, comment: Comment): Comment | undefined {
    const replyIndex = comment.replies?.find(reply => reply.id == commentId);
    // console.log("Nested Search for", commentId, "in", comment.replies, "found", replyIndex);
    if (replyIndex) {
        return replyIndex;
    }
    for (const reply of comment.replies ?? []) {
        const nestedReply = findNestedCommentR(commentId, reply);
        if (nestedReply) {
            return nestedReply;
        }
    }
    return undefined;
}

/**
 * Changes string in CamelCase to snake_case
 * @param str input
 * @returns output string
 */
export function camelToSnakeCase(str: string) {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

/**
 * Checks if the input syntax of a RDF Triple or a string is correct
 * @param input 
 * @returns 
 */
export function RDFSyntaxCheck(input: RDFTriple | string): boolean {
    if (typeof input == "string") {
        if (!/^[A-Za-z0-9]+$/.test(input)) return false;
        if (input.includes(" ")) return false;
        return /^[A-Za-z]+(?:[A-Z0-9][a-z0-9]*)*$/.test(input);
    }
    else {
        for (const [_, value] of Object.entries(input)) {
            if (!/^[A-Za-z0-9]+$/.test(value)) return false;
            if (value.includes(" ")) return false;
            if (!/^[A-Za-z]+(?:[A-Z0-9][a-z0-9]*)*$/.test(value)) return false;
        }
    }
    return true;
}

export function CapitalizeFirstLetter(input: string): string {
    return input.charAt(0).toUpperCase() + input.slice(1);
}