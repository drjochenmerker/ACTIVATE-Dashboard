<script lang="ts">
import { defineComponent, ref, onMounted, watch, computed } from "vue";
import { useColorMode } from "@vueuse/core";
import { getExampleActivity } from "@/data/knowledge_graph/knowledge_graph";
import { Button } from '@/components/ui/button';
import { noteStatus } from "@/assets/constants/noteStatus";
import { useActivityPointsStore } from "@/stores/activityPointsStore";

/** 
 * Activity-Diagram-Component
 * Visualization of the active and inactive elements of the Activity-Diagram
 */
export default defineComponent({
    name: "ActivityDiagramCanvas",
    components: {
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
        const triangleWidth = 900;
        const triangleHeight = 800;
        const mode = useColorMode();
        const activityPointStore = useActivityPointsStore();

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
        };

        const handleHover = (event: MouseEvent) => {
            if (!canvas.value) return;
            const rect = canvas.value.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
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

            console.log(activityPointStore.getActivePoints);
        };

        const loadActivity = () => {
            getExampleActivity().then((activity) => {
                points.value.forEach((point) => {
                    switch (point.id) {
                        case "instruments": if (Array.isArray(activity.Instrument)) point.label = activity.Instrument[0].label;
                            break;
                        case "subject": if (Array.isArray(activity.Subject)) point.label = activity.Subject[0].label;
                            break;
                        case "object": if (Array.isArray(activity.Object)) point.label = activity.Object[0].label;
                            break;
                        case "rules": if (Array.isArray(activity.Rule)) point.label = activity.Rule[0].label;
                            break;
                        case "community": if (Array.isArray(activity.Community)) point.label = activity.Community[0].label;
                            break;
                        case "division_of_labour": point.label = activity.DivisionOfLabour ? "Arbeitsteilung" : "keine Arbeitsteilung";
                            break;
                    }
                })

                console.log(activity);

                draw();
            });
        };

        // EDITOR: handles logic when the "done"-button of the editor is pressed
        const handleTransfer = (content: any) => {
            // Note Object
            const note = {
                content: content.content,
                isAnonymous: content.isAnonymous,
                // TODO: Add creator to the note object
                // creator: content.creator,
                noteStatus: noteStatus.RED,
                participatingPoints: selectedPoints.value.slice(),
            };

            // Logs the selected points from the note and the content from the editor
            // TODO: Do something with the provided data
            console.log("Participating points:", note.participatingPoints);
            console.log("Number of participating points:", note.participatingPoints.length);
            console.log("Anonymous Status:", note.isAnonymous);
            console.log("Text from the Editor:", note.content);
            console.log("Note Status:", note.noteStatus);

            // save the note in sessionStorage
            // TODO: sparql query to save the note
            let notes = JSON.parse(sessionStorage.getItem('notes')) || []; // Fallback auf leeres Array
            notes.push(note); // Füge die neue Notiz hinzu
            sessionStorage.setItem('notes', JSON.stringify(notes)); // Speichere im sessionStorage

            // Clear the selected points array
            selectedPoints.value = [];
            // Redraw the canvas
            draw();
        };

        onMounted(() => {
            draw();
        });

        watch(mode, () => {
            updateColors();
        });

        return {
            canvas,
            triangleWidth,
            triangleHeight,
            handleClick,
            loadActivity,
            handleHover,
            handleTransfer,
        };
    },
});
</script>

<template>
    <div>
        <Button @click="loadActivity" type="submit"> Load Example Activity </Button>
    </div>

    <div class="container">
        <canvas ref="canvas" :width="triangleWidth" :height="triangleHeight" @mousemove="handleHover"
            @click="handleClick" />
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
