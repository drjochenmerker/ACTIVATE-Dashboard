import { Action, Activity, ActivityDetail, Conflict, StringAccessObject, Object, sparqlTemplate } from "./structures";
import { fetchSparql, findNestedComment, getSparqlTemplate } from "./utils";

/**
 * Fetches all activities from the knowledge graph
 * @returns A list of Activity objects which can be accessed through
 *          corresponding language string. Example: "de"
 */
export async function getActivities(): Promise<Activity[]> {
  let query = await getSparqlTemplate(sparqlTemplate.getActivities);
  const data = await fetchSparql(query);
  // let parsedData: StringAccessObject = {};
  let parsedData: Activity[] = [];
  data.forEach((triple: StringAccessObject) => {
    // Legacy code which allows loading multiple languages at the same time. Might still be useful later
    // if (triple.language.value in parsedData === false) {
    //   parsedData[triple.language.value] = [] as Activity[];
    // }
    // parsedData[triple.language.value].push(
    //   {
    //     uri: triple.activity.value,
    //     label: triple.label.value
    //   }
    // )
    parsedData.push({
      graph: triple.graph.value.split("/").pop(),
      name: triple.name.value,
    })
  });
  return parsedData;
}

/**
 * Fetches all Details for a given activity and returns them as a ActivityDetail object WITH further
 * information about the objects of the actions. Might be very slow on a full knowledge graph
 * @param activity Activity to fetch the details for
 * @returns Activity details as an object
 */
export async function getActivityDetail(activity: Activity): Promise<ActivityDetail> {
  let query = await getSparqlTemplate(sparqlTemplate.getActivityDetail);
  query = query.replace("{{graph}}", activity.graph)
  const data = await fetchSparql(query);
  let activityDetail = {} as ActivityDetail;
  // Init Division of Labour as false
  data.map((item: StringAccessObject) => {
    let label = item.type.value.split("#").pop();
    // Init Label Subject, Community, etc. if it doesn't exist yet
    if (label in activityDetail === false) {
      activityDetail[label] = []
    }
    // Check if entity is already in the list
    const objectIndexInList = (activityDetail[label] as Object[]).findIndex((obj: Object) => obj.label == item.entity.value.split("#").pop());
    // Object not in list yet
    if (objectIndexInList < 0) {
      activityDetail[label].push({
        label: item.entity.value.split("#").pop(),
        actions: new Set(),
        properties: [{
          action: item.property.value.split("#").pop(),
          object: item.language ? {
            [item.language.value]: item.target.value.split("#").pop()
          } as StringAccessObject : item.target.value.split("#").pop()
        } as Action]
      } as Object)
    }
    // Object already in list
    else {
      if (item.language) {
        const propertyActionIndex = activityDetail[label][objectIndexInList].properties.findIndex((action: Action) => action.action == item.action.value.split("#").pop());
        // If no language version has been created yet
        if (propertyActionIndex < 0) {
          activityDetail[label][objectIndexInList].properties.push({
            action: item.action.value.split("#").pop(),
            object: item.language ? {
              [item.language.value]: item.target.value.split("#").pop()
            } as StringAccessObject : item.target.value.split("#").pop()
          } as Action)
        }
        // Some language has been added already
        else {
          (activityDetail[label][objectIndexInList].properties[propertyActionIndex].object as StringAccessObject)[item.language.value] = item.target.value.split("#").pop();
        }
      }
      else {
        activityDetail[label][objectIndexInList].properties.push({
          action: item.property.value.split("#").pop(),
          object: item.language ? {
            [item.language.value]: item.target.value.split("#").pop()
          } as StringAccessObject : item.target.value.split("#").pop()
        } as Action)
      }
    }
  })
  return activityDetail
}

