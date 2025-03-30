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
import { useActivityStore } from '@/stores/activityStore';

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
    // Fetch activity details on mount
    await this.fetchActivityDetails();
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
          // Ensure it's an array even with no data:
          pointData[key] = [];
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

        // Check if any selection is made for each active point:
        return !value || value.length === 0;
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
        this.quill.root.innerHTML = ''; // Clear the content
      }
      this.isAnonymous = false; // Reset the anonymous checkbox
      this.title = ''; // Clear the title
      for (const point in this.selectedPoints) { // Clear the selected values in the dropdowns / reset to empty arrays
        this.selectedPoints[point] = [];
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
      // consts
      const content = this.quill.root.innerHTML;
      const title = this.title || 'New Note';
      const author = this.isAnonymous ? 'Anonymous' : (useActivityStore().getRole());
      const participants = [];

      if (this.activePoints.length === 0) {
        // WORKAROUND: merge title and content to later separate in miscellaneous comment section
        const titleAndContent = title + '|' + content; // '|', the safest separator for now

        try {
          const graph = useActivityStore().getActivity().graph;
          const response = await addComment(graph, "root", author, titleAndContent);

          if (response.status === "OK") {
          } else {
            console.warn("Error saving the comment: ", response);
          }
        } catch (error) {
          console.error("Error with API call: ", error);
        }

        this.clearEditor();
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
            id: item.label,  // every entry stays a separate participant (important for the graph)
            type: point.charAt(0).toUpperCase() + point.slice(1)
          });
        });
      });


      // temporary save note object ot then try and add it to the graph
      const note = {
        title: title,
        timestamp: new Date().toISOString(),
        participants: participants,
        author: author,
        status: conflictStatus.open,
        description: content,
      };

      try {
        const graph = useActivityStore().getActivity().graph;
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
        console.error("Error adding conflict: ", error);
      }

      const activityPointStore = useActivityPointsStore();

      activityPointStore.deactivateAllPoints();


      this.clearEditor();
      useConflictsStore().refreshConflictList();
    },

    showDropdown() {
      this.showDropdown = true;
      this.$nextTick(() => {
        // dynamically increase Z-Index when dropdown is opened to make sure it's on top
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
