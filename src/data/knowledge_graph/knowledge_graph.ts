import { Action, Activity, ActivityDetail, KnowledgeGraphData, Object, sparqlTemplate, StringAccessObject } from "./structures";
import { fetchSparql, getSparqlTemplate } from "./utils";

/**
 * Fetches all activities from the knowledge graph
 * @returns A list of Activity objects which can be accessed through
 *          corresponding language string. Example: "de"
 */
export async function getActivities(): Promise<Record<string, Activity[]>> {
  let query = await getSparqlTemplate(sparqlTemplate.getActivities);
  console.log("halsdfjäolwiesjg", query)
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

/**
 * Fetches an example object. Only works with the current state of our database and will
 * be redundant later
 * @returns object containing entities objects for each found label (Instruments etc.)
 */
export async function getExampleActivity() {
  let query = await getSparqlTemplate(sparqlTemplate.getExampleActivity);
  console.log(query);
  const data = await fetchSparql(query);
  let activityDetail = {} as ActivityDetail;
  // Init Division of Labour as false
  activityDetail["DivisionOfLabour"] = false;
  data.map((item: KnowledgeGraphData) => {
    let label = item.type.value.split("/").pop();
    // Init Label Subject, Community, etc. if it doesn't exist yet
    if (label in activityDetail === false) {
      activityDetail[label] = []
    }
    // Skip rdf:typ prop triples
    if (item.property.value.split("#").pop() === "type") {
      return;
    }
    // Check if entity is already in the list
    const objectIndexInList = (activityDetail[label] as Object[]).findIndex((obj: Object) => obj.label == item.entity.value.split("/").pop());
    // Object not in list yet
    if (objectIndexInList < 0 && typeof activityDetail[label] != "boolean") {
      activityDetail[label].push({
        label: item.entity.value.split("/").pop(),
        actions: new Set(),
        properties: [{
          action: item.property.value.split("/").pop(),
          object: item.language ? {
            [item.language.value]: item.target.value.split("/").pop()
          } as StringAccessObject : item.target.value.split("/").pop()
        } as Action]
      } as Object)
    }
    // Object already in list
    else if (typeof activityDetail[label] != "boolean") {
      if (item.language) {
        const propertyActionIndex = activityDetail[label][objectIndexInList].properties.findIndex((action: Action) => action.action == item.action.value.split("/").pop());
        // If no language version has been created yet
        if (propertyActionIndex < 0) {
          activityDetail[label][objectIndexInList].properties.push({
            action: item.action.value.split("/").pop(),
            object: item.language ? {
              [item.language.value]: item.target.value.split("/").pop()
            } as StringAccessObject : item.target.value.split("/").pop()
          } as Action)
        }
        // Some language has been added already
        else {
          (activityDetail[label][objectIndexInList].properties[propertyActionIndex].object as StringAccessObject)[item.language.value] = item.target.value.split("/").pop();
        }
      }
      else {
        activityDetail[label][objectIndexInList].properties.push({
          action: item.property.value.split("/").pop(),
          object: item.language ? {
            [item.language.value]: item.target.value.split("/").pop()
          } as StringAccessObject : item.target.value.split("/").pop()
        } as Action)
      }
    }
  })
  return activityDetail
}