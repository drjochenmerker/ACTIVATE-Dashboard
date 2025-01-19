<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import Editor from "./Editor.vue";

/** 
 * Activity-Diagram-Component
 * Visualization of the active and inactive elements of the Activity-Diagram
 */
export default defineComponent({
    name: "ActivityDiagramCanvas",
    components:{ 
        // EDITOR: Adds Editor to this component
        Editor,
    },
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
        const showEditor = ref(false); // EDITOR: sets the visibility of the editor to false

        /**
         * Points of the activity diagram
         * @property {number} x: x-coordinate of the point
         * @property {number} y: y-coordinate of the point
         * @property {string} label: Label of the point
         * @property {color} color: Fill Color of the point
         * @property {string} selected: Specifies if the point is selected at the moment. Accepts "false" and "true"
         */
        const points = ref([
            { x: triangleWidth / 2, y: triangleHeight / 8, label: "Instruments", color: "white", selected: "false" }, // Ecke oben
            { x: triangleWidth / 8, y: (triangleHeight / 8) * 7, label: "Rules", color: "white", selected: "false" }, // Ecke Links Unten
            { x: (triangleWidth / 8) * 7, y: (triangleHeight / 8) * 7, label: "Division of Labour", color: "white", selected: "false" }, // Ecke Rechts Unten
            { x: (triangleWidth / 16) * 5, y: triangleHeight / 2, label: "Subject", color: "white", selected: "false" }, // Links Mitte
            { x: (triangleWidth / 16) * 11, y: triangleHeight / 2, label: "Object", color: "white", selected: "false" }, // Rechts Mitte
            { x: triangleWidth / 2, y: (triangleHeight / 8) * 7, label: "Community", color: "white", selected: "false" }, // Unten Mitte
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
            { x1: triangleWidth / 2, y1: triangleHeight / 8, x2: triangleWidth / 8, y2: (triangleHeight / 8) * 7, color: "black", active: false }, // Instruments -> Subject
            { x1: triangleWidth / 2, y1: triangleHeight / 8, x2: (triangleWidth / 8) * 7, y2: (triangleHeight / 8) * 7, color: "black", active: false }, // Instruments -> Object
            { x1: triangleWidth / 8, y1: (triangleHeight / 8) * 7, x2: (triangleWidth / 8) * 7, y2: (triangleHeight / 8) * 7, color: "black", active: false }, // Subject -> Object
            { x1: triangleWidth / 2, y1: triangleHeight / 8, x2: (triangleWidth / 16) * 5, y2: triangleHeight / 2, color: "black", active: false }, // Instruments -> Rules
            { x1: triangleWidth / 2, y1: triangleHeight / 8, x2: (triangleWidth / 16) * 11, y2: triangleHeight / 2, color: "black", active: false }, // Instruments -> Division of Labour
            { x1: triangleWidth / 8, y1: (triangleHeight / 8) * 7, x2: triangleWidth / 2, y2: (triangleHeight / 8) * 7, color: "black", active: false }, // Subject -> Community
            { x1: (triangleWidth / 8) * 7, y1: (triangleHeight / 8) * 7, x2: triangleWidth / 2, y2: (triangleHeight / 8) * 7, color: "black", active: false }, // Object -> Community
            { x1: triangleWidth / 8, y1: (triangleHeight / 8) * 7, x2: (triangleWidth / 16) * 5, y2: triangleHeight / 2, color: "black", active: false }, // Subject -> Rules
            { x1: (triangleWidth / 8) * 7, y1: (triangleHeight / 8) * 7, x2: (triangleWidth / 16) * 11, y2: triangleHeight / 2, color: "black", active: false }, // Object -> Division of Labour
            { x1: (triangleWidth / 16) * 5, y1: triangleHeight / 2, x2: (triangleWidth / 16) * 11, y2: triangleHeight / 2, color: "black", active: false }, // Rules -> Division of Labour
            { x1: (triangleWidth / 16) * 5, y1: triangleHeight / 2, x2: triangleWidth / 2, y2: (triangleHeight / 8) * 7, color: "black", active: false }, // Rules -> Community
            { x1: (triangleWidth / 16) * 11, y1: triangleHeight / 2, x2: triangleWidth / 2, y2: (triangleHeight / 8) * 7, color: "black", active: false }, // Division of Labour -> Community
        ];
        
        // Array of all points that are currently selected
        const selectedPoints = ref<number[]>([]);

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
                line.active == true ? ctx.lineWidth = 4 : ctx.lineWidth = 2;
                ctx.stroke();
            });

            // draw circles where points are
            points.value.forEach((point) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, triangleHeight / 40, 0, 2 * Math.PI);
                ctx.fillStyle = point.color;
                ctx.fill();
                ctx.strokeStyle = "black";
                ctx.stroke();

                // draw labels for each point
                ctx.fillStyle = "black";
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
                ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
                ctx.fill();
            }
        };

        // Handles logic when a point is clicked
        const handleClick = (event: MouseEvent) => {
            if (!canvas.value) return;
            const rect = canvas.value.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            points.value.forEach((point, index) => {

                const distance = Math.sqrt((mouseX - point.x) ** 2 + (mouseY - point.y) ** 2);
                if (distance < triangleHeight / 40) {
                    if (!selectedPoints.value.includes(index)) {
                        selectedPoints.value.push(index);
                        point.color = "red";
                    } else {
                        selectedPoints.value = selectedPoints.value.filter((i) => i !== index);
                        point.color = "white";
                    }

                    // reset line color and activeness too few or too many points are selected
                    if (selectedPoints.value.length < 2 || selectedPoints.value.length === 3) {
                        lines.forEach((line) => {
                            line.color = "black";
                            line.active = false;
                        });
                    }

                    // checks if a line should be active at the moment, toggles the boolean and gives active lines a color
                    if (selectedPoints.value.length === 2) {
                        const [p1, p2] = selectedPoints.value.map((i) => points.value[i]);
                        lines.forEach((line) => {
                            if (
                                (line.x1 === p1.x && line.y1 === p1.y && line.x2 === p2.x && line.y2 === p2.y) ||
                                (line.x1 === p2.x && line.y1 === p2.y && line.x2 === p1.x && line.y2 === p1.y)
                            ) {
                                line.color = "rgba(255, 0, 0, 1)";
                                line.active = true;
                            }
                        });
                    } else if (selectedPoints.value.length > 2) {
                        lines.forEach((line) => (line.color = "black"));
                    }

                    // EDITOR: Sets editor to true if at least one point is selected
                    if (selectedPoints.value.length > 0) {
                        showEditor.value = true;
                    } else {
                        showEditor.value = false;
                    }

                    draw();
                }
            });
        };

        // EDITOR: handles logic when the "done"-button of the editor is pressed
        const handleTransfer = (content: any) => {
            // Temporary variable to store the selected points from the note
            const selectedPointsFromNote = selectedPoints.value.slice();

            // Logs the selected points from the note and the content from the editor
            // TODO: Do something with the provided data
            console.log("Participating points:", selectedPointsFromNote);
            console.log("Number of participating points:", selectedPointsFromNote.length);
            console.log("Text from the Editor:", content);


            // Reset points and lines
            points.value.forEach((point) => {
                point.selected = "false";
                point.color = "white";
            });
            lines.forEach((line) => {
                line.active = false;
                line.color = "black";
            });

            // Clear the selected points array
            selectedPoints.value = [];
            // Redraw the canvas
            draw();
            // Hides the editor
            showEditor.value = false;

            // TODO: Handle the data as needed
        };

        onMounted(() => {
            draw();
        });

        return {
            canvas,
            triangleWidth,
            triangleHeight,
            handleClick,
            
            // EDITOR
            showEditor,
            handleTransfer,
        };
    },
});
</script>

<template>
    <div class="container">
        <canvas ref="canvas" :width="triangleWidth" :height="triangleHeight" @click="handleClick" />
        <div class="editor-placeholder">
            <h2 v-if="showEditor" style="font-weight: bold;">Add note:</h2>
            <Editor v-if="showEditor" @transfer="handleTransfer">
            </Editor>
        </div>
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