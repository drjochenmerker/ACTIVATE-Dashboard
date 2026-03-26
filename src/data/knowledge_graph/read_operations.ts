import { Action, Activity, ActivityDetail, Comment, StringAccessObject, sparqlTemplate, Participant, PredicateDict, KnowledgeGraphActivityClass, Objective, MultiLangObject, ConflictWithId } from "./structures";
import { fetchSparql, findNestedComment, getSparqlTemplate, camelToSnakeCase } from "./utils";

/**
 * Fetches all activities from the knowledge graph
 * @returns A list of Activity objects which can be accessed through
 *          corresponding language string. Example: "de"
 */

export async function getActivities(): Promise<Activity[]> {
  const query = await getSparqlTemplate(sparqlTemplate.getActivities);
  const data = await fetchSparql(query);

  // Group activities by graph ID
  const grouped: Record<string, Activity> = {};

  data.forEach((triple: StringAccessObject) => {
    // Extract graph identifier (last part of the URI)
    const graphId = triple.graph.value.split("/").pop() || triple.graph.value;

    // Initialize entry if not exists
    if (!grouped[graphId]) {
      grouped[graphId] = {
        graph: graphId,
        name: {},
        description: {}, // Make sure this is initialized even if optional in type 
        isArchived: false
      };
  }

    // Extract language tag or default
    const nameLang = triple.name['xml:lang'] || 'default';
    const descLang = triple.description['xml:lang'] || 'default';

    // Assign name and description under the correct language
    grouped[graphId].name[nameLang] = triple.name.value || "Error - No Name given";
    grouped[graphId].description[descLang] = triple.description.value || "Error - No Description given";

    if (triple.isArchived?.value) {
      grouped[graphId].isArchived = String(triple.isArchived.value).toLowerCase() === "true";
    }
  });

  // Convert grouped object to array
  const parsedData = Object.values(grouped);

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
  const activityDetail = {} as ActivityDetail;
  // Init Division of Labour as false
  data.map((item: StringAccessObject) => {
    // Parse label to make it easier for frontend
    let type = camelToSnakeCase(item.type.value.split("#").pop());
    if (type === "rule" || type === "instrument") {
      type += "s";
    }
    // Init Label Subject, Community, etc. if it doesn't exist yet
    if (type in activityDetail === false) {
      activityDetail[type] = [];
    }
    // Check if entity is already in the list
    const objectIndexInList = (activityDetail[type] as Objective[]).findIndex((obj: Objective) => obj.id == item.entity.value.split("#").pop());
    // Object not in list yet
    if (objectIndexInList < 0) {
      if (item.property.value.split("#").pop() === "type" || item.property.value.split("#").pop() === "label") {
        const langTag = item.target["xml:lang"] || undefined;
        activityDetail[type].push({
          id: item.entity.value.split("#").pop(),
          type: type,
          labels: langTag ?
            { [langTag]: item.target.value } : item.property.value.split("#").pop() === "label" ?
              { default: item.target.value ? item.target.value : item.entity.value.split("#").pop() } : {},
          properties: [] as Action[]
        } as Objective);
      }
      else {
        activityDetail[type].push({
          id: item.entity.value.split("#").pop(),
          labels: {},
          type: type,
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
      else if (item.property.value.split("#").pop() === "label") {
        const langTag = item.target["xml:lang"] || undefined;
    if (langTag) {
                    activityDetail[type][objectIndexInList].labels[langTag] = item.target.value;
                } else {
                    activityDetail[type][objectIndexInList].labels.default = item.target.value
                        ? item.target.value
                        : item.entity.value.split("#").pop();
                }
          return;
      }
      if (item.language) {
        const propertyActionIndex = activityDetail[type][objectIndexInList].properties.findIndex((action: Action) => action.action == item.action.value.split("#").pop());
        // If no language version has been created yet
        if (propertyActionIndex < 0) {
          activityDetail[type][objectIndexInList].properties.push({
            action: item.action.value.split("#").pop(),
            object: item.language ? {
              [item.language.value]: item.target.value.split("#").pop()
            } as StringAccessObject : item.target.value.split("#").pop()
          } as Action);
        }
        // Some language has been added already
        else {
          (activityDetail[type][objectIndexInList].properties[propertyActionIndex].object as StringAccessObject)[item.language.value] = item.target.value.split("#").pop();
        }
      }
      else {
        activityDetail[type][objectIndexInList].properties.push({
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

export async function getConflictIds(graph: string): Promise<{ title: Record<string, string>; id: string }[]> {
  let query = await getSparqlTemplate(sparqlTemplate.getConflictIds);
  query = query.replace("{{graph}}", graph);
  const data = await fetchSparql(query);

  // Use a map to group titles by conflict ID
  const conflictMap: Record<string, { id: string; title: Record<string, string> }> = {};

  data.forEach((conflict: StringAccessObject) => {
    const id = conflict.conflict_id.value.split("#").pop();
    const lang = conflict.conflict_title["xml:lang"] || "default";
    const title = conflict.conflict_title.value;

    if (!conflictMap[id]) {
      conflictMap[id] = {
        id,
        title: {}
      };
    }

    conflictMap[id].title[lang] = title;
  });

  const conflicts = Object.values(conflictMap);
  return conflicts;
}

/**
 * Fetches all details regarding a specific conflict
 * @param graph Graph that the conflict detail should be read from
 * @param conflictId Id of the conflict
 * @returns Conflict
 */
export async function getConflictDetail(graph: string, conflictId: string): Promise<ConflictWithId> {
  let query = await getSparqlTemplate(sparqlTemplate.getConflictDetail);
  const mapObj = {
    "{{graph}}": graph,
    "{{conflict}}": conflictId
  };
  query = query.replaceMultiple(mapObj);
  const data = await fetchSparql(query);
  // Start with a ConflictWithId so TS knows `id` is present
  const parsedConflict = { id: conflictId, replies: [] as Comment[] } as ConflictWithId;
  const lookupMap = new Map();
  const rootReplyIds = [] as string[];
  // Round 1: Build isolated data items
  data.map((item: StringAccessObject) => {
    // Conflict Data
    if (item.conflict_p) {
      switch (item.conflict_p.value.split("#").pop()) {
        case "WrittenBy": {
          const authorId = item.conflict_o.value.split("#").pop();
          
          // Try to get language tag from item.participant_o
          let langTag = "default";
          let labelValue = authorId;
          
          if (item.participant_o) {
            // Check if item.participant_o has xml:lang property
            if (item.participant_o["xml:lang"]) {
              langTag = item.participant_o["xml:lang"];
              labelValue = item.participant_o.value || authorId;
            } else if (item.participant_o.value) {
              // If no xml:lang but has value, use it
              labelValue = item.participant_o.value;
            }
          }

          if (!parsedConflict.author) {
            parsedConflict.author = {
              id: authorId,
              labels: {
                [langTag]: labelValue
              },
              type: "subject"
            };
          } else {
            if (!parsedConflict.author.labels) {
              parsedConflict.author.labels = {};
            }
            parsedConflict.author.labels[langTag] = labelValue;
          }
          break;
        }
        case "ConflictDescription":
          { if (!parsedConflict.description) {
            parsedConflict.description = {};
          }
          const lang = item.conflict_o["xml:lang"] || "default";
          parsedConflict.description[lang] = item.conflict_o.value;
          break; }

        case "ConflictTitle":
          { if (!parsedConflict.title) {
            parsedConflict.title = {};
          }
          const langTitle = item.conflict_o["xml:lang"] || "default";
          parsedConflict.title[langTitle] = item.conflict_o.value;
          break; }
        case "CreationDate":
          parsedConflict.timestamp = new Date(item.conflict_o.value);
          break;
        case "HasParticipant":
          { if (parsedConflict.participants === undefined) { parsedConflict.participants = [] as Participant[] };
          if (item.object_type === undefined) { item.object_type = { value: "miscellaneous" } }
          let type = camelToSnakeCase(item.object_type.value.split("#").pop());
          if (type === "rule" || type === "instrument") {
            type += "s";
          }
          // Handle labels
          if (item.participant_o && item.participant_p.value.split("#").pop() === "label") {
            const existingParticipant = parsedConflict.participants.find(participant => participant.id == item.conflict_o.value.split("#").pop());
            const langTag = item.participant_o["xml:lang"];
            if (existingParticipant) {
              existingParticipant.labels[langTag] = item.participant_o.value;
            }
            else {
              parsedConflict.participants.push({ id: item.conflict_o.value.split("#").pop(), labels: { [langTag]: item.participant_o.value }, type: type });
            }
          }
          else {
            parsedConflict.participants.push({ id: item.conflict_o.value.split("#").pop(), labels: { default: item.conflict_o.value.split("#").pop() }, type: type });
          }
          break; }
        case "ConflictState":
          parsedConflict.status = item.conflict_o.value;
          break;
        case "HasComment":
          rootReplyIds.push(item.conflict_o.value.split("#").pop());
          break;
        case "Origin":
          { const valueStr = item.conflict_o.value.split("#").pop();
          try {
            const obj = JSON.parse(valueStr);
            parsedConflict.origin = obj.answer;
          } catch (e) {
            console.error("Failed to parse conflict origin JSON:", e);
            parsedConflict.origin = valueStr; // fallback if not valid JSON
          }
          break; }
        case "IsAI": // TODO do something with is ai bool
          parsedConflict.isAI = item.conflict_o.value.split("#").pop();
          break;
        case "HasIntent":
          parsedConflict.hasIntent = item.conflict_o.value.split("#").pop();
          break;
        default:
          if (item.conflict_p !== undefined) {
            console.error("Unknown Property in Conflict Parsing", item.conflict_p.value.split("#").pop());
          }
          break;
      }
    }
    // Comment Data
    else if (item.p) {
      switch (item.p.value.split("#").pop()) {
        case "WrittenBy": {
          const commentId = item.s.value.split("#").pop()!;
          const authorIRI = item.o.value;
          const authorId = authorIRI.split("#").pop() || authorIRI;

          // Try to get language tag from item.q
          let langTag = "default";
          let labelValue = authorId;
          
          if (item.q) {
            // Check if item.q has xml:lang property
            if (item.q["xml:lang"]) {
              langTag = item.q["xml:lang"];
              labelValue = item.q.value || authorId;
            } else if (item.q.value) {
              // If no xml:lang but has value, use it as default
              labelValue = item.q.value;
            }
          }

          if (!lookupMap.has(commentId)) {
            lookupMap.set(commentId, {
              id: commentId,
              author: {
                id: authorId,
                labels: { [langTag]: labelValue },
                type: "subject"
              }
            } as Comment);
          } else {
            const comment = lookupMap.get(commentId);
            if (!comment.author) {
              comment.author = {
                id: authorId,
                labels: { [langTag]: labelValue },
                type: "subject"
              };
            } else {
              comment.author.id = authorId;
              if (!comment.author.labels) comment.author.labels = {};
              comment.author.labels[langTag] = labelValue;
            }
          }

          break;
        }
        case "CommentDescription": {
          const commentId = item.s.value.split("#").pop()!;
          const langTag = item.oLang || item.o["xml:lang"] || "default";
          const commentText = item.o.value || item.o;

          if (lookupMap.has(commentId)) {
            const comment = lookupMap.get(commentId);
            if (!comment.comment || typeof comment.comment === "string") {
              comment.comment = {};
            }
            comment.comment[langTag] = commentText;
          } else {
            lookupMap.set(commentId, {
              id: commentId,
              comment: { [langTag]: commentText }
            } as Comment);
          }
          break;
        }
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
        case "IsAI":
          // TODO handle is ai bool
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
export async function getAllConflictsWithDetail(graph: string): Promise<ConflictWithId[]> {
  const conflicts = await getConflictIds(graph);
  const detailedConflicts = [] as ConflictWithId[];
  for (const conflict of conflicts) {
    const detail = await getConflictDetail(graph, conflict.id);
    
    detailedConflicts.push(detail as ConflictWithId);
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
    const tuple: [string, string] = [camelToSnakeCase(item.domain.value.split("#").pop()), camelToSnakeCase(item.range.value.split("#").pop())];
    for (const i in tuple) {
      if (tuple[i] === "rule" || tuple[i] === "instrument") {
        tuple[i] += "s";
      }
    }
    predDict.add(tuple, {
      id: item.s.value.split("#").pop(),
      labels: item.label.value,
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
  const rootIds = [] as string[];
  const parsedComments = [] as Comment[];
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

export async function getActivityClassIds(
  graph: string,
  activityClass: KnowledgeGraphActivityClass
): Promise<MultiLangObject[]> {
  let query = await getSparqlTemplate(sparqlTemplate.getActivityClassIds);
  const mapObj = {
    "{{graph}}": graph,
    "{{activityClass}}": activityClass,
  };
  query = query.replaceMultiple(mapObj);

  const data = await fetchSparql(query);
  const result: MultiLangObject[] = [];

  data.forEach((item: StringAccessObject) => {
    const entityUri = item.entity.value;
    // Extract ID from URI (try # first, fallback to last slash)
    let id = "";
    if (entityUri.includes("#")) {
      id = entityUri.split("#").pop() || "";
    } else {
      id = entityUri.split("/").pop() || "";
    }

    // Label extraction with type checks
    const labelObj = item.label;
    let lang = "default";
    let labelValue = "";

    if (labelObj && typeof labelObj === "object") {
      // label is an object with possibly xml:lang and value
      lang = labelObj["xml:lang"] || "default";
      labelValue = labelObj.value || id;
    } else if (typeof labelObj === "string") {
      // label is just a string, no language info
      labelValue = labelObj;
    } else {
      // fallback
      labelValue = id;
    }

    // Check if entry already exists
    const index = result.findIndex(entry => entry.id === id);

    if (index < 0) {
      result.push({
        id,
        labels: {
          [lang]: labelValue
        }
      });
    } else {
      result[index].labels[lang] = labelValue;
    }
  });

  // Normalize single language labels to 'default'
  result.forEach(entry => {
    const langs = Object.keys(entry.labels);
    if (langs.length === 1 && langs[0] !== "default") {
      entry.labels = { default: entry.labels[langs[0]] };
    }
  });

  return result;
}


/**
 * Fetches the terms of each available language for the diagram vocabulary
 */
export async function getDiagramVocab(): Promise<Record<string, Record<string, object>>> {
  const query = await getSparqlTemplate(sparqlTemplate.getDiagramVocab);
  const data = await fetchSparql(query);
  const vocab: Record<string, Record<string, object>> = {};
  data.map((item: StringAccessObject) => {
    // Adapt types to frontend terms
    let correctedType: string = item.type.value.split("#").pop().toLowerCase();
    if (correctedType in ["rule", "instrument"]) {
      correctedType += "s";
    }
    else if (correctedType === "divisionoflabour") {
      correctedType = "division_of_labour";
    }
    // Init type if it doesn't exist yet
    if (vocab[correctedType] === undefined) {
      vocab[correctedType] = {};
    }
    // Add the language to the type
    vocab[correctedType][item.label["xml:lang"]] = {
      label: item.label.value,
      descripton: item.description.value
    };
  })
  return vocab
}