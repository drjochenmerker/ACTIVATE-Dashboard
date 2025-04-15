import { Action, Activity, ActivityDetail, Conflict, Comment, StringAccessObject, sparqlTemplate, Participant, PredicateDict, KnowledgeGraphActivityClass, Objective, MultiLangObject } from "./structures";
import { fetchSparql, findNestedComment, getSparqlTemplate, camelToSnakeCase } from "./utils";

/**
 * Fetches all activities from the knowledge graph
 * @returns A list of Activity objects which can be accessed through
 *          corresponding language string. Example: "de"
 */
export async function getActivities(): Promise<Activity[]> {
  let query = await getSparqlTemplate(sparqlTemplate.getActivities);
  const data = await fetchSparql(query);
  let parsedData: Activity[] = [];
  data.forEach((triple: StringAccessObject) => {
    parsedData.push({
      graph: triple.graph.value.split("/").pop(),
      name: triple.name.value ? triple.name.value : "Error - No Name given",
      description: triple.description.value ? triple.description.value : "Error - No Description given"
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
    const objectIndexInList = (activityDetail[label] as Objective[]).findIndex((obj: Objective) => obj.label == item.entity.value.split("#").pop());
    // Object not in list yet
    if (objectIndexInList < 0) {
      if (item.property.value.split("#").pop() === "type") {
        activityDetail[label].push({
          label: item.entity.value.split("#").pop(),
          properties: [] as Action[]
        } as Objective);
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
        } as Objective);
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
  const parsedConflict = { id: conflictId, replies: [] as Comment[] } as Conflict;
  const lookupMap = new Map();
  const rootReplyIds = [] as string[];
  // Round 1: Build isolated data items
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
          rootReplyIds.push(item.conflict_o.value.split("#").pop());
          break;
        default:
          if (item.conflict_p !== undefined) {
            console.error("Unknown Property in Conflict Parsing", item.conflict_p.value);
          }
          break;
      }
    }
    // Comment Data
    else if (item.p) {
      switch (item.p.value.split("#").pop()) {
        case "WrittenBy":
          if (lookupMap.has(item.s.value.split("#").pop())) {
            lookupMap.get(item.s.value.split("#").pop()).author = item.o.value;
          }
          else {
            lookupMap.set(item.s.value.split("#").pop(), {
              id: item.s.value.split("#").pop(),
              author: item.o.value
            } as Comment)
          }
          break;
        case "CommentDescription":
          if (lookupMap.has(item.s.value.split("#").pop())) {
            lookupMap.get(item.s.value.split("#").pop()).comment = item.o.value;
          }
          else {
            lookupMap.set(item.s.value.split("#").pop(), {
              id: item.s.value.split("#").pop(),
              comment: item.o.value
            } as Comment)
          }
          break;
        case "CreationDate":
          if (lookupMap.has(item.s.value.split("#").pop())) {
            lookupMap.get(item.s.value.split("#").pop()).timestamp = new Date(item.o.value);
          }
          else {
            lookupMap.set(item.s.value.split("#").pop(), {
              id: item.s.value.split("#").pop(),
              timestamp: new Date(item.o.value)
            } as Comment)
          }
          break;
        case "HasComment":
          if (lookupMap.has(item.s.value.split("#").pop())) {
            if (lookupMap.get(item.s.value.split("#").pop()).replies === undefined) {
              lookupMap.get(item.s.value.split("#").pop()).replies = [item.o.value.split("#").pop()] as Comment[];
            }
            else {
              lookupMap.get(item.s.value.split("#").pop()).replies.push(item.o.value.split("#").pop());
            }
          }
          else {
            lookupMap.set(item.s.value.split("#").pop(), {
              id: item.s.value.split("#").pop(),
              replies: [item.o.value.split("#").pop()]
            } as Comment)
          }
          break;
        default:
          if (item.p !== undefined) {
            console.error("Unknown Property in Comment Parsing", item.p.value);
          }
          break;
      }
    }
  });
  // Round 2: Link isolated items
  // Link comments
  for (const [_, value] of lookupMap.entries()) {
    const node = lookupMap.get(value.id);
    const replies = value.replies ? [...value.replies] : [];
    for (const replyId of replies) {
      const reply = lookupMap.get(replyId);
      if (reply) {
        node.replies!.splice(node.replies!.indexOf(replyId), 1);
        node.replies!.push(reply);
      }
      else {
        console.log("Error in Database - reply not found in lookup map", replyId, lookupMap);
      }
    }
  }
  // Link conflict and root level
  for (const rootId of rootReplyIds) {
    const comment = lookupMap.get(rootId);
    if (comment) {
      parsedConflict.replies!.push(comment);
    }
  }
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

/**
 * Fetches alle Comments with :root as parent
 * @param graph Graph to fetch the comments from
 * @returns List of miscellanous comments
 */
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

export async function getActivityClassIds(graph: string, activityClass: KnowledgeGraphActivityClass): Promise<MultiLangObject[]> {
  let query = await getSparqlTemplate(sparqlTemplate.getActivityClassIds);
  const mapObj = {
    "{{graph}}": graph,
    "{{activityClass}}": activityClass,
  };
  query = query.replaceMultiple(mapObj);
  const data = await fetchSparql(query);
  let result = [] as MultiLangObject[];
  data.map((item: StringAccessObject) => {
    const index = result.findIndex((entry: MultiLangObject) => entry.id == item.entity.value.split("#").pop());
    // Add new entry to list
    if (index < 0) {
      try {
        result.push({
          id: item.entity.value.split("#").pop(),
          labels: { [item.label["xml:lang"]]: item.label.value }
        } as MultiLangObject);
      } catch {
        result.push({
          id: item.entity.value.split("#").pop(),
          labels: { default: item.entity.value.split("#").pop() }
        } as MultiLangObject);
      }
    }
    // Item already in list (Multiple languages available)
    else {
      try {
        result[index].labels[item.label["xml:lang"]] = item.label.value;
      } catch {
        result[index].labels.default = item.entity.value.split("#").pop();
      }
    }
  })
  // Check if there is only one language available for some. In this case set "default" als key
  for (const entry of result) {
    if (Object.keys(entry.labels).length === 1) {
      const lang = Object.keys(entry.labels)[0];
      entry.labels = { default: entry.labels[lang] };
    }
  }
  console.log(result)
  return result;
}