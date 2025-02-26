<script>
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import Button from '@/components/ui/button/Button.vue';
import Dropdown from './Dropdown.vue';
import { useActivityPointsStore } from '@/stores/activityPointsStore';
import { conflictStatus } from '@/data/knowledge_graph/structures';
import { getActivities, getActivityDetail, getConflictDetail } from '@/data/knowledge_graph/read_operations';
import { addConflict } from '@/data/knowledge_graph/write_operations';

export default {
  name: 'Editor',
  components: {
    Button,
    Dropdown
  },
  props: {
    value: {
      type: String,
      default: ''
    },
    activePoints: {
      type: Array,
      default: () => []
    }
  },
  emits: ['input', 'transfer'],
  data() {
    return {
      quill: null,
      isAnonymous: false,
      title: '',
      activityDetails: null, // Store activity details here
      selectedPoints: {
        subject: null,
        instruments: null,
        object: null,
        community: null,
        rules: null,
        divisionOfLabour: null
      },
    };
  },

  async mounted() {
    this.initQuill();
    await this.fetchActivityDetails(); // Fetch activity details on mount
  },
  computed: {
    pointData() {
      if (!this.activityDetails) {
        return {}; // Return empty object if activityDetails is not yet loaded
      }

      const pointData = {};

      for (const key in this.activityDetails) {
        if (Array.isArray(this.activityDetails[key])) {
          pointData[key] = this.activityDetails[key].map(item => ({ label: item.label }));
        } else {
          pointData[key] = []; // Ensure it's an array even if no data
        }
      }

      return pointData;
    },
    isActivePoint() {
      return (pointType) => this.activePoints.includes(pointType);
    }
  },
  methods: {
    initQuill() {
      this.quill = new Quill(this.$refs.editorContainer, {
        theme: 'snow',
        placeholder: 'Description...',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }]
          ]
        }
      });

      this.quill.root.innerHTML = this.value;

      this.quill.on('text-change', () => {
        this.$emit('input', this.quill.root.innerHTML);
      });
    },

    clearEditor() {
      if (this.quill) {
        this.quill.root.innerHTML = ''; // Clear Quill editor content
      }
      this.isAnonymous = false; // Reset the anonymous checkbox

      // Clear the selected values in the dropdowns
      for (const point in this.selectedPoints) {
        this.selectedPoints[point] = null; // Reset to null
      }
    },

    async fetchActivityDetails() {
      try {
        const activities = await getActivities();
        if (activities && activities.length > 0) {
          this.activityDetails = await getActivityDetail(activities[0]);
        } else {
          console.warn("No activities found.");
          this.activityDetails = {}; // Set to empty object to avoid errors
        }
      } catch (error) {
        console.error("Error fetching activity details:", error);
        this.activityDetails = {}; // Set to empty object to avoid errors
      }
    },

    async transferText() {
      // Ensure activityDetails is loaded before proceeding
      if (!this.activityDetails) {
        console.warn("Activity details not loaded yet. Please try again.");
        return; // Exit the function if data is not ready
      }

      const content = this.quill.root.innerHTML;
      const title = this.title || 'New Note'; // Use the title from data, or default to 'New Note'
      const author = this.isAnonymous ? 'Anonymous' : 'Author übergeben';

      // Transform activePoints into the desired participants array
      const participants = this.activePoints.map(point => {
        // Access selected value from dropdown
        const selectedValue = this.selectedPoints[point];

        // Use a fallback label if selectedValue is null or undefined
        const label = selectedValue ? selectedValue.label : 'N/A';

        return {
          id: label, // Use selected label, or 'N/A' if not selected
          type: point.charAt(0).toUpperCase() + point.slice(1) // Capitalize the first letter
        };
      });

      // Create the note object that is then going into the store
      const note = {
        title: title,
        timestamp: new Date().toISOString(),
        participants: participants,
        author: author,
        status: conflictStatus.open,
        description: content,
      };

      console.log("note object", note);

      // **ADD CONFLICT**
      try {
        const graph = 'your_graph_uri'; // Replace with your graph URI
        const addConflictResponse = await addConflict(graph, note);
        console.log("addConflictResponse", addConflictResponse);

        // **TEST: GET CONFLICT DETAIL**
        if (addConflictResponse.status === "OK") {
          const conflictId = addConflictResponse.modified;
          const conflictDetail = await getConflictDetail(graph, conflictId);
          console.log("conflictDetail", conflictDetail);

          // **VERIFY:** Check if conflictDetail has the correct properties
          if (conflictDetail && conflictDetail.title === note.title && conflictDetail.description === note.description) {
            console.log("Conflict added and retrieved successfully!");
          } else {
            console.warn("Conflict added, but getConflictDetail returned incorrect data.");
          }
        } else {
          console.warn("Error adding conflict. Skipping getConflictDetail test.");
        }

      } catch (error) {
        console.error("Error adding conflict:", error);
        // Handle the error appropriately (e.g., display an error message)
      }

      this.$emit('transfer', note);

      const activityPointStore = useActivityPointsStore();
      activityPointStore.deactivateAllPoints();

      this.clearEditor();
    },


  },
  watch: {
    value(newValue) {
      if (this.quill && newValue !== this.quill.root.innerHTML) {
        this.quill.root.innerHTML = newValue;
      }
    }
  }
};
</script>

<template>
  <div class="editor-container">
    <button class="clear-button" @click="clearEditor">Clear Editor</button>

    <h3>Add Note to selected Points:</h3>
    <!-- dropdown: -->
    <div>
      <div v-for="point in activePoints" :key="point">
        <Dropdown :label="point" :options="pointData[point]" v-model="selectedPoints[point]" />
      </div>

    </div>
    <!-- title: -->
    <div>
      <h3>Add a title:</h3>
      <div class="title-field">
        <input type="text" v-model="title" placeholder="Title" class="title-input" />
      </div> <!-- editor container description: -->
    </div>

    <!-- editor: -->
    <div ref="editorContainer" placeholder="Description" class="quill-editor"></div>

    <label class="anonymous-checkbox">
      <input type="checkbox" v-model="isAnonymous" />
      Send anonymously
    </label>

    <Button variant="primary" size="large" class="transfer-button" @click="transferText">
      Done
    </Button>
  </div>
</template>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  align-items: left;
  background-color: #ffffff;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 400px;
  max-width: 600px;
  margin: 0 auto;
  overflow: visible;
  /* Verhindert das Abschneiden */
  position: relative;
  /* Stellt sicher, dass das absolute Positionieren funktioniert */

}


input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.dropdown-list {
  position: absolute;
  top: 100%;
  width: 100%;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

.dropdown-list li {
  padding: 8px;
  cursor: pointer;
}

.dropdown-list li:hover {
  background: #f0f0f0;
}

.quill-editor {
  height: 250px;
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.anonymous-checkbox {
  margin-top: 10px;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.anonymous-checkbox input {
  margin-right: 8px;
}

.transfer-button {
  margin-top: 20px;
  background-color: black;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease;
}

.transfer-button:hover {
  background-color: #323232;
}

.transfer-button:active {
  background-color: #323232;
}

.active-points {
  margin-top: 15px;
  width: 100%;
  text-align: left;
}

.active-points ul {
  list-style-type: disc;
  padding-left: 20px;
}

.no-active-points {
  margin-top: 15px;
  font-style: italic;
  color: #888;
}
</style>
