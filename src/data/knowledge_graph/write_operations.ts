import hash from "object-hash";
import { fetchSparql, getSparqlTemplate } from "./utils";
import { conflictStatus, sparqlTemplate, writeResponse } from "./interfaces";

/**
 * Adds a new conflict to the sparql database
 * @param activity Activity as string used to generate ID
 * @param participants List of Participants used to link them to the conflict and generate an ID
 * @param author Author used to generate the ID. Multiple anonymous will lead to issues
 * @param status Status of the new conflict
 * @returns writeResponse Object
 */
export async function addConflict(activity: string, participants: string[], author: string, status: conflictStatus): Promise<writeResponse> {
    // Create unique hash as a conflict ID
    const timestamp = new Date().toISOString();
    const conflictId = hash({
        activity: activity,
        participants: participants,
        author: author,
        created: timestamp
    });
    // Build query dynamically using participants
    const participantString = participants.map(participant => {
        return `\t:hasParticipant :${participant} ;`;
    }).join("\n")
    let query = await getSparqlTemplate(sparqlTemplate.insertConflict);
    const mapObj = {
        "{{conflictId}}": conflictId,
        "{{participants}}": participantString,
        "{{author}}": author,
        "{{status}}": status,
        "{{created}}": timestamp
    };
    query = query.replaceMultiple(mapObj);
    // Exeucte Query in update mode
    const data = await fetchSparql(query, true);
    return { code: data.status, status: data.status == 204 ? "OK" : "Error", added: conflictId } as writeResponse
}

/**
 * 
 * @param parentId Id of the parent element. Can either be a conflict id or another comment id
 * @param author Author of the comment
 * @param comment Comment as string
 * @returns 
 */
export async function addComment(parentId: string, author: string, comment: string): Promise<writeResponse> {
    // Create unique hash as a conflict ID
    const timestamp = new Date().toISOString();
    const commentId = hash({
        conflictId: parentId,
        author: author,
        comment: comment,
        created: timestamp
    });
    let query = await getSparqlTemplate(sparqlTemplate.insertComment);
    const mapObj = {
        "{{commentId}}": commentId,
        "{{comment}}": comment,
        "{{created}}": timestamp,
        "{{parentId}}": parentId
    };
    query = query.replaceMultiple(mapObj);
    // Exeucte Query in update mode
    const data = await fetchSparql(query, true);
    return { code: data.status, status: data.status == 204 ? "OK" : "Error", added: commentId } as writeResponse
}