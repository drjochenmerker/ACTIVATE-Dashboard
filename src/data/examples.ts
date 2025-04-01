// Example code to test backend functionality

import { conflictStatus } from "./knowledge_graph/structures";
import { addComment, addConflict } from "./knowledge_graph/write_operations";

// Add some conflicts with comments
export async function addExampleConflictData(graph: string): Promise<string[]> {
    const conflict1Res = await addConflict(graph, {
        title: "Personal lacht über den Patient",
        participants: [{ id: "NursingSpecialist1", type: "Subject" }, { id: "Patient1", type: "Subject" }],
        author: "HR",
        status: conflictStatus.inDiscussion,
        description: "Der Patient fühlte sich nicht ernst genommen."
    });
    await addComment(conflict1Res.modified, "Hahaha!");
    const commentRes = await addComment( conflict1Res.modified, "Das geht ja garnicht!");
    const commentResInner = await addComment(commentRes.modified,"Sehe ich auch so :(");
    await addComment( commentResInner.modified, "Okay");
    await addComment(conflict1Res.modified,"Frech!");
    const conflict2Res = await addConflict(graph, {
        title: "Patient verträgt Verband nicht",
        participants: [{ id: "Patient1", type: "Subject" }, { id: "Patient1Health", type: "Object" }],
        author: "Prof. Asklepios",
        status: conflictStatus.open,
    });
    const commentRes2Inner = await addComment(conflict2Res.modified, "Mehr Infos in der Beschreibung wären gut!");
    await addComment( commentRes2Inner.modified, "Ja, das wäre hilfreich!");
    return [conflict1Res.modified, conflict2Res.modified];
}