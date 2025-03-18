<script>
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import Button from '@/components/ui/button/Button.vue';
import Dropdown from './Dropdown.vue';
import { useActivityPointsStore } from '@/stores/activityPointsStore';
import { useConflictsStore } from '@/stores/conflictsStore';
import { conflictStatus } from '@/data/knowledge_graph/structures';
import { getActivities, getActivityDetail, getConflictDetail, getConflictIds } from '@/data/knowledge_graph/read_operations';
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
      activityDetails: null,
      selectedPoints: {
        subject: [],
        instruments: [],
        object: [],
        community: [],
        rules: [],
        divisionoflabour: []
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
    },
    isDoneDisabled() {
      return this.activePoints.some(point => {
        const value = this.selectedPoints[point];
        return !value || value.length === 0; // Check if any selection is made for each active point
      });
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
        this.selectedPoints[point] = []; // Reset to empty arrays
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
      if (!this.activityDetails) {
        console.warn("Activity details not loaded yet. Please try again.");
        return; // Exit the function if data is not ready
      }

      const content = this.quill.root.innerHTML;
      const title = this.title || 'New Note';
      const author = this.isAnonymous ? 'Anonymous' : 'HARD CODED';

      const participants = [];

      this.activePoints.forEach(point => {
        const selectedValues = this.selectedPoints[point] || [];

        selectedValues.forEach(item => {
          participants.push({
            id: item.label,  // every entry stays a separate participant (important for the graph)
            type: point.charAt(0).toUpperCase() + point.slice(1)
          });
        });
      });


      const note = {
        title: title,
        timestamp: new Date().toISOString(),
        participants: participants,
        author: author,
        status: conflictStatus.open,
        description: content,
      };

      try {
        const graph = 'Urology_Emergency_after_Debriefing'; // todo: change to graph name
        console.log("note:", note);
        const addConflictResponse = await addConflict(graph, note);

        if (addConflictResponse.status === "OK") {
          const conflictId = addConflictResponse.modified;
          const conflictDetail = await getConflictDetail(graph, conflictId);
          const conflictsStore = useConflictsStore();
          conflictsStore.addConflict(conflictDetail);
        } else {
          console.warn("Error adding conflict.");
        }
      } catch (error) {
        console.error("Error adding conflict:", error);
      }

      const activityPointStore = useActivityPointsStore();
      activityPointStore.deactivateAllPoints();

      this.clearEditor();
    },

    showDropdown() {
      this.showDropdown = true;
      this.$nextTick(() => {
        // dynamically increase Z-Index when dropdown is opened
        const dropdownList = this.$el.querySelector('.dropdown-list');
        dropdownList.style.zIndex = 1001 + this.$parent.activePoints.indexOf(this.label);
      });
    }
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
    <div class="dropdown-container">
      <div v-for="point in activePoints" :key="point">
        <!-- Pass selectedPoints[point] as v-model to the Dropdown to manage multiple selections -->
        <Dropdown :label="point" :options="pointData[point] || []" v-model="selectedPoints[point]" />
      </div>
    </div>
    <!-- title: -->
    <div>
      <h3>Add a title:</h3>
      <div class="title-field">
        <input type="text" v-model="title" placeholder="Title" class="title-input" />
      </div>
    </div>

    <!-- editor: -->
    <div ref="editorContainer" placeholder="Description" class="quill-editor"></div>

    <label class="anonymous-checkbox">
      <input type="checkbox" v-model="isAnonymous" />
      Send anonymously
    </label>

    <Button variant="primary" size="large" class="transfer-button" @click="transferText" :disabled="isDoneDisabled">
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

.dropdown-container {
  position: relative;
  /* Stellt sicher, dass alle Dropdowns korrekt gestapelt werden */
}

.dropdown-list {
  position: absolute;
  /* Dropdown wird relativ zum Dropdown-Container positioniert */
  top: 100%;
  /* Dropdown öffnet sich unterhalb des Eingabefeldes */
  left: 0;
  width: 100%;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;

  /* Dropdown über andere Elemente legen */
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
  overflow-y: auto;
  /* Allow scrolling if content exceeds the set height */
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.anonymous-checkbox {
  margin-top: 20px;
  display: flex;
  width: fit-content;
  white-space: nowrap;
  align-items: left;
  font-size: 14px;
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
