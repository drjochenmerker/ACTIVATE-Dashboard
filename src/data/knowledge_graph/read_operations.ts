import { Action, Activity, ActivityDetail, Conflict, Comment, StringAccessObject, Object, sparqlTemplate, Participant, PredicateDict } from "./structures";
import { fetchSparql, findNestedComment, getSparqlTemplate, camelToSnakeCase } from "./utils";

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
    });
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
  query = query.replace("{{graph}}", activity.graph);
  const data = await fetchSparql(query);
  let activityDetail = {} as ActivityDetail;
  // Init Division of Labour as false
  data.map((item: StringAccessObject) => {
    // Parse label to make it easier for frontend
    let label = camelToSnakeCase(item.type.value.split("#").pop());
    if (label === "rule" || label === "instrument") {
      label += "s";
    }
    // Init Label Subject, Community, etc. if it doesn't exist yet
    if (label in activityDetail === false) {
      activityDetail[label] = [];
    }
    // Check if entity is already in the list
    const objectIndexInList = (activityDetail[label] as Object[]).findIndex((obj: Object) => obj.label == item.entity.value.split("#").pop());
    // Object not in list yet
    if (objectIndexInList < 0) {
      if (item.target.value.split("#").pop() === "DivisionOfLabour") {
        activityDetail[label].push({
          label: item.entity.value.split("#").pop(),
          properties: [] as Action[]
        } as Object);
      }
      else if (item.property.value.split("#").pop() === "type") {
        return;
      }
      else {
        activityDetail[label].push({
          label: item.entity.value.split("#").pop(),
          properties: [{
            action: item.property.value.split("#").pop(),
            object: item.language ? {
              [item.language.value]: item.target.value.split("#").pop()
            } as StringAccessObject : item.target.value.split("#").pop()
          } as Action]
        } as Object);
      }
    }
    // Object already in list
    else {
      if (item.property.value.split("#").pop() === "type") {
        return;
      }
      if (item.language) {
        const propertyActionIndex = activityDetail[label][objectIndexInList].properties.findIndex((action: Action) => action.action == item.action.value.split("#").pop());
        // If no language version has been created yet
        if (propertyActionIndex < 0) {
          activityDetail[label][objectIndexInList].properties.push({
            action: item.action.value.split("#").pop(),
            object: item.language ? {
              [item.language.value]: item.target.value.split("#").pop()
            } as StringAccessObject : item.target.value.split("#").pop()
          } as Action);
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
        } as Action);
      }
    }
  })
  return activityDetail;
}

/**
 * Fetches all conflict Ids for the current activity. 
 * @param graph 
 * @returns List of conflicts with their title and id
 */
export async function getConflictIds(graph: string): Promise<{ title: string; id: string }[]> {
  let query = await getSparqlTemplate(sparqlTemplate.getConflictIds);
  query = query.replace("{{graph}}", graph);
  const data = await fetchSparql(query);
  let conflicts = [] as { title: string; id: string }[];
  data.map((conflict: StringAccessObject) => {
    conflicts.push({
      title: conflict.conflict_title.value,
      id: conflict.conflict_id.value.split("#").pop()
    });
  })
  return conflicts;
}

/**
 * Fetches all details regarding a specific conflict
 * @param graph Graph that the conflict detail should be read from
 * @param conflictId Id of the conflict
 * @returns Conflict
 */
export async function getConflictDetail(graph: string, conflictId: string): Promise<Conflict> {
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
      if (parsedConflict.replies === undefined) { parsedConflict.replies = [] };
      parsedConflict.replies.push({
        id: item.conflict_o.value.split("#").pop()
      });
    }
    // Comment Data
    else if (item.p && item.p.value.split("#").pop() == "HasComment") {
      const replyIndex = parsedConflict.replies?.find(reply => reply.id == item.s.value.split("#").pop());
      if (replyIndex) {
        // Add empty list if first comment
        if (replyIndex.replies === undefined) { replyIndex.replies = [] };
        replyIndex.replies.push({
          id: item.o.value.split("#").pop()
        });
      }
      // Comment nested in another comment
      else {
        const nestedComment = findNestedComment(item.s.value.split("#").pop(), parsedConflict);
        if (nestedComment) {
          // Add empty list if first nested comment
          if (nestedComment.replies === undefined) { nestedComment.replies = [] };
          nestedComment.replies.push({
            id: item.o.value.split("#").pop()
          });
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
          if (parsedConflict.participants === undefined) { parsedConflict.participants = [] as Participant[] };
          //HERE
          if (item.object_type === undefined) { item.object_type = { value: "miscellaneous" } }
          let type = camelToSnakeCase(item.object_type.value.split("#").pop());
          if (type === "rule" || type === "instrument") {
            type += "s";
          }
          parsedConflict.participants.push({ id: item.conflict_o.value.split("#").pop(), type: type });
          break;
        case "ConflictState":
          parsedConflict.status = item.conflict_o.value;
          break;
        case "HasComment":
          break;
        default:
          if (item.conflict_p !== undefined) {
            console.error("Unknown Property in Conflict Parsing", item.conflict_p.value);
          }
          break;
      }
    }
    // Comment Data
    else {
      let replyIndex;
      switch (item.p.value.split("#").pop()) {
        case "WrittenBy":
          replyIndex = parsedConflict.replies?.find(reply => reply.id == item.s.value.split("#").pop());
          // console.log("Looking for", item.s.value.split("/").pop(), "in", parsedConflict.replies, "found", replyIndex);
          if (replyIndex) {
            replyIndex.author = item.o.value;
          }
          else {
            const nestedComment = findNestedComment(item.s.value.split("#").pop(), parsedConflict);
            if (nestedComment) {
              nestedComment.author = item.o.value;
            }
          }
          break;
        case "CommentDescription":
          replyIndex = parsedConflict.replies?.find(reply => reply.id == item.s.value.split("#").pop());
          // console.log("Looking for", item.s.value.split("/").pop(), "in", parsedConflict.replies, "found", replyIndex);
          if (replyIndex) {
            replyIndex.comment = item.o.value;
          }
          else {
            const nestedComment = findNestedComment(item.s.value.split("#").pop(), parsedConflict);
            if (nestedComment) {
              nestedComment.comment = item.o.value;
            }
          }
          break;
        case "CreationDate":
          replyIndex = parsedConflict.replies?.find(reply => reply.id == item.s.value.split("#").pop());
          // console.log("Looking for", item.s.value.split("/").pop(), "in", parsedConflict.replies, "found", replyIndex);
          if (replyIndex) {
            replyIndex.timestamp = new Date(item.o.value);
          }
          else {
            const nestedComment = findNestedComment(item.s.value.split("#").pop(), parsedConflict);
            if (nestedComment) {
              nestedComment.timestamp = new Date(item.o.value);
            }
          }
          break;
        case "HasComment":
          break;
        default:
          if (item.p !== undefined) {
            console.error("Unknown Property in Comment Parsing", item.p.value);
          }
          break;
      }
    }
  })
  return parsedConflict;
}

