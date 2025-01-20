<script lang="ts">
import { defineComponent, ref, onMounted, watch } from "vue";
import { useColorMode } from "@vueuse/core";
import { getActivities, getActivityDetail } from "@/data/knowledge_graph/knowledge_graph";

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
         * @property {number} x1: x-coordinate of the stroke starting point
         * @property {number} x2: x-coordinate of the stroke end point
         * @property {number} y1: y-coordinate of the stroke starting point
         * @property {number} y2: y-coordinate of the stroke end point
         * @property {color} color: Color of the line
         * @property {bool} active: Specifies if the line is active at the moment
         */
        const lines = [
            { x1: triangleWidth / 2, y1: triangleHeight / 8, x2: triangleWidth / 8, y2: (triangleHeight / 8) * 7, color: getLineColor(), active: false }, // Instruments -> Subject
            { x1: triangleWidth / 2, y1: triangleHeight / 8, x2: (triangleWidth / 8) * 7, y2: (triangleHeight / 8) * 7, color: getLineColor(), active: false }, // Instruments -> Object
            { x1: triangleWidth / 8, y1: (triangleHeight / 8) * 7, x2: (triangleWidth / 8) * 7, y2: (triangleHeight / 8) * 7, color: getLineColor(), active: false }, // Subject -> Object
            { x1: triangleWidth / 2, y1: triangleHeight / 8, x2: (triangleWidth / 16) * 5, y2: triangleHeight / 2, color: getLineColor(), active: false }, // Instruments -> Rules
            { x1: triangleWidth / 2, y1: triangleHeight / 8, x2: (triangleWidth / 16) * 11, y2: triangleHeight / 2, color: getLineColor(), active: false }, // Instruments -> Division of Labour
            { x1: triangleWidth / 8, y1: (triangleHeight / 8) * 7, x2: triangleWidth / 2, y2: (triangleHeight / 8) * 7, color: getLineColor(), active: false }, // Subject -> Community
            { x1: (triangleWidth / 8) * 7, y1: (triangleHeight / 8) * 7, x2: triangleWidth / 2, y2: (triangleHeight / 8) * 7, color: getLineColor(), active: false }, // Object -> Community
            { x1: triangleWidth / 8, y1: (triangleHeight / 8) * 7, x2: (triangleWidth / 16) * 5, y2: triangleHeight / 2, color: getLineColor(), active: false }, // Subject -> Rules
            { x1: (triangleWidth / 8) * 7, y1: (triangleHeight / 8) * 7, x2: (triangleWidth / 16) * 11, y2: triangleHeight / 2, color: getLineColor(), active: false }, // Object -> Division of Labour
            { x1: (triangleWidth / 16) * 5, y1: triangleHeight / 2, x2: (triangleWidth / 16) * 11, y2: triangleHeight / 2, color: getLineColor(), active: false }, // Rules -> Division of Labour
            { x1: (triangleWidth / 16) * 5, y1: triangleHeight / 2, x2: triangleWidth / 2, y2: (triangleHeight / 8) * 7, color: getLineColor(), active: false }, // Rules -> Community
            { x1: (triangleWidth / 16) * 11, y1: triangleHeight / 2, x2: triangleWidth / 2, y2: (triangleHeight / 8) * 7, color: getLineColor(), active: true }, // Division of Labour -> Community
        ];

        // Refactoring-Attempt, maybe continue later
        // const newLines = [
        //     //{ pointIds: ["instruments", "rules"], color: getLineColor(), active: true },
        //     //{ pointIds: ["instruments", "division_of_labour"], color: getLineColor(), active: false },
        //     //{ pointIds: ["rules", "division_of_labour"], color: getLineColor(), active: false }, 
        //     { pointIds: ["instruments", "subject"], color: getLineColor(), active: false }, 
        //     { pointIds: ["instruments", "object"], color: getLineColor(), active: false }, 
        //     { pointIds: ["rules", "community"], color: getLineColor(), active: false },
        //     { pointIds: ["community", "division_of_labour"], color: getLineColor(), active: false }, 
        //     { pointIds: ["subject", "rules"], color: getLineColor(), active: false }, 
        //     { pointIds: ["object", "division_of_labour"], color: getLineColor(), active: false }, 
        //     { pointIds: ["subject", "object"], color: getLineColor(), active: false }, 
        //     { pointIds: ["subject", "community"], color: getLineColor(), active: false }, 
        //     { pointIds: ["community", "object"], color: getLineColor(), active: false }, 
        // ]
        //  const pointWithId = (id: string) => points.value.find(point => point.id === id);

        // Array of all points that are currently selected
        const selectedPoints = ref<number[]>([]);


        // applies point-colors based on current theme
        const updateColors = () => {
            // Update point colors
            points.value.forEach((point) => {
                point.color = point.selected === "true" ? "red" : getPointColor();
            });

            // lines.forEach((line) => {
            //     line.color = line.active === true ? "red" : getLineColor()
            // })

            // Update line colors and active status
            if (selectedPoints.value.length === 2 || selectedPoints.value.length === 3) {
                const selectedCoords = selectedPoints.value.map((i) => points.value[i]);

                lines.forEach((line) => {
                    const isConnecting =
                        selectedCoords.some((p) => p.x === line.x1 && p.y === line.y1) &&
                        selectedCoords.some((p) => p.x === line.x2 && p.y === line.y2);

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
                lines.forEach((line) => {
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
            lines.forEach((line) => {
                ctx.beginPath();
                ctx.moveTo(line.x1, line.y1);
                ctx.lineTo(line.x2, line.y2);
                ctx.strokeStyle = line.color;
                ctx.lineWidth = line.active ? 4 : 2;
                ctx.stroke();
            });

            // draw circles where points are
            points.value.forEach((point) => {
                //console.log(`Point Selected: ${point.selected} ; Point-Color: ${point.color}`)
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
                const [p1, p2, p3] = selectedPoints.value.map((i) => points.value[i]);
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
        };

        const triangles = [
            [0, 3, 4],
            [3, 1, 5],
            [4, 2, 5],
            [3, 4, 5],
        ]

        const isPointInTriangle = (px, py, ax, ay, bx, by, cx, cy) => {
            const area = (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) / 2;
            const area1 = (px * (by - cy) + bx * (cy - py) + cx * (py - by)) / 2;
            const area2 = (ax * (py - cy) + px * (cy - ay) + cx * (ay - py)) / 2;
            const area3 = (ax * (by - py) + bx * (py - ay) + px * (ay - by)) / 2;

            return Math.abs(area - (area1 + area2 + area3)) < 0.01;
        };




        // Handles logic when a point is clicked
        const handleClick = (event: MouseEvent) => {
            if (!canvas.value) return;
            const rect = canvas.value.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            console.log(mouseX, mouseY);

            // for (const triangle of triangles) {
            //     const [a, b, c] = triangle.map((i) => points.value[i]);
            //     if (isPointInTriangle(mouseX, mouseY, a.x, a.y, b.x, b.y, c.x, c.y)) {
            //         // Wähle alle Punkte dieses Dreiecks aus
            //         triangle.forEach((index) => {
            //             if (!selectedPoints.value.includes(index)) {
            //                 selectedPoints.value.push(index);
            //                 points.value[index].selected = "true";
            //             }
            //         });
            //         updateColors();
            //         return;
            //     }
            // }

            points.value.forEach((point, index) => {
                const distance = Math.sqrt((mouseX - point.x) ** 2 + (mouseY - point.y) ** 2);
                if (distance < triangleHeight / 40) {
                    if (!selectedPoints.value.includes(index)) {
                        selectedPoints.value.push(index);
                        point.selected = "true";
                    } else {
                        selectedPoints.value = selectedPoints.value.filter((i) => i !== index);
                        point.selected = "false";
                    }

                    updateColors();
                }
            });
        };

        onMounted(() => {
            //console.log(getActivities());

            draw();

        });

        watch(mode, () => {
            updateColors();
        })

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