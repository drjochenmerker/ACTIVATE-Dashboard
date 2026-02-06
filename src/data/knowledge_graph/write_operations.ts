import hash from "object-hash";
import {
    CapitalizeFirstLetter,
    fetchSparql,
    getSparqlTemplate,
    RDFSyntaxCheck,
    EscapeSparqlStringLiteral,
} from "./utils";
import {
    Activity,
    Conflict,
    conflictPredicate,
    conflictStatus,
    KnowledgeGraphActivityClass,
    LanguageCode,
    LanguageLabel,
    RDFOperation,
    RDFTriple,
    sparqlTemplate,
    updateResponse,
} from "./structures";
import { useSessionStore } from "@/stores/sessionStore";

/**
 * Adds a new conflict to the sparql database
 * @param activity Activity as string used to generate ID
 * @param participants List of Participants used to link them to the conflict and generate an ID
 * @param author Author used to generate the ID. Multiple anonymous will lead to issues
 * @param status Status of the new conflict
 * @returns updateResponse Object
 */
export async function addConflict(graph: string, conflict: Conflict): Promise<updateResponse> {
    // Create unique hash as a conflict ID
    const timestamp = new Date().toISOString();
    const conflictId = hash({
        participants: conflict.participants,
        author: conflict.author,
        created: timestamp,
    });
    // Build query dynamically using participants
    const participantString = conflict.participants
        .map((participant) => {
            return `\t\t:HasParticipant :${participant.id} ;`;
        })
        .join("\n");
    let query = await getSparqlTemplate(sparqlTemplate.addConflict);
    const mapObj = {
        "{{graph}}": graph,
        "{{conflictId}}": conflictId,
        "{{participants}}": participantString,
        "{{description}}": conflict.description
            ? EscapeSparqlStringLiteral(getStringFromRecord(conflict.description))
            : "",
        // "{{author}}": EscapeSparqlStringLiteral(getStringFromRecord(conflict.author.id)),
        "{{author}}": "",
        "{{status}}": conflict.status,
        "{{created}}": timestamp,
        "{{title}}": EscapeSparqlStringLiteral(getStringFromRecord(conflict.title)),
    };
    query = query.replaceMultiple(mapObj);
    // Exeucte Query in update mode
    const data = await fetchSparql(query, true);
    return {
        code: data.status,
        status: data.status == 204 ? "OK" : "Error",
        modified: conflictId,
        action: RDFOperation.insert,
    } as updateResponse;
}

/**
 * Deletes a conflict and all nested comments
 * @param conflictId
 * @returns
 */
export async function deleteConflict(graph: string, conflictId: string): Promise<updateResponse> {
    // Fetch all nested commentIDs related to conflictId
    let commentQuery = await getSparqlTemplate(sparqlTemplate.getNestedCommentIds);
    const commentMapObj = {
        "{{graph}}": graph,
        "{{conflict}}": conflictId,
    };
    commentQuery = commentQuery.replaceMultiple(commentMapObj);
    const commentIds = (await fetchSparql(commentQuery, false)).map((res: any) => {
        return res.s.value ? res.s.value.split("#").pop() : null;
    });
    // Remove Conflict
    const deleteQueryBase = await getSparqlTemplate(sparqlTemplate.deleteTriples);
    const mapObj = {
        "{{graph}}": graph,
        "{{subject}}": conflictId,
    };
    const deleteQuery = deleteQueryBase.replaceMultiple(mapObj);
    const data = await fetchSparql(deleteQuery, true);
    // Delete all nested comments
    for (const id of commentIds) {
        const innerMapObj = {
            "{{graph}}": graph,
            "{{subject}}": id,
        };
        const innerQuery = deleteQueryBase.replaceMultiple(innerMapObj);
        await fetchSparql(innerQuery, true);
    }
    return {
        code: data.status,
        status: data.status == 204 ? "OK" : "Error",
        modified: conflictId,
        action: RDFOperation.delete,
    } as updateResponse;
}

/**
 * Updates an existing conflict with new information. Can be used to update the status, description and title of a conflict
 * Warning: Does not check whether a conflict ID exists. Could be used to fill the database with irrelevant data
 * @param conflictId
 * @param predicate
 * @param newValue
 * @returns updateResponse Object
 */
