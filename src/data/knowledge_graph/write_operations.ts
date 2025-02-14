import hash from "object-hash";
import { fetchSparql, getSparqlTemplate } from "./utils";
import { Conflict, RDFOperation, RDFTriple, sparqlTemplate, updateResponse } from "./structures";

/**
 * Adds a new conflict to the sparql database
 * @param activity Activity as string used to generate ID
 * @param participants List of Participants used to link them to the conflict and generate an ID
 * @param author Author used to generate the ID. Multiple anonymous will lead to issues
 * @param status Status of the new conflict
 * @returns updateResponse Object
 */
export async function addConflict(conflict: Conflict): Promise<updateResponse> {
    // Create unique hash as a conflict ID
    const timestamp = new Date().toISOString();
    const conflictId = hash({
        activity: conflict.activity,
        participants: conflict.participants,
        author: conflict.author,
        created: timestamp
    });
    // Build query dynamically using participants
    const participantString = conflict.participants.map(participant => {
        return `\t:hasParticipant :${participant} ;`;
    }).join("\n")
    let query = await getSparqlTemplate(sparqlTemplate.addConflict);
    const mapObj = {
        "{{conflictId}}": conflictId,
        "{{participants}}": participantString,
        "{{description}}": conflict.description ? conflict.description : "",
        "{{activity}}": conflict.activity,
        "{{author}}": conflict.author,
        "{{status}}": conflict.status,
        "{{created}}": timestamp,
        "{{title}}": conflict.title
    };
    query = query.replaceMultiple(mapObj);
    // Exeucte Query in update mode
    const data = await fetchSparql(query, true);
    return { code: data.status, status: data.status == 204 ? "OK" : "Error", modified: conflictId, action: RDFOperation.insert } as updateResponse
}

/**
 * Function that deletes a conflict and all nested comments. Currently doesn't work
 * properly due to the testing sparql solution being a piece of shit that doesn't accept
 * any solution I tried and me refusing to delete everything triple by triple. Nested comments
 * will remain in the RDF-Triple-Store as of now without any references to them wasting memory
 * @param conflictId 
 * @returns 
 */
export async function deleteConflict(conflictId: string): Promise<updateResponse> {
    // let query = await getSparqlTemplate(sparqlTemplate.getNestedCommentIds);
    // query = query.replace("{{conflict}}", conflictId);
    // const commentIds = await fetchSparql(query, false);
    let query = await getSparqlTemplate(sparqlTemplate.deleteTriples);
    query = query.replace("{{subject}}", conflictId)
    const data = await fetchSparql(query, true)
    // let tripleString = `\t"${conflictId}",`;
    // for (let id in commentIds) {
    //     tripleString += `"${commentIds[id].s.value.split("/").pop()}",\n`;
    // }
    // query = query.replace("{{tripleString}}", tripleString.slice(0, -2));
    return { code: data.status, status: data.status == 204 ? "OK" : "Error", modified: conflictId, action: RDFOperation.delete } as updateResponse
}

/**
 * Adds a comment to a conflict or another comment
 * @param parentId Id of the parent element. Can either be a conflict id or another comment id
 * @param author Author of the comment
 * @param comment Comment as string
 * @returns 
 */
export async function addComment(parentId: string, author: string, comment: string): Promise<updateResponse> {
    // Create unique hash as a conflict ID
    const timestamp = new Date().toISOString();
    const commentId = hash({
        conflictId: parentId,
        author: author,
        comment: comment,
        created: timestamp
    });
    let query = await getSparqlTemplate(sparqlTemplate.addComment);
    const mapObj = {
        "{{author}}": author,
        "{{commentId}}": commentId,
        "{{comment}}": comment,
        "{{created}}": timestamp,
        "{{parentId}}": parentId
    };
    query = query.replaceMultiple(mapObj);
    // Exeucte Query in update mode
    const data = await fetchSparql(query, true);
    return { code: data.status, status: data.status == 204 ? "OK" : "Error", modified: commentId, action: RDFOperation.insert } as updateResponse
}

/**
 * Deletes a comment from the knowledge graph. If the comment is a nested comment, the author and the content of
 * the original comment will be overwritten to prevent nested comments from being orphaned
 * @param commentId 
 * @param isNestedComment 
 * @returns updateResponse Object
 */
export async function deleteComment(commentId: string, isNestedComment: boolean): Promise<updateResponse> {
    let query = "";
    if (isNestedComment) {
        query = await getSparqlTemplate(sparqlTemplate.deleteNestedComment);
    }
    else {
        query = await getSparqlTemplate(sparqlTemplate.deleteComment);
    }
    query = query.replaceAll("{{commentId}}", commentId);
    const data = await fetchSparql(query, true);
    return { code: data.status, status: data.status == 204 ? "OK" : "Error", modified: commentId, action: RDFOperation.delete } as updateResponse
}

/**
 * Add a triple with new information to the knowledge graph
 * @param triple 
 * @returns updateResponse Object
 */
export async function updateTriple(triple: RDFTriple, operation: RDFOperation): Promise<updateResponse> {
    let query = operation === "insert"
        ? await getSparqlTemplate(sparqlTemplate.addTriple)
        : await getSparqlTemplate(sparqlTemplate.deleteTriple);
    const mapObj = {
        "{{subject}}": triple.subject,
        "{{predicate}}": triple.predicate,
        "{{object}}": triple.object
    };
    query = query.replaceMultiple(mapObj);
    // Exeucte Query in update mode
    const data = await fetchSparql(query, true);
    return { code: data.status, status: data.status == 204 ? "OK" : "Error", modified: Object.values(triple).join(" "), action: operation } as updateResponse
}