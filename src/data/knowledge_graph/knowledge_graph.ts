import { Action, Activity, ActivityDetail, KnowledgeGraphData, sparqlTemplate, StringAccessObject } from "./interfaces";

/**
 * Internal function that allows to load a SPARQL query template from the filesystem
 * @param template sparqlTemplate enum value
 * @returns A Query template as a string
 */
async function getSparqlTemplate(template: sparqlTemplate): Promise<string> {
  const queries = import.meta.glob("./queries/*.sparql", { query: "?raw", import: "default" });
  const filepath = `./queries/${template}.sparql`;
  try {
    return await queries[filepath]() as string;
  }
  catch (e) {
    throw new Error(`Query Template ${template} not found`);
  }
}

async function fetchSparql(query: string): Promise<KnowledgeGraphData> {
  const res = await fetch(`${import.meta.env.VITE_KNOWLEDGE_GRAPH_URL}:${import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/sparql-query",
      "Accept": "application/json",
    },
    body: query,
  });
  const json = await res.json() as KnowledgeGraphData;
  return json.results.bindings;
}

/**
 * Fetches all activities from the knowledge graph
 * @param lang Language to fetch the activities in
 * @returns A list of Activity objects
 */
export async function getActivities(lang: string = "de"): Promise<Activity[]> {
  let query = await getSparqlTemplate(sparqlTemplate.getActivities);
  query = query.replace("{{language}}", lang);
  const data = await fetchSparql(query);
  const parsedData = data.map((triple: KnowledgeGraphData) => {
    return {
      uri: triple.activity.value,
      label: triple.label.value,
    } as Activity
  });
  return parsedData;
}

/**
 * Fetches all Details for a given activity and
 * returns them as a ActivityDetail object WITHOUT further
 * information about the objects of the actions
 * @param activity Activity to fetch the details for 
 * @param lang Language to fetch the details in
 * @returns Activity details as an object
 */
export async function getActivityDetail(activity: Activity, lang: string = "de"): Promise<ActivityDetail> {
  let query = await getSparqlTemplate(sparqlTemplate.getActivityDetail);
  const mapObj = { "{{activity}}": activity.uri.split("/").pop() || "", "{{language}}": lang };
  query = query.replaceMultiple(mapObj);
  const data = await fetchSparql(query);
  let activityDetail = {} as ActivityDetail;
  data.map((triple: KnowledgeGraphData) => {
    let label = triple.label.value.split("/").pop();
    // TODO Misunderstanding of Division of Labour?
    activityDetail["divisionOfLabour"] = false;
    if (label.toLowerCase() != "owl#class") {
      // WARNING - temporary fix for strange language/term changes in RDF
      const fixedTerms = { "regeln": "rules", "tools": "instruments" } as StringAccessObject;
      if (["regeln", "tools"].includes(label.toLowerCase())) {
        label = fixedTerms[label.toLowerCase()];
      }
      // WARNING - end of fix
      // Create detail if it does not exist
      activityDetail[label.toLowerCase()] ? null : activityDetail[label.toLowerCase()] = [];
      (activityDetail[label.toLowerCase()] as Action[]).push({
        action: triple.predicate.value.split("/").pop(),
        object: triple.object.value.split("/").pop()
      } as Action);
    }
    // TODO Misunderstanding of Division of Labour?
    else {
      activityDetail["divisionOfLabour"] = true;
    }
  });
  return activityDetail;
}

/**
 * WORK IN PROGESS
 * Fetches all Details for a given activity and
 * returns them as a ActivityDetail object WITH further
 * information about the objects of the actions
 * Might be very slow on a full knowledge graph
 * @param activity Activity to fetch the details for
 * @param lang Language to fetch the details in
 * @returns Activity details as an object
 */
// export async function getActivityDetailWithInfo(activity: Activity, lang: string = "de"): Promise<ActivityDetail> {
//   let query = await getSparqlTemplate(sparqlTemplate.getActivityDetail);
//   const mapObj = { "{{activity}}": activity.uri.split("/").pop() || "", "{{language}}": lang };
//   query = query.replaceMultiple(mapObj);
//   const data = await fetchSparql(query);
//   let activityDetail = {} as ActivityDetail;
//   data.map((triple: KnowledgeGraphData) => {
//     let label = triple.label.value.split("/").pop();
//     // TODO Misunderstanding of Division of Labour?
//     activityDetail["divisionOfLabour"] = false;
//     if (label.toLowerCase() != "owl#class") {
//       // WARNING - temporary fix for strange language/term changes in RDF
//       const fixedTerms = { "regeln": "rules", "tools": "instruments" } as StringAccessObject;
//       if (["regeln", "tools"].includes(label.toLowerCase())) {
//         label = fixedTerms[label.toLowerCase()];
//       }
//       // WARNING - end of fix
//       // Create object list if it does not exist
//       activityDetail[label.toLowerCase()] ? null : activityDetail[label.toLowerCase()] = [];
//       // Check if label is already in the list
//       const labelInList = (activityDetail[label.toLowerCase()] as Object[]).find((obj: Object) => obj.label == triple.object.value.split("/").pop());
//       // Add detail
//       if (!labelInList) {
//         (activityDetail[label.toLowerCase()] as Object[]).push({
//           label: triple.object.value.split("/").pop(),
//           type: label,
//           actions: [{
//             action: triple.predicate.value.split("/").pop(),
//             object: activity.label
//           } as Action]
//         } as Object);
//       }
//       else {
//         console.log(activityDetail[label.toLowerCase()]);
//         try {
//           console.log(((activityDetail[label.toLowerCase()] as Object[]).find(detail => detail.label == triple.object.value.split("/").pop()) || {} as Object).label);
//           ((activityDetail[label.toLowerCase()] as Object[]).find(detail => detail.label == triple.object.value.split("/").pop()) || {} as Object).actions.push({
//             action: triple.predicate.value.split("/").pop(),
//             object: activity.label
//           } as Action);
//         }
//         catch (e) {
//           console.log("Error parsing Data");
//         }
//       }
//     }
//     // TODO Misunderstanding of Division of Labour?
//     else {
//       activityDetail["divisionOfLabour"] = true;
//     }
//   });
//   return activityDetail;
// }