export async function updateConflict(
    graph: string,
    conflictId: string,
    predicate: conflictPredicate,
    newValue: conflictStatus | string,
): Promise<updateResponse> {
    let query = await getSparqlTemplate(sparqlTemplate.updateConflict);
    const mapObj = {
        "{{graph}}": graph,
        "{{conflictId}}": conflictId,
        "{{predicate}}": predicate,
        "{{newValue}}": EscapeSparqlStringLiteral(newValue),
    };
    query = query.replaceMultiple(mapObj);
    const data = await fetchSparql(query, true);
    return {
        code: data.status,
        status: data.status == 204 ? "OK" : "Error",
        modified: conflictId,
        action: RDFOperation.insert,
    } as updateResponse;
}

export async function updateConflictParticipants(
    graph: string,
    conflictId: string,
    operation: RDFOperation,
    participantId: string,
): Promise<updateResponse> {
    let query =
        operation == RDFOperation.insert
            ? await getSparqlTemplate(sparqlTemplate.addConflictParticipant)
            : await getSparqlTemplate(sparqlTemplate.deleteConflictParticipant);
    const mapObj = {
        "{{graph}}": graph,
        "{{conflictId}}": conflictId,
        "{{participantId}}": participantId,
    };
    query = query.replaceMultiple(mapObj);
    const data = await fetchSparql(query, true);
    return {
        code: data.status,
        status: data.status == 204 ? "OK" : "Error",
        modified: conflictId,
        action: RDFOperation.insert,
    } as updateResponse;
}

/**
 * Adds a comment to a conflict or another comment
 * @param parentId Id of the parent element. Can be a conflict id, another comment id or "root" for parentless comments
 * @param comment Comment as string
 * @returns
 */
export async function addComment(parentId: string, comment: string): Promise<updateResponse> {
    const sessionStore = useSessionStore();
    const graph = sessionStore.sessionActivity!.graph;
    const author = sessionStore.sessionRole || "";

    // Create unique hash as a conflict ID
    const timestamp = new Date().toISOString();
    const commentId = hash({
        conflictId: parentId,
        author: author,
        comment: comment,
        created: timestamp,
    });

    let query = await getSparqlTemplate(sparqlTemplate.addComment);
    const mapObj = {
        "{{graph}}": graph,
        "{{author}}": EscapeSparqlStringLiteral(author),
        "{{commentId}}": commentId,
        "{{comment}}": EscapeSparqlStringLiteral(comment),
        "{{created}}": timestamp,
        "{{parentId}}": parentId,
        "{{langTag}}": sessionStore.activeLanguage,
    };
    query = query.replaceMultiple(mapObj);
    // Exeucte Query in update mode
    const data = await fetchSparql(query, true);
    return {
        code: data.status,
        status: data.status == 204 ? "OK" : "Error",
        modified: commentId,
        action: RDFOperation.insert,
    } as updateResponse;
}

/**
 * Deletes a comment from the knowledge graph. If the comment is a nested comment, the author and the content of
 * the original comment will be overwritten to prevent nested comments from being orphaned
 * @param commentId
 * @param isNestedComment
 * @returns updateResponse Object
 */
export async function deleteComment(
    graph: string,
    commentId: string,
    isNestedComment: boolean,
): Promise<updateResponse> {
    let query = "";
    if (isNestedComment) {
        query = await getSparqlTemplate(sparqlTemplate.deleteNestedComment);
    } else {
        query = await getSparqlTemplate(sparqlTemplate.deleteComment);
    }
    const mapObj = {
        "{{graph}}": graph,
        "{{commentId}}": commentId,
    };
    query = query.replaceMultiple(mapObj);
    const data = await fetchSparql(query, true);
    return {
        code: data.status,
        status: data.status == 204 ? "OK" : "Error",
        modified: commentId,
        action: RDFOperation.delete,
    } as updateResponse;
}

/**
 * Add a triple with new information to the knowledge graph
 * @param triple
 * @returns updateResponse Object
 */
