// Example code to test backend functionality

import { conflictStatus } from "./knowledge_graph/structures";
import { addComment, addConflict } from "./knowledge_graph/write_operations";

// Add some conflicts with comments
export async function addExampleConflictData(graph: string): Promise<string[]> {
    const conflict1Res = await addConflict(graph, {
        activity: "UrologyEmergency",
        title: "Personal lacht über den Patient",
        participants: ["NursingStaff", "Patient1"],
        author: "HR",
        status: conflictStatus.inDiscussion,
        description: "Der Patient fühlte sich nicht ernst genommen."
    });
    await addComment(graph, conflict1Res.modified, "Felix", "Hahaha!");
    const commentRes = await addComment(graph, conflict1Res.modified, "Christin", "Das geht ja garnicht!");
    const commentResInner = await addComment(graph, commentRes.modified, "Clemens", "Sehe ich auch so :(");
    await addComment(graph, commentResInner.modified, "Christin", "Okay");
    await addComment(graph, conflict1Res.modified, "Kenn", "Frech!");
    const conflict2Res = await addConflict(graph, {
        activity: "UrologyEmergency",
        title: "Patient verträgt Verband nicht",
        participants: ["Patient1", "GauzeBandage"],
        author: "Prof. Asklepios",
        status: conflictStatus.open,
    });
    const commentRes2Inner = await addComment(graph, conflict2Res.modified, "Kenn", "Mehr Infos in der Beschreibung wären gut!");
    await addComment(graph, commentRes2Inner.modified, "Felix", "Ja, das wäre hilfreich!");
    return [conflict1Res.modified, conflict2Res.modified];
}