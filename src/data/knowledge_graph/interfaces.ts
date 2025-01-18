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

export enum sparqlTemplate {
    getActivities = "getActivities",
    getActivityDetail = "getActivityDetail"
}

/**
 * Activity in the knowledge graph
 */
export interface Activity {
    uri: string;
    label: string;
}

/**
 * Action in the knowledge graph
 */
export interface Action {
    action: string;
    object: string | StringAccessObject;
}

/**
 * Object in the knowledge graph
 */
export interface Object {
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