export async function updateTriple(graph: string, triple: RDFTriple, operation: RDFOperation): Promise<updateResponse> {
    // Check if triple is legit
    if (RDFSyntaxCheck(triple) == false)
        return {
            code: 400,
            status: "Error",
            modified: Object.values(triple).join(" "),
            action: operation,
        } as updateResponse;
    let query =
        operation === "insert"
            ? await getSparqlTemplate(sparqlTemplate.addTriple)
            : await getSparqlTemplate(sparqlTemplate.deleteTriple);
    const mapObj = {
        "{{graph}}": graph,
        "{{subject}}": triple.subject,
        "{{predicate}}": triple.predicate,
        "{{object}}": triple.object,
    };
    query = query.replaceMultiple(mapObj);
    // Exeucte Query in update mode
    const data = await fetchSparql(query, true);
    return {
        code: data.status,
        status: data.status == 204 ? "OK" : "Error",
        modified: Object.values(triple).join(" "),
        action: operation,
    } as updateResponse;
}

/**
 * Adds a new predicate to the vocabulary
 * @param graph Graph in which the predicate should be added
 * @param predicate New Predicate indentifier as string
 * @param domains List of classes that can be used as domain (subject of rdf triple)
 * @param ranges List of classes that can be used as range (object of rdf triple)
 * @param labels Description of predicate in multiple languages
 * @returns updateResponse Object
 */
export async function addPredicate(
    graph: string,
    predicate: string,
    domains: KnowledgeGraphActivityClass[],
    ranges: KnowledgeGraphActivityClass[],
    labels: LanguageLabel[],
): Promise<updateResponse> {
    if (RDFSyntaxCheck(predicate) == false)
        return { code: 400, status: "Error", modified: predicate, action: RDFOperation.insert } as updateResponse;
    let query = await getSparqlTemplate(sparqlTemplate.addPredicate);
    const labelString = labels
        .map((label) => {
            return `"${label.label}"@${label.language}`;
        })
        .join(", ");
    const stringDomains = domains.map((domain) => ":" + domain);
    const stringRanges = ranges.map((range) => ":" + range);
    const mapObj = {
        "{{graph}}": graph,
        "{{label}}": CapitalizeFirstLetter(predicate),
        "{{domains}}": stringDomains.join(", "),
        "{{ranges}}": stringRanges.join(", "),
        "{{labels}}": labelString,
    };
    query = query.replaceMultiple(mapObj);
    const data = await fetchSparql(query, true);
    return {
        code: data.status,
        status: data.status == 204 ? "OK" : "Error",
        modified: predicate,
        action: RDFOperation.insert,
    } as updateResponse;
}

/**
 * Adds a new entity to the knowledge graph
 * @param graph Graph in which the entity should be added
 * @param entity Entity to be added
 * @param activityClass Activity class of the entity
 * @returns UpdateResponse Object
 */
export async function addEntity(
    graph: string,
    entityLabel: string,
    activityClass: KnowledgeGraphActivityClass,
    language: LanguageCode,
): Promise<updateResponse> {
    let query = await getSparqlTemplate(sparqlTemplate.addEntity);
    const entityId = hash({
        entityName: entityLabel,
        timestamp: new Date().toISOString(),
        activityClass: activityClass,
        graph: graph,
    });
    const mapObj = {
        "{{graph}}": graph,
        "{{entityId}}": entityId,
        "{{entity}}": EscapeSparqlStringLiteral(CapitalizeFirstLetter(entityLabel.trim())),
        "{{activityClass}}": activityClass,
        "{{lang}}": language,
    };
    query = query.replaceMultiple(mapObj);
    const data = await fetchSparql(query, true);
    return {
        code: data.status,
        status: data.status == 204 ? "OK" : "Error",
        modified: entityLabel,
        action: RDFOperation.insert,
    } as updateResponse;
}

/**
 * Adds a new activity to the knowledge graph
 * @param activityName Name of the activity. This will also be parsed into the indentifer and the graph name
 * @param activityDescription Description of the new activity
 * @returns UpdateResponse Object
 */
