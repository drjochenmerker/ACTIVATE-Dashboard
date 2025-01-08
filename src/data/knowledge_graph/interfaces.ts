/**
 * Type for data returned by the knowledge graph
 * in order to prevent VSCode from complaining about dynamic keys
 */
export type KnowledgeGraphData = {
    [key: string]: any;
};

/**
 * Activity in the knowledge graph
 */
export interface Activity {
    label: string;
    uri: string;
}