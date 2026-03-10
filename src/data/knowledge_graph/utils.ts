import type { Comment, Conflict, MultiLangObject, NestedMultiLangObject, RDFTriple, sparqlTemplate, StringAccessObject } from "./structures";

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
    const res = await fetch(`${import.meta.env.VITE_KNOWLEDGE_GRAPH_URL}${!import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT ? '' : ':' + import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT}`, {

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
    const umlautRegex = /^[A-Za-z0-9äöüßÄÖÜ]+$/;
    const camelCaseRegex = /^[A-Za-zäöüßÄÖÜ]+(?:[A-Z0-9][a-z0-9äöüß]*)*$/;

    if (typeof input == "string") {
        if (!umlautRegex.test(input)) return false;
        if (input.includes(" ")) return false;
        return camelCaseRegex.test(input);
    } else {
        for (const [_, value] of Object.entries(input)) {
            if (!umlautRegex.test(value)) return false;
            if (value.includes(" ")) return false;
            if (!camelCaseRegex.test(value)) return false;
        }
    }
    return true;
}

export function CapitalizeFirstLetter(input: string): string {
    return input.charAt(0).toUpperCase() + input.slice(1);
}

export function EscapeSparqlStringLiteral(input: string): string {
    return input
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

// function pushNestedValue(obj: NestedMultiLangObject, nestingPath: string[], newValue: MultiLangObject): void {
//     // Case 1: empty nestingPath
//     if (nestingPath.length == 0) {
//         !obj.values ? obj.values = [newValue] : obj.values.push(newValue);
//         return;
//     }
//     // Case 2 nestingPath not empty
//     let currentObj: NestedMultiLangObject = obj;
//     for (const levelPath of nestingPath) {
//         !currentObj.next ? currentObj.next = [] : null;
//         // Find next level object
//         let nextLevelObj = currentObj.next.find((item) => item.level == levelPath);
//         if (nextLevelObj) {
//             currentObj = nextLevelObj;
//         }
//         else {
//             const newLevelObj = { level: levelPath };
//             currentObj.next.push(newLevelObj);
//             currentObj = newLevelObj;
//         }
//     }
//     if (!currentObj.values) {
//         currentObj.values = [];
//     }
//     currentObj.values.push(newValue);
// }
function pushNestedValue(
    root: NestedMultiLangObject,
    path: string[],
    value: MultiLangObject
) {
    let current = root;

    for (const segment of path) {
        if (!current.next) current.next = [];

        let nextNode = current.next.find((n) => n.level === segment);
        if (!nextNode) {
            nextNode = { level: segment, values: [], next: [] };
            current.next.push(nextNode);
        }

        current = nextNode;
    }

    if (!current.values) current.values = [];
    current.values.push(value);
}

function sortNestedAlphanumeric(node: NestedMultiLangObject): void {
    if (node.next && node.next.length > 0) {
        node.next.sort((a, b) =>
            a.level.localeCompare(b.level, undefined, { numeric: true, sensitivity: "base" })
        );
        node.next.forEach(sortNestedAlphanumeric);
    }
    if (node.values && node.values.length > 0) {
        node.values.sort((a, b) => {
            const labelA = Object.values(a.labels)[0] ?? "";
            const labelB = Object.values(b.labels)[0] ?? "";
            return labelA.localeCompare(labelB, undefined, { numeric: true, sensitivity: "base" });
        });
    }
}

// export function buildTreeStructByLang(input: MultiLangObject[] | Objective[], lang: string): NestedMultiLangObject {
//     const result: NestedMultiLangObject = { level: "root" };
//     for (const item of input) {
//         const label = item.labels[lang] || item.labels["default"] || Object.values(item.labels)[0];
//         const nestingPath = label.split("/");
//         const finalValue = nestingPath.pop();
//         const currentObj: MultiLangObject = {
//             id: item.id,
//             labels: {},
//             value: finalValue
//         };
//         pushNestedValue(result, nestingPath, currentObj);
//     }
//     return result;
// }
export function buildTreeStructByLang(
    input: MultiLangObject[],
    lang: string
): NestedMultiLangObject {
    const result: NestedMultiLangObject = { level: "root", values: [], next: [] };

    for (const item of input) {
        const label =
            item.labels[lang] ||
            item.labels["default"] ||
            Object.values(item.labels)[0];

        const nestingPath = label.split("/");
        //const finalValue = nestingPath.pop(); // e.g., "Doctor" from "Medical/Doctor"

        const currentObj: MultiLangObject = {
            id: item.id,
            labels: item.labels,
            value: "",
        };

        pushNestedValue(result, nestingPath, currentObj);
    }

    sortNestedAlphanumeric(result);

    return result;
}