/**
 * Fetches all conflicts in detail for a given activtiy graph
 * @param graph activity graph
 * @returns List of Conflicts
 */
export async function getAllConflictsWithDetail(graph: string): Promise<Conflict[]> {
  const conflicts = await getConflictIds(graph);
  let detailedConflicts = [] as Conflict[];
  for (const conflict of conflicts) {
    const detail = await getConflictDetail(graph, conflict.id);
    detailedConflicts.push(detail);
  }
  return detailedConflicts;
}

/**
 * Fetches an object that allows to list the available predicates
 * for each Class relation
 * Example: (Subject,Rule) = HasToFollow
 */
export async function getPredicateObject(graph: string): Promise<PredicateDict> {
  let query = await getSparqlTemplate(sparqlTemplate.getPredicates);
  query = query.replace("{{graph}}", graph);
  const data = await fetchSparql(query);
  const predDict = new PredicateDict;
  data.map((item: StringAccessObject) => {
    let tuple: [string, string] = [camelToSnakeCase(item.domain.value.split("#").pop()), camelToSnakeCase(item.range.value.split("#").pop())];
    for (let i in tuple) {
      if (tuple[i] === "rule" || tuple[i] === "instrument") {
        tuple[i] += "s";
      }
    }
    predDict.add(tuple, {
      predicate: item.s.value.split("#").pop(),
      label: item.label.value,
      lang: item.label["xml:lang"]
    })
  })
  return predDict;
}

export async function getMiscComments(graph: string): Promise<Comment[]> {
  // Fetch data
  let query = await getSparqlTemplate(sparqlTemplate.getMiscComments);
  query = query.replace("{{graph}}", graph);
  const data = await fetchSparql(query);
  // Preproccess data
  let rootIds = [] as string[];
  let parsedComments = [] as Comment[];
  // Build data structure
  data.map((item: StringAccessObject) => {
    if (item.root_comment_id !== undefined) {
      const commentObj = { id: item.root_comment_id.value.split("#").pop() };
      rootIds.push(commentObj.id);
      parsedComments.push(commentObj);
    }
    else if (item.p.value.split("#").pop() == "HasComment") {
      const rootParent = parsedComments.find(comment => comment.id == item.s.value.split("#").pop());
      if (rootParent) {
        if (rootParent.replies === undefined) { rootParent.replies = [] };
        rootParent.replies.push({
          id: item.o.value.split("#").pop()
        });
      }
      else {
        let nestedComment = undefined
        nestedComment = findNestedComment(item.s.value.split("#").pop(), parsedComments);
        if (nestedComment) {
          if (nestedComment.replies === undefined) { nestedComment.replies = [] };
          nestedComment.replies.push({
            id: item.o.value.split("#").pop()
          });
        }
      }
    }
  });
  // Fill in details
  data.map((item: StringAccessObject) => {
    if (item.p == undefined) { return };
    let comment = undefined
    switch (item.p.value.split("#").pop()) {
      case "WrittenBy":
        comment = parsedComments.find(comment => comment.id == item.s.value.split("#").pop());
        if (comment) {
          comment.author = item.o.value;
        }
        else {
          const nestedComment = findNestedComment(item.s.value.split("#").pop(), parsedComments);
          if (nestedComment) {
            nestedComment.author = item.o.value;
          }
        }
        break;
      case "CommentDescription":
        comment = parsedComments.find(comment => comment.id == item.s.value.split("#").pop());
        if (comment) {
          comment.comment = item.o.value;
        }
        else {
          const nestedComment = findNestedComment(item.s.value.split("#").pop(), parsedComments);
          if (nestedComment) {
            nestedComment.comment = item.o.value;
          }
        }
        break;
      case "CreationDate":
        comment = parsedComments.find(comment => comment.id == item.s.value.split("#").pop());
        if (comment) {
          comment.timestamp = new Date(item.o.value);
        }
        else {
          const nestedComment = findNestedComment(item.s.value.split("#").pop(), parsedComments);
          if (nestedComment) {
            nestedComment.timestamp = new Date(item.o.value);
          }
        }
        break;
    }
  });
  return parsedComments;
}