// export async function addActivity(activityName: string, activityDescription: string): Promise<updateResponse> {
export async function addActivity(activityName: string): Promise<updateResponse> {
    // let query = await getSparqlTemplate(sparqlTemplate.addActivity);
    // const graphID = EscapeSparqlStringLiteral(CapitalizeFirstLetter(activityName.trim().replaceAll(" ", "_")));
    // const activityID = EscapeSparqlStringLiteral(CapitalizeFirstLetter(activityName.trim().replaceAll(" ", "")));
    // activityName = EscapeSparqlStringLiteral(CapitalizeFirstLetter(activityName.trim()));
    // const mapObj = {
    //     "{{graphName}}": graphID,
    //     "{{identifier}}": activityID,
    //     "{{descriptions}}": `"${EscapeSparqlStringLiteral(activityDescription)}"`,
    //     "{{name}}": activityName
    // }
    // query = query.replaceMultiple(mapObj);
    // const data = await fetchSparql(query, true);
    // return { code: data.status, status: data.status == 204 ? "OK" : "Error", modified: graphID, action: RDFOperation.insert } as updateResponse;
    // TODO handle adding of activities
    return {
        code: 501,
        status: "Not Implemented",
        modified: activityName,
        action: RDFOperation.insert,
    } as updateResponse;
}

/**
 * Irreversibly deletes an activity from the knowledge graph
 * @param graph graph of the activity
 * @returns UpdateResponse Object
 */
export async function deleteActivity(graph: string): Promise<updateResponse> {
    let query = await getSparqlTemplate(sparqlTemplate.deleteActivity);
    query = query.replace("{{graph}}", graph);
    const data = await fetchSparql(query, true);
    return {
        code: data.status,
        status: data.status == 204 ? "OK" : "Error",
        modified: graph,
        action: RDFOperation.insert,
    } as updateResponse;
}

/**
 * Updates the name and description of an activity in the knowledge graph
 * @param graph graph of the activity
 * @param activity Activity object containing changes
 * @returns updateResponse Object
 */
export async function updateActivity(activity: Activity): Promise<updateResponse> {
    // let query = await getSparqlTemplate(sparqlTemplate.updateActivity);
    // const mapObj = {
    //     "{{graph}}": activity.graph,
    //     // "{{activityName}}": EscapeSparqlStringLiteral(getStringFromRecord(activity.name)),
    //     "{{activityName}}": EscapeSparqlStringLiteral(activity.name),
    //     "{{activityDescription}}": activity.description ? EscapeSparqlStringLiteral(getStringFromRecord(activity.description)) : "No description given",
    // }
    // query = query.replaceMultiple(mapObj);
    // const data = await fetchSparql(query, true);
    // return { code: data.status, status: data.status == 204 ? "OK" : "Error", modified: activity.graph, action: RDFOperation.insert } as updateResponse;
    // TODO handle updating of activities
    return { code: 501, status: "Not Implemented", modified: activity.graph } as updateResponse;
}

/**
 * Clones an existing activity
 * @param activity Activity object containing the old graph identifier as well as optionallly a new name and description
 * @returns updateResponse Object
 */
export async function cloneActivity(activity: Activity): Promise<updateResponse> {
    // Handle missing props
    // // todo
    // if (activity.name.trim() == "") activity.name = activity.graph + "_copy";
    // if (activity.description?.trim() == "") activity.description = "No description given";
    // // Clone activity
    // let query = await getSparqlTemplate(sparqlTemplate.cloneActivity);
    // const cloneHash = hash(activity)
    // const newGraphID = EscapeSparqlStringLiteral(CapitalizeFirstLetter(activity.name.trim().replaceAll(" ", "_") + "_" + cloneHash))
    // const mapObj = {
    //     "{{graph}}": activity.graph,
    //     "{{newName}}": newGraphID
    // }
    // query = query.replaceMultiple(mapObj);
    // const data = await fetchSparql(query, true);
    // // Update name and description
    // await updateActivity({
    //     graph: newGraphID,
    //     name: activity.name,
    //     description: activity.description
    // });
    // return { code: data.status, status: data.status == 204 ? "OK" : "Error", modified: activity.graph, action: RDFOperation.insert } as updateResponse;
    // TODO handle cloning of activities
    return {
        code: 501,
        status: "Not Implemented",
        modified: activity.graph,
        action: RDFOperation.insert,
    } as updateResponse;
}

function getStringFromRecord(record: Record<string, string>, lang = "en"): string {
    return record[lang] || Object.values(record)[0] || "";
}