export async function getConflictDetail(graph: string, conflictId: string) {
  console.log(`Fetching ${conflictId} detail from ${graph}`)
  let query = await getSparqlTemplate(sparqlTemplate.getConflictDetail);
  const mapObj = {
    "{{graph}}": graph,
    "{{conflict}}": conflictId
  };
  query = query.replaceMultiple(mapObj);
  const data = await fetchSparql(query);
  let parsedConflict = { id: conflictId } as Conflict;
  // Round 1: Build references
  data.map((item: StringAccessObject) => {
    // Conflict Data
    if (item.conflict_p && item.conflict_p.value.split("#").pop() == "HasComment") {
      if (parsedConflict.replies === undefined) { parsedConflict.replies = [] }
      parsedConflict.replies.push({
        id: item.conflict_o.value.split("#").pop()
      })
    }
    // Comment Data
    else if (item.p && item.p.value.split("#").pop() == "HasComment") {
      const replyIndex = parsedConflict.replies?.find(reply => reply.id == item.s.value.split("#").pop())
      if (replyIndex) {
        // Add empty list if first comment
        if (replyIndex.replies === undefined) { replyIndex.replies = [] }
        replyIndex.replies.push({
          id: item.o.value.split("#").pop()
        })
      }
      // Comment nested in another comment
      else {
        const nestedComment = findNestedComment(item.s.value.split("#").pop(), parsedConflict)
        if (nestedComment) {
          // Add empty list if first nested comment
          if (nestedComment.replies === undefined) { nestedComment.replies = [] }
          nestedComment.replies.push({
            id: item.o.value.split("#").pop()
          })
        }
      }
    }
  });
  // Round 2: Fill in the details
  data.map((item: StringAccessObject) => {
    // Conflict Data
    if (item.conflict_p) {
      switch (item.conflict_p.value.split("#").pop()) {
        case "WrittenBy":
          parsedConflict.author = item.conflict_o.value;
          break;
        case "ConflictDescription":
          parsedConflict.description = item.conflict_o.value;
          break;
        case "ConflictTitle":
          parsedConflict.title = item.conflict_o.value;
          break;
        case "CreationDate":
          parsedConflict.timestamp = new Date(item.conflict_o.value);
          break;
        case "HasParticipant":
          if (parsedConflict.participants === undefined) { parsedConflict.participants = [] }
          parsedConflict.participants.push(item.conflict_o.value.split("#").pop())
          break;
        case "ConflictState":
          parsedConflict.status = item.conflict_o.value
          break;
        case "HasComment":
          break;
        default:
          if (item.conflict_p !== undefined) {
            console.error("Unknown Property in Conflict Parsing", item.conflict_p.value)
          }
          break;
      }
    }
    // Comment Data
    else {
      let replyIndex;
      switch (item.p.value.split("#").pop()) {
        case "WrittenBy":
          replyIndex = parsedConflict.replies?.find(reply => reply.id == item.s.value.split("#").pop())
          // console.log("Looking for", item.s.value.split("/").pop(), "in", parsedConflict.replies, "found", replyIndex);
          if (replyIndex) {
            replyIndex.author = item.o.value;
          }
          else {
            const nestedComment = findNestedComment(item.s.value.split("#").pop(), parsedConflict)
            if (nestedComment) {
              nestedComment.author = item.o.value;
            }
          }
          break;
        case "CommentDescription":
          replyIndex = parsedConflict.replies?.find(reply => reply.id == item.s.value.split("#").pop())
          // console.log("Looking for", item.s.value.split("/").pop(), "in", parsedConflict.replies, "found", replyIndex);
          if (replyIndex) {
            replyIndex.comment = item.o.value;
          }
          else {
            const nestedComment = findNestedComment(item.s.value.split("#").pop(), parsedConflict)
            if (nestedComment) {
              nestedComment.comment = item.o.value;
            }
          }
          break;
        case "CreationDate":
          replyIndex = parsedConflict.replies?.find(reply => reply.id == item.s.value.split("#").pop())
          // console.log("Looking for", item.s.value.split("/").pop(), "in", parsedConflict.replies, "found", replyIndex);
          if (replyIndex) {
            replyIndex.timestamp = new Date(item.o.value);
          }
          else {
            const nestedComment = findNestedComment(item.s.value.split("#").pop(), parsedConflict)
            if (nestedComment) {
              nestedComment.timestamp = new Date(item.o.value);
            }
          }
          break;
        case "HasComment":
          break;
        default:
          if (item.p !== undefined) {
            console.error("Unknown Property in Comment Parsing", item.p.value)
          }
          break;
      }
    }
  })
  return parsedConflict
}