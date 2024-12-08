<script lang="ts">

let triangleWidth : number = 400;
let triangleHeight : number = 400;

export default {
  data() {
    return {
        width : triangleWidth,
        height : triangleHeight,

        points: [
            { x: triangleWidth/2, y: triangleHeight/8, label: "Instruments" }, // Ecke oben
            { x: triangleWidth/8, y: (triangleHeight/8)*7, label: "Rules" }, // Ecke Links Unten
            { x: (triangleWidth/8)*7, y: (triangleHeight/8)*7, label: "Division of Labour" }, // Ecke Rechts Unten
            { x: (triangleWidth/16)*5, y: triangleHeight/2, label: "Subject" }, // Links Mitte
            { x: (triangleWidth/16)*11, y: triangleHeight/2, label: "Object" }, // Rechts Mitte
            { x: triangleWidth/2, y: (triangleHeight/8)*7, label: "Community" } // Unten Mitte
        ],

        lines: [
            { x1: triangleWidth/2, y1: triangleHeight/8, x2: triangleWidth/8, y2: (triangleHeight/8)*7 }, // Instruments -> Subject
            { x1: triangleWidth/2, y1: triangleHeight/8, x2: (triangleWidth/8)*7, y2: (triangleHeight/8)*7 }, // Instruments -> Object
            { x1: triangleWidth/8, y1: (triangleHeight/8)*7, x2: (triangleWidth/8)*7, y2: (triangleHeight/8)*7 }, // Subject -> Object
            { x1: triangleWidth/2, y1: triangleHeight/8, x2: (triangleWidth/16)*5, y2: triangleHeight/2 }, // Instruments -> Rules
            { x1: triangleWidth/2, y1: triangleHeight/8, x2: (triangleWidth/16)*11, y2: triangleHeight/2 }, // Instruments -> Division of Labour
            { x1: triangleWidth/8, y1: (triangleHeight/8)*7, x2: triangleWidth/2, y2: (triangleHeight/8)*7 }, // Subject -> Community
            { x1: (triangleWidth/8)*7, y1: (triangleHeight/8)*7, x2: triangleWidth/2, y2: (triangleHeight/8)*7 }, // Object -> Community
            { x1: triangleWidth/8, y1: (triangleHeight/8)*7, x2: (triangleWidth/16)*5, y2: triangleHeight/2 }, // Subject -> Rules
            { x1: (triangleWidth/8)*7, y1: (triangleHeight/8)*7, x2: (triangleWidth/16)*11, y2: triangleHeight/2 }, // Object -> Division of Labour
            { x1: (triangleWidth/16)*5, y1: triangleHeight/2, x2: (triangleWidth/16)*11, y2: triangleHeight/2 }, // Rules -> Division of Labour
            { x1: (triangleWidth/16)*5, y1: triangleHeight/2, x2: triangleWidth/2, y2: (triangleHeight/8)*7 }, // Rules -> Community
            { x1: (triangleWidth/16)*11, y1: triangleHeight/2, x2: triangleWidth/2, y2: (triangleHeight/8)*7 }  // Division of Labour -> Community
        ]
    };
  }
};
</script>

<template>
    <svg :width="triangleWidth" :height="triangleHeight" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <!-- Dreieck und Linien -->
      <!-- Linien zwischen den Eckpunkten -->
      <line v-for="(line, index) in lines" 
            :key="index"
            :x1="line.x1" 
            :y1="line.y1" 
            :x2="line.x2" 
            :y2="line.y2" 
            stroke="black" />
  
      <!-- Punkte (Ecken und Mitten) -->
      <circle v-for="(point, index) in points"
              :key="index"
              :cx="point.x" 
              :cy="point.y" 
              r="10" 
              fill="white" 
              stroke="black" />
  
      <!-- Labels -->
      <text v-for="(point, index) in points"
            :key="'label-' + index"
            :x="point.x" 
            :y="point.y - 15" 
            text-anchor="middle" 
            font-size="12"
            fill="black">
        {{ point.label }}
      </text>
    </svg>
  </template>
  
  