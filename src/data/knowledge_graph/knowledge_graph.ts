import { Activity, KnowledgeGraphData } from "./interfaces";

/**
 * Internal function that allows to load a SPARQL query template from the filesystem
 * @param filename Filename of the SPARQL query
 * @returns A Query template as a string
 */
async function getSparqlTemplate(filename: string): Promise<string> {
  const queries = import.meta.glob("./queries/*.sparql", { query: "?raw", import: "default" });
  const filepath = `./queries/${filename}.sparql`;
  try {
    return await queries[filepath]() as string;
  }
  catch (e) {
    throw new Error(`Query Template ${filename} not found`);
  }
}

/**
 * Fetches all activities from the knowledge graph
 * @param lang Language to fetch the activities in
 * @returns A list of Activity objects
 */
export async function getActivities(lang: string = "de"): Promise<Activity[]> {
  let query = await getSparqlTemplate("getActivities");
  query = query.replace("{{lang}}", lang);
  const res = await fetch(`${import.meta.env.VITE_KNOWLEDGE_GRAPH_URL}:${import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/sparql-query",
      "Accept": "application/json",
    },
    body: query,
  });
  const json = await res.json();
  const parsedJson = json.results.bindings.map((activity: KnowledgeGraphData) => {
    return {
      label: activity.label.value,
      uri: activity.activity.value,
    } as Activity
  });
  return parsedJson;
}