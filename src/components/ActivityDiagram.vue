<script lang="ts">
import { defineComponent, ref, onMounted, watch, computed } from "vue";
import HoverPopUp from '@/components/HoverPopUp.vue';
import { useColorMode } from "@vueuse/core";
import { Button } from '@/components/ui/button';
import { useActivityPointsStore } from "@/stores/activityPointsStore";
import { Conflict, conflictStatus } from "@/data/knowledge_graph/structures";

/** 
 * Activity-Diagram-Component
 * Visualization of the active and inactive elements of the Activity-Diagram
 */
export default defineComponent({
    name: "ActivityDiagramCanvas",
    components: {
        HoverPopUp,
        Button
    },

    props: {
        activity: {
            type: Object,
            default: () => ({})
        },
        activityConflicts: {
            type: Array,
            default: () => []
        }
    },

    /**
     * Setup-Function
     * Sets up the canvas of the component with the given Height and Width
     * Adds every point with its label to the canvas
     * Adds every needed line between points to the canvas
     */
    setup(props) {
        const canvas = ref<HTMLCanvasElement | null>(null);
        const triangleWidth = 900;
        const triangleHeight = 800;
        const mode = useColorMode();
        const activityPointStore = useActivityPointsStore();

        const testConflict = {
        author: "Clemens Berkenhoff",
        description: "Dies ist ein Testkonflikt, um mögliche Konflikte in der Anwendung zu testen.",
        id: "testConflict",
        participants: [
            { id: "NursingSpecialist1", type: "object" },
            { id: "DoL", type: "division_of_labour" },
            { id: "Community1", type: "community" },
        ],
        replies: [
            {comment: "Das ist ein Kommentar", author: "Clemens Berkenhoff", id: "testComment"},
            {comment: "Das ist ein weiterer Kommentar", author: "Clemens Berkenhoff", id: "testComment2"},
            {comment: "Das ist ein letzter Kommentar", author: "Clemens Berkenhoff", id: "testComment3"},
        ],
        status: conflictStatus.open,
        timestamp: new Date(),
        title: "Test Konflikt"
        }

        const testConflict2 = {
        author: "Clemens Berkenhoff",
        description: "Dies ist ein Testkonflikt, um mögliche Konflikte in der Anwendung zu testen.",
        id: "testConflict",
        participants: [
            { id: "Rule1", type: "rules" },
            { id: "Community1", type: "community" }
        ],
        replies: [
            {comment: "Das ist ein Kommentar", author: "Clemens Berkenhoff", id: "testComment"},
            {comment: "Das ist ein weiterer Kommentar", author: "Clemens Berkenhoff", id: "testComment2"},
            {comment: "Das ist ein letzter Kommentar", author: "Clemens Berkenhoff", id: "testComment3"},
        ],
        status: conflictStatus.inDiscussion,
        timestamp: new Date(),
        title: "Test Konflikt 2"
        }

        // Data of the hovered point
        const hoveredPointData = ref<null | {
            label: string;
            content: Array<{ label: string, value?: string }>;
        }>(null);

        // Position of the hover popup
        const hoverPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 });

        // Data from the props
        const activityData = props.activity;
        const conflictData = props.activityConflicts as Conflict[];

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
         */
        const points = ref([
            { x: triangleWidth / 2, y: triangleHeight / 8, id: "instruments", label: "Instruments", color: getPointColor(), active: false }, // Ecke oben
            { x: triangleWidth / 8, y: (triangleHeight / 8) * 7, id: "rules", label: "Rules", color: getPointColor(), active: false }, // Ecke Links Unten
            { x: (triangleWidth / 8) * 7, y: (triangleHeight / 8) * 7, id: "division_of_labour", label: "Division of Labour", color: getPointColor(), active: false }, // Ecke Rechts Unten
            { x: (triangleWidth / 16) * 5, y: triangleHeight / 2, id: "subject", label: "Subject", color: getPointColor(), active: false }, // Links Mitte
            { x: (triangleWidth / 16) * 11, y: triangleHeight / 2, id: "object", label: "Object", color: getPointColor(), active: false }, // Rechts Mitte
            { x: triangleWidth / 2, y: (triangleHeight / 8) * 7, id: "community", label: "Community", color: getPointColor(), active: false }, // Unten Mitte
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

        const hoveredPoint = ref<string | null>(null);
        const hoveredTriangle = ref<{ pointIds: string[] } | null>(null);

        const conflictPositions = computed(() => {
            return conflictData.map((conflict: Conflict) => {

                const participantPoints = conflict.participants
                    .map((participant) => points.value.find((p) => p.id === participant.type))
                    .filter((p): p is { x: number; y: number; id: string; label: string; color: string; active: boolean } => !!p);

                if (participantPoints.length) {
                    const avgX = participantPoints.reduce((sum, p) => sum + p.x, 0) / participantPoints.length;
                    const avgY = participantPoints.reduce((sum, p) => sum + p.y, 0) / participantPoints.length;
                    return { ...conflict, x: avgX, y: avgY };
                }
                return null;
            }).filter((pos) => pos !== null);
        });

        const updatePoints = () => {
            selectedPoints.value = points.value.filter((point) => point.active).map((point) => point.id);
            activityPointStore.setActivePoints(selectedPoints.value);
        };

        const isPointInTriangle = (x: number, y: number, triangle: { pointIds: string[] }) => {
            const [point1, point2, point3] = triangle.pointIds.map((id) => points.value.find((p) => p.id === id));
            if (point1 && point2 && point3) {
                // Calculate the area of the whole triangle
                const triangleArea = Math.abs((point1.x * (point2.y - point3.y) + point2.x * (point3.y - point1.y) + point3.x * (point1.y - point2.y)) / 2);

                // Calculate the area of the triangle formed by the clicked point and two vertices of the triangle
                const area1 = Math.abs((x * (point2.y - point3.y) + point2.x * (point3.y - y) + point3.x * (y - point2.y)) / 2);
                const area2 = Math.abs((point1.x * (y - point3.y) + x * (point3.y - point1.y) + point3.x * (point1.y - y)) / 2);
                const area3 = Math.abs((point1.x * (point2.y - y) + point2.x * (y - point1.y) + x * (point1.y - point2.y)) / 2);

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
                    line.color = triangleIsActive ? getLineColor() : "red";
                }
            });

            updateColors();
        };

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

        const updateHoverState = (mouseX: number, mouseY: number) => {
            hoveredPoint.value = null;
            hoveredTriangle.value = null;

            points.value.forEach((point) => {
                const distance = Math.sqrt((mouseX - point.x) ** 2 + (mouseY - point.y) ** 2);
                if (distance < triangleHeight / 40) {
                    hoveredPoint.value = point.id;
                }
            });

            if (!hoveredPoint.value) {
                triangles.value.forEach((triangle) => {
                    if (isPointInTriangle(mouseX, mouseY, triangle)) {
                        hoveredTriangle.value = triangle;
                    }
                });
            }
        };

        // applies point-colors based on current theme
        const updateColors = () => {
            updatePoints();

            // Update point colors
            points.value.forEach((point) => {
                if (hoveredPoint.value === point.id && !point.active) {
                    point.color = "#ff9999";
                } else {
                    point.color = point.active ? "red" : getPointColor();
                }
            });

            // Update line colors and active status
            if (selectedPoints.value.length === 2 || selectedPoints.value.length === 3) {
                const selectedIds = selectedPoints.value;

                lines.value.forEach((line) => {
                    const isConnecting = line.pointIds.every((id) => selectedIds.includes(id));

                    if (isConnecting) {
                        line.color = "red";
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
         */
        const draw = () => {
            if (!canvas.value) return;
            const ctx = canvas.value.getContext("2d");
            if (!ctx) return;

            // reset canvas
            ctx.clearRect(0, 0, triangleWidth, triangleHeight);

            if (hoveredTriangle.value) {
                const [p1, p2, p3] = hoveredTriangle.value.pointIds.map((id) => points.value.find((p) => p.id === id));
                if (p1 && p2 && p3) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(p3.x, p3.y);
                    ctx.closePath();
                    ctx.fillStyle = "rgba(255, 153, 153, 0.5)";
                    ctx.stroke();
                    ctx.fill();
                }
            }

            // draw lines
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

            // draw circles where points are
            points.value.forEach((point) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, triangleHeight / 40, 0, 2 * Math.PI);
                ctx.fillStyle = point.color;
                ctx.fill();
                ctx.strokeStyle = "black";
                ctx.lineWidth = 2;
                ctx.stroke();

                // draw labels for each point
                ctx.fillStyle = mode.value === "dark" ? "white" : "black";
                point.active ? ctx.font = `bold ${triangleHeight / 40}px Arial` : ctx.font = `${triangleHeight / 40}px Arial`;
                ctx.textAlign = "center";
                if (point.id === "rules" || point.id === "community" || point.id === "division_of_labour") ctx.fillText(point.label, point.x, point.y + triangleHeight / 20);
                if (point.id === "instruments") ctx.fillText(point.label, point.x, point.y - triangleHeight / 30);
                if (point.id === "subject") ctx.fillText(point.label, point.x - triangleWidth / 30, point.y - triangleHeight / 30);
                if (point.id === "object") ctx.fillText(point.label, point.x + triangleWidth / 30, point.y - triangleHeight / 30);

            });

            // draw red triangle between 3 points if 3 points are currently selected
            if (selectedPoints.value.length === 3) {
                const [p1, p2, p3] = selectedPoints.value.map((id) => points.value.find((p) => p.id === id));
                if (p1 && p2 && p3) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(p3.x, p3.y);
                    ctx.closePath();
                    ctx.strokeStyle = "red";
                    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
                    ctx.stroke();
                    ctx.fill();
                }
            }

            if (conflictPositions.value.length > 0) {
                conflictPositions.value.forEach((conflict: any) => {
                    // Zeichne einen kleinen Kreis als Konfliktindikator
                    ctx.beginPath();
                    ctx.arc(conflict.x, conflict.y, triangleHeight / 80, 0, 2 * Math.PI);
                    ctx.fillStyle = conflict.status == "gelöst" ? "green" : conflict.status == "in Besprechung" ? "yellow" : "red";
                    ctx.fill();
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                });
            }
        };

        const handleHover = (event: MouseEvent) => {
            if (!canvas.value) return;
            const rect = canvas.value.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            hoverPosition.value = { x: mouseX + 50, y: mouseY + 10 };

            let foundPoint: { label: string; content: Array<string>; } | null = null;

            points.value.forEach((point) => {
                const distance = Math.sqrt((mouseX - point.x) ** 2 + (mouseY - point.y) ** 2);
                if (distance < triangleHeight / 40) {
                    foundPoint = { label: point.label, content: activityData[point.id] || [] };

                    if (foundPoint.label === "Rules" || foundPoint.label === "Community" || foundPoint.label === "Division of Labour") {
                        hoverPosition.value.y -= 100
                    }
                }
            });

            hoveredPointData.value = foundPoint ? foundPoint : null;

            updateHoverState(mouseX, mouseY);
            updateColors();
        };

        // Handles logic when a point is clicked
        const handleClick = (event: MouseEvent) => {
            if (!canvas.value) return;
            const rect = canvas.value.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            let pointWasClicked = false;

            points.value.forEach((point) => {
                const distance = Math.sqrt((mouseX - point.x) ** 2 + (mouseY - point.y) ** 2);
                if (distance < triangleHeight / 40) {
                    pointWasClicked = true;
                    point.active = !point.active;

                    updateColors();
                }
            });

            if (!pointWasClicked) {
                checkIfTriangleIsClicked(mouseX, mouseY);
            }
        };

        onMounted(() => {
            console.log(conflictData)
            conflictData.push(testConflict);
            conflictData.push(testConflict2);
            draw();
        });

        watch(mode, () => {
            updateColors();
        });

        watch(hasToBeCleared, () => {
            if (hasToBeCleared.value) {
                deselectEverything();
                updateColors();
                draw();
            }
        });

        return {
            canvas,
            triangleWidth,
            triangleHeight,
            handleClick,
            handleHover,
            hoveredPointData,
            hoverPosition,
        };
    },
});
</script>

<template>
    <div class="container" @mouseleave="hoveredPointData = null">
        <canvas ref="canvas" :width="triangleWidth" :height="triangleHeight" @mousemove="handleHover"
            @click="handleClick" />

        <HoverPopUp v-if="hoveredPointData" :hoveredPoint="hoveredPointData" :position="hoverPosition" />
    </div>
</template>

<style scoped>
canvas {
    display: block;
    margin: 0;
    flex: 2;
}

.container {
    display: flex;
    align-items: center;
    gap: 20px;

}

.editor-placeholder {
    transition: opacity 0.3s ease-in-out;
    flex: 3;
}
</style>
