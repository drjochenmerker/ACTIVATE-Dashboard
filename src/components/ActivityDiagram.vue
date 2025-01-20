<script lang="ts">
import { defineComponent, ref, onMounted, watch } from "vue";
import { useColorMode } from "@vueuse/core";

/** 
 * Activity-Diagram-Component
 * Visualization of the active and inactive elements of the Activity-Diagram
 */
export default defineComponent({
    name: "ActivityDiagramCanvas",
    /**
     * Setup-Function
     * Sets up the canvas of the component with the given Height and Width
     * Adds every point with its label to the canvas
     * Adds every needed line between points to the canvas
     */
    setup() {
        const canvas = ref<HTMLCanvasElement | null>(null);
        const triangleWidth = 800;
        const triangleHeight = 800;

        const mode = useColorMode();

        // Changes Point-Colors based on current Theme
        const getPointColor = () => (mode.value === "dark" ? "lightgray" : "white");
        const getLineColor = () => (mode.value === "dark" ? "gray" : "black");

        /**
         * Points of the activity diagram
         * @property {number} x: x-coordinate of the point
         * @property {number} y: y-coordinate of the point
         * @property {string} label: Label of the point
         * @property {color} color: Fill Color of the point
         * @property {string} selected: Specifies if the point is selected at the moment. Accepts "false" and "true"
         */
        const points = ref([
            { x: triangleWidth / 2, y: triangleHeight / 8, id: "instruments", label: "Instruments", color: getPointColor(), selected: "false" }, // Ecke oben
            { x: triangleWidth / 8, y: (triangleHeight / 8) * 7, id: "rules", label: "Rules", color: getPointColor(), selected: "false" }, // Ecke Links Unten
            { x: (triangleWidth / 8) * 7, y: (triangleHeight / 8) * 7, id: "division_of_labour", label: "Division of Labour", color: getPointColor(), selected: "false" }, // Ecke Rechts Unten
            { x: (triangleWidth / 16) * 5, y: triangleHeight / 2, id: "subject", label: "Subject", color: getPointColor(), selected: "false" }, // Links Mitte
            { x: (triangleWidth / 16) * 11, y: triangleHeight / 2, id: "object", label: "Object", color: getPointColor(), selected: "false" }, // Rechts Mitte
            { x: triangleWidth / 2, y: (triangleHeight / 8) * 7, id: "community", label: "Community", color: getPointColor(), selected: "false" }, // Unten Mitte
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


        /**
        * Checks if a defined triangle is clicked by checking rates of the areas
        * @param {number} mouseX: x-coordinate of the clicked point
        * @param {number} mouseY: y-coordinate of the clicked point
        */
        const checkIfTriangleIsClicked = (mouseX: number, mouseY: number) => {
            triangles.value.forEach((triangle) => {
                const [point1, point2, point3] = triangle.pointIds.map((id) => points.value.find((p) => p.id === id));
                if (point1 && point2 && point3) {
                    // Calculate the area of the whole triangle
                    const triangleArea = Math.abs((point1.x * (point2.y - point3.y) + point2.x * (point3.y - point1.y) + point3.x * (point1.y - point2.y)) / 2);

                    // Calculate the area of the triangle formed by the clicked point and two vertices of the triangle
                    const area1 = Math.abs((mouseX * (point2.y - point3.y) + point2.x * (point3.y - mouseY) + point3.x * (mouseY - point2.y)) / 2);
                    const area2 = Math.abs((point1.x * (mouseY - point3.y) + mouseX * (point3.y - point1.y) + point3.x * (point1.y - mouseY)) / 2);
                    const area3 = Math.abs((point1.x * (point2.y - mouseY) + point2.x * (mouseY - point1.y) + mouseX * (point1.y - point2.y)) / 2);


                    if (triangleArea === area1 + area2 + area3) {
                        toggleTriangle(triangle);
                    }
                }
            })
        }

        const toggleTriangle = (triangle: { pointIds: string[] }) => {
            const triangleIsActive = triangle.pointIds.every((id) => {
                return selectedPoints.value.includes(id);
            });

            deselectEverything()

            // Select all points of the triangle
            triangle.pointIds.forEach((id) => {
                const point = points.value.find((p) => p.id === id);
                if (point && !selectedPoints.value.includes(id)) {
                    selectedPoints.value.push(id);
                    point.selected = triangleIsActive ? "false" : "true";
                }
            });

            // Activate all lines connected to the triangle's points
            lines.value.forEach((line) => {
                const isConnected = line.pointIds.every((id) => triangle.pointIds.includes(id));
                if (isConnected) {
                    line.active = triangleIsActive ? false : true;
                    line.color = triangleIsActive ? getLineColor() : "red";
                }
            });

            updateColors();
        };

        const deselectEverything = () => {
            points.value.forEach((point) => {
                point.selected = "false";
            });

            lines.value.forEach((line) => {
                line.active = false;
                line.color = getLineColor();
            });

            selectedPoints.value = [];
        }

        const updatePoints = () => {

            }

        // applies point-colors based on current theme
        const updateColors = () => {
            // Update point colors
            points.value.forEach((point) => {
                point.color = point.selected === "true" ? "red" : getPointColor();
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
                ctx.font = `${triangleHeight / 40}px Arial`;
                ctx.textAlign = "center";
                ctx.fillText(point.label, point.x, point.y - triangleHeight / 30);
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
                    if (!selectedPoints.value.includes(point.id)) {
                        selectedPoints.value.push(point.id);
                        point.selected = "true";
                    } else {
                        selectedPoints.value = selectedPoints.value.filter((id) => id !== point.id);
                        point.selected = "false";
                    }

                    updateColors();
                }
            });

            if (!pointWasClicked) { checkIfTriangleIsClicked(mouseX, mouseY) }
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
        };
    },
});
</script>

<template>
    <canvas ref="canvas" :width="triangleWidth" :height="triangleHeight" @click="handleClick"></canvas>
</template>

<style scoped>
canvas {
    display: block;
    margin: auto;
}
</style>
