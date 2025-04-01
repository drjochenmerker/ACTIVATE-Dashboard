<script>
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import Button from '@/components/ui/button/Button.vue';
import Dropdown from './Dropdown.vue';

import { useActivityPointsStore } from '@/stores/activityPointsStore';
import { useConflictsStore } from '@/stores/conflictsStore';
import { conflictStatus } from '@/data/knowledge_graph/structures';
import { getActivities, getActivityDetail, getConflictDetail, getConflictIds } from '@/data/knowledge_graph/read_operations';
import { addComment, addConflict } from '@/data/knowledge_graph/write_operations';
import { useSessionStore } from '@/stores/sessionStore';

/** 
 * Editor-Component
 * Component for the editor of the activity diagram
 * Allows to add new conflicts and miscellaneous comments to the graph
 */
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
    // Active participants of the activity
    activePoints: {
      type: Array,
      default: () => []
    }
  },
  // Emit event for when the editor content changes
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
      sessionStore: useSessionStore(),
    };
  },

  async mounted() {
    this.initQuill();
    // Fetch activity details on mount
    await this.fetchActivityDetails();
  },
  computed: {
    pointData() {
      // Return empty object if activityDetails is not yet loaded
      if (!this.activityDetails) {
        return {};
      }

      // constant array to save the point data
      const pointData = {};

      for (const key in this.activityDetails) {
        if (Array.isArray(this.activityDetails[key])) {
          pointData[key] = this.activityDetails[key].map(item => ({ label: item.label }));
        } else {
          // Ensure it's an array even with no data:
          pointData[key] = [];
        }
      }

      return pointData;
    },

    /**
     * Checks if a specific point type is currently active
     * @param {string} pointType - The type of point to check for activity
     * @returns {boolean} Whether the point type is included in active points
     */
    isActivePoint() {
      return (pointType) => this.activePoints.includes(pointType);
    },
    /**
     * Determines whether the transfer/done button should be disabled
     * @returns {boolean} True if any active point lacks a selection, false otherwise
     */
    isDoneDisabled() {
      return this.activePoints.some(point => {
        const value = this.selectedPoints[point];

        // Check if any selection is made for each active point:
        return !value || value.length === 0;
      });
    }
  },
  methods: {
    /**
     * Initializes the Quill rich text editor with predefined configuration
     * Sets up toolbar options, placeholder text, and event handling for text changes
     * Populates initial editor content and emits input events when text is modified
     */
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

    /**
     * Clear the editor and reset the state
     */
    clearEditor() {
      if (this.quill) {
        this.quill.root.innerHTML = '';
      }
      this.isAnonymous = false;
      this.title = '';
      for (const point in this.selectedPoints) {
        this.selectedPoints[point] = [];
      }
    },

    /**
     * Method to get the activity details from the graph
     */
    async fetchActivityDetails() {
      try {
        this.activityDetails = await getActivityDetail(useSessionStore().sessionActivity);
      } catch (error) {
        console.error("Error fetching activity details:", error);
        this.activityDetails = {}; // Set to empty object to avoid errors
      }
    },

    /**
     * Transfers text from the editor to the graph, creating either a miscellaneous comment or a conflict
     * depending on the number of active points. Handles adding comments or conflicts to the graph,
     * updates the conflicts store, and resets the editor state.
     */
    async transferText() {
      // consts
      const content = this.quill.root.innerHTML;
      const title = this.title || 'New Note';
      const author = this.isAnonymous ? 'Anonymous' : (useSessionStore().sessionRole);
      const participants = [];

      if (this.activePoints.length === 0) {
        // WORKAROUND: merge title and content to later separate in miscellaneous comment section
        // as the misc comments are stores without a title and only content
        const titleAndContent = title + '|' + content; // '|', the safest separator for now

        try {
          const graph = useSessionStore().sessionActivity.graph;
          // 'root' is the root node of the graph for misc comments as they are saved
          // just like replies without a title and status
          const response = await addComment("root", titleAndContent);

          if (response.status === "OK") {
          } else {
            console.warn("Error saving the comment: ", response);
          }
        } catch (error) {
          console.error("Error with API call: ", error);
        }

        this.clearEditor();
        useConflictsStore().refreshConflictList();
        return;
      }


      if (!this.activityDetails) {
        console.warn("Activity details not loaded yet. Please try again.");
        return; // Exit the function if data is not ready
      }

      this.activePoints.forEach(point => {
        const selectedValues = this.selectedPoints[point] || [];

        selectedValues.forEach(item => {
          participants.push({
            // every entry stays a separate participant (important for the graph)
            id: item.label,
            type: point.charAt(0).toUpperCase() + point.slice(1)
          });
        });
      });


      // temporary save note object
      const note = {
        title: title,
        timestamp: new Date().toISOString(),
        participants: participants,
        author: author,
        status: conflictStatus.open,
        description: content,
      };

      // Add conflict to the graph 
      try {
        const graph = useSessionStore().sessionActivity.graph;
        const addConflictResponse = await addConflict(graph, note);

        if (addConflictResponse.status === "OK") {
          // Add the conflict to the conflictStore as well
          const conflictId = addConflictResponse.modified;
          const conflictDetail = await getConflictDetail(graph, conflictId);
          const conflictsStore = useConflictsStore();
          conflictsStore.addConflict(conflictDetail);
        } else {
          console.warn("Error adding conflict.");
        }
      } catch (error) {
        console.error("Error adding conflict: ", error);
      }

      // Deactivate all of the active points
      const activityPointStore = useActivityPointsStore();
      activityPointStore.deactivateAllPoints();


      this.clearEditor();
      useConflictsStore().refreshConflictList();
    },

    /**
     * Displays the dropdown and dynamically adjusts its z-index to ensure it appears on top
     * Increments z-index based on the dropdown's position in the active points list
     */
    showDropdown() {
      this.showDropdown = true;
      this.$nextTick(() => {
        // dynamically increase Z-Index when dropdown is opened to make sure it's on top
        const dropdownList = this.$el.querySelector('.dropdown-list');
        dropdownList.style.zIndex = 1001 + this.$parent.activePoints.indexOf(this.label);
      });
    }
  },

  /**
   * Watchers for the Editor component to handle dynamic updates
   * - Synchronizes the Quill editor's content with the component's value
   * - Manages session store updates and triggers activity details fetching
   */
  watch: {
    value(newValue) {
      if (this.quill && newValue !== this.quill.root.innerHTML) {
        this.quill.root.innerHTML = newValue;
      }
    },
    'sessionStore.outdated': {
      handler: async function (newVal) {
        if (useSessionStore().outdated) {
          await this.fetchActivityDetails();
          useSessionStore().outdated = false;
        }
      },
    }
  }
};

</script>


<template>
  <div class="editor-container">
    <div class="icon-container">

      <button class="icon-button" @click="clearEditor">
        <span class="material-symbols-outlined">delete</span>
      </button>
    </div>

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
  background-color: #ffffff;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 400px;
  max-width: 600px;
  margin: 0 auto;
  overflow: visible;
  position: relative;

}

/*icon button*/
.icon-container {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  /* Align the icon button to the right */
  margin-bottom: 10px;
  /* Optional, adds space between the icon and the rest of the content */
}

/* icon */
.icon-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 5px;
  font-size: 24px;
  color: red;
}

.icon-button:hover {
  color: darkred;
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
