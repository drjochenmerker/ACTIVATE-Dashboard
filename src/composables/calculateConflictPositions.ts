import { computed, ComputedRef } from "vue";
import { Conflict } from "@/data/knowledge_graph/structures";

/**
 * Definition of a Point in the Activity-Diagram.
 */
interface Point {
    x: number;
    y: number;
    id: string;
    label: string;
    color: string;
    active: boolean;
    highlighted: boolean;
}

/**
 * Calculates the positions for conflictPoints based on the grouping
 * - singlePointGroup (conflict with one participantType)
 * - lineGroup (exactly 2 different participantTypes)
 * - triangleGroup (exactly 3 different participantTypes)
 * - and other cases. (do we need them?)
 *
 * @param conflictData - Array of every conflict of the Activity
 * @param points - Array of every Point of the Diagram
 * @param spacing - spacing between the conflictPoints
 *
 * @returns ComputedRef with Array of Objects containing the positions for every conflictPoints
 */
export function calculateConflictPositions(
    conflictData: Conflict[],
    points: Point[],
    spacing: number = 20,
): ComputedRef<any[]> {
    return computed(() => {
        const result: Array<any> = [];

        // Define possible groups
        const singlePointGroups: Map<string, Conflict[]> = new Map();
        const lineGroups: Map<string, Conflict[]> = new Map();
        const triangleGroups: Map<string, Conflict[]> = new Map();

        // Group conflicts by amount of participant types
        conflictData.forEach((conflict: Conflict) => {
            const uniqueTypes = new Set(conflict.participants.map((p) => p.type));
            if (uniqueTypes.size === 1) {
                const key = Array.from(uniqueTypes)[0];
                if (!singlePointGroups.has(key)) singlePointGroups.set(key, []);
                singlePointGroups.get(key)?.push(conflict);
            } else if (uniqueTypes.size === 2) {
                const types = Array.from(uniqueTypes).sort();
                const key = types.join("-");
                if (!lineGroups.has(key)) lineGroups.set(key, []);
                lineGroups.get(key)?.push(conflict);
            } else if (uniqueTypes.size === 3) {
                const types = Array.from(uniqueTypes).sort();
                const key = types.join("-");
                if (!triangleGroups.has(key)) triangleGroups.set(key, []);
                triangleGroups.get(key)?.push(conflict);
            } else {
                // console.warn('Conflict with more than 3 participant types:', conflict);
            }
        });

        /**
         * Group 1: Single Point Conflicts (Conflicts with 1 participant type)
         * - If there is only one conflict, place it directly next to the point
         * - If there are multiple conflicts, place them in a circle around the point
         */
        singlePointGroups.forEach((conflicts, key) => {
            const point = points.find((p) => p.id === key);
            if (point) {
                const n = conflicts.length;
                if (n === 1) {
                    const finalX = point.x + spacing;
                    const finalY = point.y;
                    result.push({ ...conflicts[0], x: finalX, y: finalY });
                } else {
                    conflicts.forEach((conflict, i) => {
                        const angle = ((2 * Math.PI) / n) * i;
                        const finalX = point.x + spacing * Math.cos(angle);
                        const finalY = point.y + spacing * Math.sin(angle);
                        result.push({ ...conflict, x: finalX, y: finalY });
                    });
                }
            }
        });

        /**
         * Group 2: Line Conflicts (Conflicts with 2 participant types)
         * - Places every conflict on the associated line between the two points with an offset to prevent overlapping
         * - offset leads to vacant space between the conflicts
         */
        lineGroups.forEach((conflicts, key) => {
            const types = key.split("-");
            const pointA = points.find((p) => p.id === types[0]);
            const pointB = points.find((p) => p.id === types[1]);

            if (pointA && pointB) {
                const midX = (pointA.x + pointB.x) / 2;
                const midY = (pointA.y + pointB.y) / 2;
                const dx = pointB.x - pointA.x;
                const dy = pointB.y - pointA.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const lineX = dx / len;
                const lineY = dy / len;

                const n = conflicts.length;
                let offsets: number[] = [];
                if (n === 1) {
                    offsets = [spacing];
                } else {
                    const effectiveCount = n + 1;
                    const allOffsets: number[] = [];
                    for (let i = 0; i < effectiveCount; i++) {
                        const offset = (i - (effectiveCount - 1) / 2) * spacing;
                        allOffsets.push(offset);
                    }
                    let indexToRemove = 0;
                    let minAbs = Math.abs(allOffsets[0]);
                    for (let i = 1; i < allOffsets.length; i++) {
                        const absVal = Math.abs(allOffsets[i]);
                        if (absVal < minAbs) {
                            minAbs = absVal;
                            indexToRemove = i;
                        }
                    }
                    allOffsets.splice(indexToRemove, 1);
                    offsets = allOffsets;
                }

                conflicts.forEach((conflict, i) => {
                    const offset = offsets[i] ?? spacing;
                    const finalX = midX + lineX * offset;
                    const finalY = midY + lineY * offset;
                    result.push({ ...conflict, x: finalX, y: finalY });
                });
            }
        });

        /**
         * Group 3: Triangle Conflicts (Conflicts with 3 participant types)
         * - Places every conflict in a circle around the center of the triangle
         * - offset leads to vacant space between the conflicts
         */
        triangleGroups.forEach((conflicts, key) => {
            const types = key.split("-");
            const pts = types.map((type) => points.find((p) => p.id === type)).filter(Boolean);
            if (pts.length === 3 && pts[0] && pts[1] && pts[2]) {
                const midX = (pts[0].x + pts[1].x + pts[2].x) / 3;
                const midY = (pts[0].y + pts[1].y + pts[2].y) / 3;
                const n = conflicts.length;
                if (n === 1) {
                    result.push({ ...conflicts[0], x: midX, y: midY });
                } else {
                    conflicts.forEach((conflict, i) => {
                        const angle = ((2 * Math.PI) / n) * i;
                        const finalX = midX + spacing * Math.cos(angle);
                        const finalY = midY + spacing * Math.sin(angle);
                        result.push({ ...conflict, x: finalX, y: finalY });
                    });
                }
            }
        });

        return result;
    });
}
