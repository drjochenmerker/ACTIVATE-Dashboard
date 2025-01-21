import hash from "object-hash";
import { fetchSparql, getSparqlTemplate } from "./utils";
import { sparqlTemplate, writeResponse } from "./interfaces";

/**
 * Adds a new conflict to the sparql database
 * @param activity Activity as string used to generate ID
 * @param participants List of Participants used to link them to the conflict and generate an ID
 * @param author Author used to generate the ID. Multiple anonymous will lead to issues
 * @returns writeResponse Object
 */
export async function addConflict(activity: string, participants: string[], author: string): Promise<writeResponse> {
    // Create unique hash as a conflict ID
    const conflictId = hash({
        activity: activity,
        participants: participants,
        author: author
    });
    console.log(conflictId);
    // Build query dynamically using participants
    const participantString = participants.map((participant, index) => {
        console.log(index, participants.length - 1, participant)
        return `\t:hasParticipant :${participant} ${index == participants.length - 1 ? "." : ";"}`;
    }).join("\n")
    let query = await getSparqlTemplate(sparqlTemplate.insertConflict);
    const mapObj = {
        "{{conflictId}}": conflictId,
        "{{participants}}": participantString
    };
    query = query.replaceMultiple(mapObj);
    console.log(query)
    // Exeucte Query in update mode
    const data = await fetchSparql(query, true);
    return { code: data.status, status: data.status == 204 ? "OK" : "Error" } as writeResponse
}