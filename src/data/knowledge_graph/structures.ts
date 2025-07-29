/**
 * TS Workaround for SPARQL responses
 * This is a dirty fix which prevent TS form comlaining about dynamic keys
 */
/**
 * Type for data returned by the knowledge graph
 * in order to prevent VSCode from complaining about dynamic keys
 */
export type KnowledgeGraphData = {
    [key: string]: any;
};


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
    getConflictIds = "getConflictIds",
    getConflictDetail = "getConflictDetail",
    getNestedCommentIds = "getNestedCommentIds",
    getPredicates = "getPredicates",
    addConflict = "addConflict",
    addComment = "addComment",
    addTriple = "addTriple",
    addPredicate = "addPredicate",
    deleteComment = "deleteComment",
    deleteNestedComment = "deleteNestedComment",
    deleteTriple = "deleteTriple",
    deleteTriples = "deleteTriples",
    updateConflict = "updateConflict",
    deleteConflictParticipant = "deleteConflictParticipant",
    addConflictParticipant = "addConflictParticipant",
    getMiscComments = "getMiscComments",
    addEntity = "addEntity",
    getActivityClassIds = "getActivityClassIds",
    addActivity = "addActivity",
    deleteActivity = "deleteActivity",
    getDiagramVocab = "getDiagramVocab",
    updateActivity = "updateActivity",
    cloneActivity = "cloneActivity",
}

/**
 * Activity in the knowledge graph
 */
export type Activity = {
    graph: string;
    name: string;
    description?: string;
}

/**
 * Action in the knowledge graph
 */
export type Action = {
    action: string;
    object: string | StringAccessObject;
}

/**
 * Objective in the knowledge graph
 */
export type Objective = {
    id: string,
    labels: Record<string, string>;
    type: string;
    properties: Action[];
}

/**
 * Detail of an activity in the knowledge graph
 */
export class ActivityDetail {
    [key: string]: Objective[];
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
 * Object used to save a participant
 */
export interface Participant {
    id: string,
    labels: Record<string, string>,
    type: string
}

/**
 * Conflict in the knowledge graph
 */
export type Conflict = {
    title: string,
    participants: Participant[],
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
    open = "open",
    inDiscussion = "inDiscussion",
    resolved = "resolved"
}

/**
 * Enum containing conflict predicates that can be updated
 */
export enum conflictPredicate {
    description = "ConflictDescription",
    title = "ConflictTitle",
    status = "ConflictState",
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

/**
 * Predicate type that holds all relevant information
 */
export type Predicate = {
    id: string,
    labels: StringAccessObject,
    lang?: string
}

/**
 * Language Code enum to make sure this is very accessible
 * WARNING: Should be replaced with a better solution later on
 */
export enum LanguageCode {
    Deutsch = "de",
    English = "en",
    Svenska = "sv"
}
/**
 * Scene Change Enum to allow easy switching between scenes
 */
export enum SceneChange {
    Scene1 = "Scene 1",
    Scene2 = "Scene 2"
}

/**
 * Language Label that stores the language code to a label
 * so they can easily be accessed and saved to the Vocabulary
 */
export type LanguageLabel = {
    label: string,
    language: LanguageCode
}

/**
 * Knowledge Graph Activity Classes that allow the usage of 
 * frontend access terms without messing up the backend
 */
export enum KnowledgeGraphActivityClass {
    subject = "Subject",
    object = "Object",
    rules = "Rule",
    instruments = "Instrument",
    divison_of_labour = "DivisionOfLabour",
    community = "Community"
}

/**
 * MultiLangObject that allows the usage of multiple languages
 */
export type MultiLangObject = {
    id: string,
    labels: Record<string, string>,
    value?: string
}

/**
 * NestedMultiLangObject that allows the usage of multiple languages
 */
export type NestedMultiLangObject = {
    level: string,
    values?: MultiLangObject[],
    next?: NestedMultiLangObject[]
}

/**
 * Predicate Dictionary that allows fetching all predicates
 * for a given tuple of activity diagram classes
 */
export class PredicateDict {
    private dict: Record<string, Predicate[]> = {};

    add(tuple: [string, string], obj: Predicate): void {
        if (this.dict[tuple.join("#")] === undefined) {
            this.dict[tuple.join("#")] = [];
        }
        const existingInnerObj = this.dict[tuple.join("#")].find(innerObj => innerObj.id == obj.id);
        const langString = obj.lang || "default";
        if (existingInnerObj == undefined) {
            this.dict[tuple.join("#")].push({
                id: obj.id,
                labels: { [langString]: obj.labels }
            });
        }
        else {
            existingInnerObj.labels[langString] = obj.labels;
        }
    }

    get(tuple: [string, string]): {}[] {
        return this.dict[tuple.join("#")].sort((a, b) => a.id.localeCompare(b.id)) || [];
    }

    getBidirectional(tuple: [string, string]): {} {
        return {
            given: this.dict[tuple.join("#")].sort((a, b) => a.id.localeCompare(b.id)) || [],
            reversed: this.dict[tuple.reverse().join("#")].sort((a, b) => a.id.localeCompare(b.id)) || []
        }
    }
}