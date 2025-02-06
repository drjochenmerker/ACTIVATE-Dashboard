/**
 * Type for data returned by the knowledge graph
 * in order to prevent VSCode from complaining about dynamic keys
 */
export type KnowledgeGraphData = {
    [key: string]: any;
};

/**
 * TS Workaround for SPARQL responses
 * This is a dirty fix which prevent TS form comlaining about dynamic keys
 */
export type StringAccessObject = {
    [key: string]: any;
}

/**
 * Enum containing all available SPARQL templates
 */
export enum sparqlTemplate {
    getActivities = "getActivities",
    getActivityDetail = "getActivityDetail",
    getExampleActivity = "getExampleActivity",
    getConflictDetail = "getConflictDetail",
    insertConflict = "insertConflict",
    deleteConflict = "deleteConflict",
    updateConflict = "updateConflict",
    insertComment = "insertComment",
    deleteComment = "deleteComment",
    updateComment = "updateComment",
    insertTriple = "insertTriple",
    removeTriple = "removeTriple"
}

/**
 * Activity in the knowledge graph
 */
export type Activity = {
    uri: string;
    label: string;
}

/**
 * Action in the knowledge graph
 */
export type Action = {
    action: string;
    object: string | StringAccessObject;
}

/**
 * Object in the knowledge graph
 */
export type Object = {
    label: string;
    type: string;
    actions: Set<string>;
    properties: Action[];
}

/**
 * Detail of an activity in the knowledge graph
 */
export class ActivityDetail {
    [key: string]: Object[] | boolean;
}

/**
 * Response object of a update operation on sparql
 */
export interface updateResponse {
    code: number,
    status: string,
    modified: string,
    action: RDFOperation
}

/**
 * Conflict in the knowledge graph
 */
export type Conflict = {
    activity: string,
    title: string,
    participants: string[],
    author: string,
    status: conflictStatus,
    description?: string,
    timestamp?: Date,
    replies?: Comment[],
    id?: string
}

/**
 * Comment in the knowledge graph
 */
export type Comment = {
    id: string,
    author?: string,
    comment?: string,
    timestamp?: Date,
    replies?: Comment[]
}

/**
 * Enum for conflict status management
 */
export enum conflictStatus {
    open = "Open",
    inDiscussion = "InDiscussion",
    resolved = "Resolved"
}

/**
 * Interface for a subject, predicate, object triple
 * Note: The used terms refer to the RDF terminology, not the Activity diagram terminology
 */
export type RDFTriple = {
    subject: string,
    predicate: string,
    object: string
}

/**
 * Enum for RDF operations
 */
export enum RDFOperation {
    insert = "insert",
    delete = "delete"
}