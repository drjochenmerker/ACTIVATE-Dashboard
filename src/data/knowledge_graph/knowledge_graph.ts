import { Action, Activity, ActivityDetail, KnowledgeGraphData, Object, sparqlTemplate, StringAccessObject } from "./interfaces";

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
 * @returns A list of Activity objects which can be accessed through
 *          corresponding language string. Example: "de"
 */
export async function getActivities(): Promise<Record<string, Activity[]>> {
  let query = await getSparqlTemplate(sparqlTemplate.getActivities);
  const data = await fetchSparql(query);
  let parsedData: KnowledgeGraphData = {};
  data.forEach((triple: KnowledgeGraphData) => {
    if (triple.language.value in parsedData === false) {
      parsedData[triple.language.value] = [] as Activity[];
    }
    parsedData[triple.language.value].push(
      {
        uri: triple.activity.value,
        label: triple.label.value
      }
    )
  });
  return parsedData;
}

/**
 * WORK IN PROGESS
 * Fetches all Details for a given activity and
 * returns them as a ActivityDetail object WITH further
 * information about the objects of the actions
 * Might be very slow on a full knowledge graph
 * @param activity Activity to fetch the details for
 * @returns Activity details as an object
 */
export async function getActivityDetail(activity: Activity): Promise<ActivityDetail> {
  let query = await getSparqlTemplate(sparqlTemplate.getActivityDetail);
  const mapObj = { "{{activity}}": activity.uri.split("/").pop() || "" };
  query = query.replaceMultiple(mapObj);
  const data = await fetchSparql(query);
  let activityDetail = {} as ActivityDetail;
  // Init Division of Labour as false
  activityDetail["DivisionOfLabour"] = false;

  data.map((item: KnowledgeGraphData) => {
    let label = item.label.value.split("/").pop();
    // Init Label Subject, Community, etc. if it doesn't exist yet
    if (label in activityDetail === false) {
      activityDetail[label] = []
    }
    // Divison of Labour Handling
    if (label.toLowerCase() == "owl#class") {
      // console.log("Edge Case", item)
    }
    // Check if Object is already in the list
    const objectIndexInList = (activityDetail[label] as Object[]).findIndex((obj: Object) => obj.label == item.object.value.split("/").pop());
    if (objectIndexInList < 0 && typeof activityDetail[label] != "boolean") {
      activityDetail[label].push({
        label: item.object.value.split("/").pop(),
        actions: new Set([item.predicate.value.split("/").pop()]),
        properties: [{
          action: item.detail1.value.split("/").pop(),
          object: item.detail2language ? {
            [item.detail2language.value]: item.detail2.value.split("/").pop()
          } as StringAccessObject : item.detail2.value.split("/").pop()
        } as Action]
      } as Object)
    }
    else if (typeof activityDetail[label] != "boolean") {
      activityDetail[label][objectIndexInList].actions.add(item.predicate.value.split("/").pop())
      if (item.detail2language) {
        const propertyActionIndex = activityDetail[label][objectIndexInList].properties.findIndex((action: Action) => action.action == item.detail1.value.split("/").pop());
        // If no language version has been created yet
        if (propertyActionIndex < 0) {
          activityDetail[label][objectIndexInList].properties.push({
            action: item.detail1.value.split("/").pop(),
            object: item.detail2language ? {
              [item.detail2language.value]: item.detail2.value.split("/").pop()
            } as StringAccessObject : item.detail2.value.split("/").pop()
          } as Action)
        }
        // Some language has been added already
        else {
          (activityDetail[label][objectIndexInList].properties[propertyActionIndex].object as StringAccessObject)[item.detail2language.value] = item.detail2.value.split("/").pop();
        }
      }
      else {
        activityDetail[label][objectIndexInList].properties.push({
          action: item.detail1.value.split("/").pop(),
          object: item.detail2language ? {
            [item.detail2language.value]: item.detail2.value.split("/").pop()
          } as StringAccessObject : item.detail2.value.split("/").pop()
        } as Action)
      }
    }

  });
  // Remove duplicate properties
  for (let detail in activityDetail) {
    if (typeof activityDetail[detail] != "boolean") {
      for (let innerDetail in activityDetail[detail]) {
        activityDetail[detail][innerDetail].properties = activityDetail[detail][innerDetail].properties.filter((value, index, self) =>
          index === self.findIndex((obj) =>
            JSON.stringify(obj) === JSON.stringify(value)
          )
        );
      }
    }
  }
  return activityDetail;
}