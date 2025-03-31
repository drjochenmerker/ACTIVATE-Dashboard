<script lang="ts">
import { defineComponent, ref, onMounted, watch, computed } from "vue";
import PointHoverPopUp from '@/components/PointHoverPopUp.vue';
import { useColorMode } from "@vueuse/core";
import { Button } from '@/components/ui/button';
import { useActivityPointsStore } from "@/stores/activityPointsStore";
import { Activity, Conflict } from "@/data/knowledge_graph/structures";
import ConflictHoverPopUp from "./ConflictHoverPopUp.vue";
import { useConflictsStore } from "@/stores/conflictsStore";
import { calculateConflictPositions } from "@/composables/calculateConflictPositions";
import { useSessionStore } from "@/stores/sessionStore";
import { getActivityDetail } from "@/data/knowledge_graph/read_operations";
import { useRouter } from "vue-router";

/** 
 * Activity-Diagram-Component
 * Visualization of the active and inactive elements of the Activity-Diagram
 */
export default defineComponent({
    name: "ActivityDiagramCanvas",
    components: {
        ConflictHoverPopUp,
        PointHoverPopUp,
        Button
    },

    /**
     * Setup-Function
     * Sets up the canvas of the component with the given Height and Width
     * Adds every point with its label to the canvas
     * Adds every needed line between points to the canvas
     */
    setup() {
        const canvas = ref<HTMLCanvasElement | null>(null);

        // Dimensions of the activity diagram. Possibly dynamic in the future
        const triangleWidth = 900;
        const triangleHeight = 800;

        // Define router for routing in handleClickFunction
        const router = useRouter();

        // Current color mode (Light- or Dark-Mode)
        const mode = useColorMode();

        // Stores for the active points and conflicts
        const activityPointStore = useActivityPointsStore();
        const conflictStore = useConflictsStore();
        const sessionStore = useSessionStore();

        // Data of the hovered point
        const hoveredPointData = ref<null | {
            label: string;
            content: Array<{ label: string, value?: string }>;
        }>(null);

        // Data of the hovered conflict point
        const hoveredConflictPointData = ref<null | Conflict>(null);

        // Position of the hover popup we need to give to the PointHoverPopUp component
        const hoverPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 });

        // Conflict Data
        let conflictData = conflictStore.getConflicts;
        const activityData = ref<any>(null);

        // Checks if the Activity-Diagram has to be cleared when a Comment is sent by the editor
        let hasToBeCleared = computed(() => activityPointStore.getActivePoints.length === 0);

        // Changes Point-Colors based on current Theme
        const getPointColor = () => (mode.value === "dark" ? "lightgray" : "white");
        const getLineColor = () => (mode.value === "dark" ? "gray" : "black");

        /**
         * Points of the activity diagram
         * @property {number} x: x-coordinate of the point
         * @property {number} y: y-coordinate of the point
         * @property {string} label: Label of the point
         * @property {color} color: Fill Color of the point
         * @property {boolean} active: Specifies if the point is active at the moment.
         * @property {boolean} highlighted: Specifies if the point is highlighted at the moment.
         */
        const points = ref([
            { x: triangleWidth / 2, y: triangleHeight / 8, id: "instruments", label: "Instruments", color: getPointColor(), active: false, highlighted: false }, // Ecke oben
            { x: triangleWidth / 8, y: (triangleHeight / 8) * 7, id: "rules", label: "Rules", color: getPointColor(), active: false, highlighted: false }, // Ecke Links Unten
            { x: (triangleWidth / 8) * 7, y: (triangleHeight / 8) * 7, id: "division_of_labour", label: "Division of Labour", color: getPointColor(), active: false, highlighted: false }, // Ecke Rechts Unten
            { x: (triangleWidth / 16) * 5, y: triangleHeight / 2, id: "subject", label: "Subject", color: getPointColor(), active: false, highlighted: false }, // Links Mitte
            { x: (triangleWidth / 16) * 11, y: triangleHeight / 2, id: "object", label: "Object(ive)", color: getPointColor(), active: false, highlighted: false }, // Rechts Mitte
            { x: triangleWidth / 2, y: (triangleHeight / 8) * 7, id: "community", label: "Community", color: getPointColor(), active: false, highlighted: false }, // Unten Mitte
        ]);

        /**
         * Lines of the activity diagram
         * @property {Array} pointIds: Array of point IDs that the line connects
         * @property {color} color: Color of the line
         * @property {bool} active: Specifies if the line is active at the moment
         */
        const lines = ref([
            { pointIds: ["instruments", "subject"], color: getLineColor(), active: false },
            { pointIds: ["instruments", "object"], color: getLineColor(), active: false },
            { pointIds: ["rules", "community"], color: getLineColor(), active: false },
            { pointIds: ["community", "division_of_labour"], color: getLineColor(), active: false },
            { pointIds: ["subject", "rules"], color: getLineColor(), active: false },
            { pointIds: ["object", "division_of_labour"], color: getLineColor(), active: false },
            { pointIds: ["subject", "object"], color: getLineColor(), active: false },
            { pointIds: ["subject", "community"], color: getLineColor(), active: false },
            { pointIds: ["community", "object"], color: getLineColor(), active: false },
            { pointIds: ["subject", "division_of_labour"], color: getLineColor(), active: false },
            { pointIds: ["rules", "object"], color: getLineColor(), active: false },
            { pointIds: ["instruments", "community"], color: getLineColor(), active: false },
        ]);

        /**
        * Triangles of the activity diagram
        * @property {Array} pointIds: Array of the corner point IDs
        */
        const triangles = ref([
            { pointIds: ["instruments", "subject", "object"] },
            { pointIds: ["subject", "rules", "community"] },
            { pointIds: ["subject", "community", "object"] },
            { pointIds: ["object", "community", "division_of_labour"] },
        ])

        // Array of all points that are currently selected
        const selectedPoints = ref<string[]>([]);

        // Elements thatt are currently hovered
        const hoveredPoint = ref<string | null>(null);
        const hoveredTriangle = ref<{ pointIds: string[] } | null>(null);

        // Positions of the conflict points
        let conflictPositions = calculateConflictPositions(conflictData, points.value, 20);

        /**
         * Updates the selected points using the activityPointStore based on the active property of the points
         */
        const updatePoints = () => {
            selectedPoints.value = points.value.filter((point) => point.active).map((point) => point.id);
            activityPointStore.setActivePoints(selectedPoints.value);
        };

        /**
         * Checks if a defined point is inside a defined triangle, used for hover and click events
         */
        const isPointInTriangle = (x: number, y: number, triangle: { pointIds: string[] }) => {
            const [point1, point2, point3] = triangle.pointIds.map((id) => points.value.find((p) => p.id === id));
            if (point1 && point2 && point3) {
                // Calculate the area of the whole triangle
                const triangleArea = Math.abs((point1.x * (point2.y - point3.y) + point2.x * (point3.y - point1.y) + point3.x * (point1.y - point2.y)) / 2);

                // Calculate the area of the triangle formed by the clicked point and two vertices of the triangle
                const area1 = Math.abs((x * (point2.y - point3.y) + point2.x * (point3.y - y) + point3.x * (y - point2.y)) / 2);
                const area2 = Math.abs((point1.x * (y - point3.y) + x * (point3.y - point1.y) + point3.x * (point1.y - y)) / 2);
                const area3 = Math.abs((point1.x * (point2.y - y) + point2.x * (y - point1.y) + x * (point1.y - point2.y)) / 2);

                // If the sum of the areas of the three triangles is equal to the area of the whole triangle, the point is inside the triangle
                if (triangleArea === area1 + area2 + area3) {
                    return true;
                } else {
                    return false;
                }
            }
        }

        /**
        * Checks if a defined triangle is clicked by checking rates of the areas
        * @param {number} mouseX: x-coordinate of the clicked point
        * @param {number} mouseY: y-coordinate of the clicked point
        */
        const checkIfTriangleIsClicked = (mouseX: number, mouseY: number) => {
            triangles.value.forEach((triangle) => {
                if (isPointInTriangle(mouseX, mouseY, triangle)) {
                    toggleTriangle(triangle);
                }
            });
        };

        /**
         * Toggles the active state of a triangle and its connected points and lines
         */
        const toggleTriangle = (triangle: { pointIds: string[] }) => {
            const triangleIsActive = triangle.pointIds.every((id) => {
                return selectedPoints.value.includes(id);
            });

            deselectEverything();

            // Select all points of the triangle
            triangle.pointIds.forEach((id) => {
                const point = points.value.find((p) => p.id === id);
                if (point) {
                    point.active = !triangleIsActive;
                }
            });

            // Activate all lines connected to the triangle's points
            lines.value.forEach((line) => {
                const isConnected = line.pointIds.every((id) => triangle.pointIds.includes(id));
                if (isConnected) {
                    line.active = !triangleIsActive;
                    line.color = triangleIsActive ? getLineColor() : "blue";
                }
            });

            updateColors();
        };

        /**
         * Deselects all points and lines, resets their colors and active states
         */
        const deselectEverything = () => {
            points.value.forEach((point) => {
                point.active = false;
            });

            lines.value.forEach((line) => {
                line.active = false;
                line.color = getLineColor();
            });

            updatePoints();
        };

        /** 
         * Updates the hover state of the canvas, sets the hoveredPoint and hoveredTriangle
         */
        const updateHoverState = (mouseX: number, mouseY: number) => {
            hoveredPoint.value = null;
            hoveredTriangle.value = null;

            points.value.forEach((point) => {
                const distance = Math.sqrt((mouseX - point.x) ** 2 + (mouseY - point.y) ** 2);
                if (distance < triangleHeight / 40) {
                    hoveredPoint.value = point.id;
                }
            });

            if (!hoveredPoint.value && !hoveredConflictPointData.value) {
                triangles.value.forEach((triangle) => {
                    if (isPointInTriangle(mouseX, mouseY, triangle)) {
                        hoveredTriangle.value = triangle;
                    }
                });
            }
        };

        /** 
         * Applies point-colors based on current theme, updates the colors of the points and lines
         */
        const updateColors = () => {
            updatePoints();

            // Update point colors
            points.value.forEach((point) => {
                if (hoveredPoint.value === point.id && !point.active) {
                    point.color = "deepskyblue";
                } else if (point.highlighted) {
                    point.color = "deepskyblue";
                } else {
                    point.color = point.active ? "blue" : getPointColor();
                }
            });

            // Update line colors and active status
            if (selectedPoints.value.length === 2 || selectedPoints.value.length === 3) {
                const selectedIds = selectedPoints.value;

                lines.value.forEach((line) => {
                    const isConnecting = line.pointIds.every((id) => selectedIds.includes(id));

                    if (isConnecting) {
                        line.color = "blue";
                        line.active = true;
                    } else {
                        line.color = getLineColor();
                        line.active = false;
                    }
                });
            } else {
                // Reset all lines if selection is invalid
                lines.value.forEach((line) => {
                    line.color = getLineColor();
                    line.active = false;
                });
            }

            draw();
        };

        /**
         * Draw-Function of the canvas
         * Draws the points, lines and triangles of the activity diagram
         * Highlights the hovered point and triangle
         * Highlights the conflict points, selected points and lines
         */
        const draw = () => {
            if (!canvas.value) return;
            const ctx = canvas.value.getContext("2d");
            if (!ctx) return;

            // Reset canvas
            ctx.clearRect(0, 0, triangleWidth, triangleHeight);

            // If traingle is hovered, draw it with a slightly red fill
            if (hoveredTriangle.value) {
                const [p1, p2, p3] = hoveredTriangle.value.pointIds.map((id) => points.value.find((p) => p.id === id));
                if (p1 && p2 && p3) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(p3.x, p3.y);
                    ctx.closePath();
                    ctx.fillStyle = "rgba(0, 191, 255, 0.5)";
                    ctx.stroke();
                    ctx.fill();
                }
            }

            // Draw red triangle between 3 points if 3 points are currently selected
            if (selectedPoints.value.length === 3) {
                const [p1, p2, p3] = selectedPoints.value.map((id) => points.value.find((p) => p.id === id));
                if (p1 && p2 && p3) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(p3.x, p3.y);
                    ctx.closePath();
                    ctx.strokeStyle = "blue";
                    ctx.fillStyle = "rgba(0, 191, 255, 0.5)";
                    ctx.stroke();
                    ctx.fill();
                }
            }

            // Draw lines
            lines.value.forEach((line) => {
                const [point1, point2] = line.pointIds.map((id) => points.value.find((p) => p.id === id));
                if (point1 && point2) {
                    ctx.beginPath();
                    ctx.moveTo(point1.x, point1.y);
                    ctx.lineTo(point2.x, point2.y);
                    ctx.strokeStyle = line.color;
                    ctx.lineWidth = line.active ? 4 : 2;
                    ctx.stroke();
                }
            });

            // Draw circles where points are
            points.value.forEach((point) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, triangleHeight / 40, 0, 2 * Math.PI);
                ctx.fillStyle = point.color;
                ctx.fill();
                ctx.strokeStyle = "black";
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw labels for each point
                ctx.fillStyle = mode.value === "dark" ? "white" : "black";
                point.active ? ctx.font = `bold ${triangleHeight / 40}px Arial` : ctx.font = `${triangleHeight / 40}px Arial`;
                ctx.textAlign = "center";
                if (point.id === "rules" || point.id === "community" || point.id === "division_of_labour") ctx.fillText(point.label, point.x, point.y + triangleHeight / 20);
                if (point.id === "instruments") ctx.fillText(point.label, point.x, point.y - triangleHeight / 30);
                if (point.id === "subject") ctx.fillText(point.label, point.x - triangleWidth / 30, point.y - triangleHeight / 30);
                if (point.id === "object") ctx.fillText(point.label, point.x + triangleWidth / 20, point.y - triangleHeight / 30);

            });

            // Draw conflict points based on conflict positions and status
            if (conflictPositions.value.length > 0) {
                conflictPositions.value.forEach((conflict: any) => {
                    ctx.beginPath();
                    ctx.arc(conflict.x, conflict.y, triangleHeight / 80, 0, 2 * Math.PI);
                    ctx.fillStyle = conflict.status == "gelöst" ? "green" : conflict.status == "in Besprechung" ? "yellow" : "red";
                    ctx.fill();
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                });
            }
        };

        /**
         * Handles logic when the mouse hovers over the canvas, updates the hoverPosition and the hoveredPointData
         */
        const handleHover = (event: MouseEvent) => {
            if (!canvas.value) return;
            const rect = canvas.value.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            hoverPosition.value = { x: mouseX + 10, y: mouseY + 10 };

            let foundPoint: { label: string; content: Array<string>; } | null = null;

            // Check if a point is hovered -> if yes, set foundPoint to the hovered point, set hoveredPosition for hoverPopUp
            points.value.forEach((point) => {
                const distance = Math.sqrt((mouseX - point.x) ** 2 + (mouseY - point.y) ** 2);
                if (distance < triangleHeight / 40) {
                    foundPoint = { label: point.label, content: activityData.value[point.id] || [] };

                    // Adjust hoverPosition for cases in which the hoverPopUp would be outside the canvas
                    // TODO: Maybe find a better dynamic way to adjust the hoverPosition
                    if (foundPoint.label === "Rules" || foundPoint.label === "Community" || foundPoint.label === "Division of Labour") {
                        hoverPosition.value.y -= 100
                    }
                }
            });

            let foundConflictPoint: Conflict | null = null;

            // Check if a conflict point is hovered -> if yes, set foundConflictPoint to the hovered conflict point
            conflictPositions.value.forEach((conflict) => {
                const distance = Math.sqrt((mouseX - conflict.x) ** 2 + (mouseY - conflict.y) ** 2);
                if (distance < triangleHeight / 80) {
                    foundConflictPoint = conflict;
                }
            });

            hoveredPointData.value = foundPoint ? foundPoint : null;
            hoveredConflictPointData.value = foundConflictPoint ? foundConflictPoint : null;

            updateHoverState(mouseX, mouseY);
            updateColors();
        };

        /**
         * Handles logic when a point on the diagram is clicked, updates the active state of the clicked point
         */
        const handleClick = (event: MouseEvent) => {
            if (!canvas.value) return;
            const rect = canvas.value.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            let pointWasClicked = false;
            let conflictPointWasClicked = false;

            points.value.forEach((point) => {
                const distance = Math.sqrt((mouseX - point.x) ** 2 + (mouseY - point.y) ** 2);
                if (distance < triangleHeight / 40) {
                    pointWasClicked = true;
                    point.active = !point.active;

                    updateColors();
                }
            });

            conflictPositions.value.forEach((conflict) => {
                const distance = Math.sqrt((mouseX - conflict.x) ** 2 + (mouseY - conflict.y) ** 2);
                if (distance < triangleHeight / 80) {
                    conflictPointWasClicked = true;

                    const conflictParticipantTypes = conflict.participants.map((participant: { type: any; }) => participant.type)

                    router.push(`/${conflictParticipantTypes[0]}`)
                }
            });

            if (!pointWasClicked && !conflictPointWasClicked) {
                checkIfTriangleIsClicked(mouseX, mouseY);
            }
        };

        // Draws the activity diagram when mounted
        onMounted(async () => {
            activityData.value = await getActivityDetail(sessionStore.sessionActivity as Activity)
            await conflictStore.refreshConflictList();
            conflictData = conflictStore.getConflicts;
            conflictPositions = calculateConflictPositions(conflictData, points.value, 20);
            draw();
        });

        // Watchers for the mode, the hasToBeCleared state and the hoveredConflictPointData
        watch(mode, () => {
            updateColors();
        });

        // Watcher for the hasToBeCleared state
        watch(hasToBeCleared, () => {
            if (hasToBeCleared.value) {
                deselectEverything();
                updateColors();
                draw();
            }
        });

        // Watcher for the hoveredConflictPointData
        watch(hoveredConflictPointData, (newConflict) => {
            const conflictTypes = newConflict
                ? newConflict.participants.map(participant => participant.type)
                : [];

            points.value.forEach(point => {
                point.highlighted = conflictTypes.includes(point.id);
            });
            updateColors();
        });

        // Watcher for the conflictsStore
        watch(conflictStore.getConflicts, () => {
            draw();
        });



        return {
            canvas,
            triangleWidth,
            triangleHeight,
            handleClick,
            handleHover,
            hoveredPointData,
            hoveredConflictPointData,
            hoverPosition,
        };
    },
});
</script>

<template>
    <div @mouseleave="hoveredPointData = null">
        <canvas ref="canvas" :width="triangleWidth" :height="triangleHeight" @mousemove="handleHover"
            @click="handleClick" />

        <PointHoverPopUp v-if="hoveredPointData" :hoveredPoint="hoveredPointData" :position="hoverPosition" />
        <ConflictHoverPopUp v-if="hoveredConflictPointData" :hoveredConflictPoint="hoveredConflictPointData"
            :position="hoverPosition" />
    </div>
</template>

<style scoped></style>
