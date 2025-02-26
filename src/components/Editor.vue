<script>
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import Button from '@/components/ui/button/Button.vue';
import { useActivityPointsStore } from '@/stores/activityPointsStore';

export default {
  name: 'QuillEditor',
  components: {
    Button
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
      //test:
      search: "",
      showDropdown: false,
      selectedOption: null,
    };
  },
  mounted() {
    this.initQuill();
  },
  computed: {
    filteredOptions() {
      return this.activePoints.filter(point =>
        point.toLowerCase().includes(this.search.toLowerCase())
      );
    },
  },
  methods: {
    initQuill() {
      this.quill = new Quill(this.$refs.editorContainer, {
        theme: 'snow',
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
        this.quill.root.innerHTML = '';
      }
      this.isAnonymous = false;
    },

    transferText() {
      const content = this.quill.root.innerHTML;

      const note = {
        content: content,
        isAnonymous: this.isAnonymous,
        // TODO: Add creator to the note object
        // creator: content.creator,
        noteStatus: "RED",
        participatingPoints: this.activePoints.slice(),
      };

      console.log(note);

      // TODO: Ersetzen durch Sparql Query
      this.$emit('transfer', note);

      const activityPointStore = useActivityPointsStore();
      activityPointStore.deactivateAllPoints();

      this.clearEditor();
    },
    selectOption(poin, category) {
      if (category === 'subject') {
        this.selectedSubject = point;
        this.searchSubject = point.label;
        this.showDropdownSubject = false;
      } else if (category === 'instrument') {
        this.selectedInstrument = point;
        this.searchInstrument = point.label;
        this.showDropdownInstrument = false;
      } else if (category === 'object') {
        this.selectedObject = point;
        this.searchObject = point.label;
        this.showDropdownObject = false;
      }
    },
    hideWithDelay() {
      setTimeout(() => {
        this.showDropdown = false;
      }, 200);
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
    <!-- title: -->
    <h3>Add Note to selected Points:</h3>
    <!-- dropdown: -->
    <div>
      <div class="dropdown">
        <h3>Choose specific subject:</h3>
        <input type="text" v-model="searchSubject" @focus="showDropdownSubject = true" />
        <ul v-if="showDropdownSubject">
          <li v-for="subject in subjects" @mousedown="selectOption(subject, 'subject')">{{ subject.label }}</li>
        </ul>
      </div>

      <div class="dropdown">
        <h3>Choose specific instruments:</h3>
        <input type="text" v-model="searchInstrument" @focus="showDropdownInstrument = true" />
        <ul v-if="showDropdownInstrument">
          <li v-for="instrument in instruments" @mousedown="selectOption(instrument, 'instrument')">{{ instrument.label
            }}</li>
        </ul>
      </div>

      <div class="dropdown">
        <h3>Choose specific objects:</h3>
        <input type="text" v-model="searchObject" @focus="showDropdownObject = true" />
        <ul v-if="showDropdownObject">
          <li v-for="object in objects" @mousedown="selectOption(object, 'object')">{{ object.label }}</li>
        </ul>
      </div>

    </div>

    <!-- editor container: -->
    <div ref="editorContainer" class="quill-editor"></div>

    <!-- active points TODO dont show: -->
    <div class="active-points" v-if="activePoints.length">
      <h3>Active points:</h3>
      <ul>
        <li v-for="(point, index) in activePoints" :key="index">{{ point }}</li>
      </ul>
    </div>
    <div v-else class="no-active-points">
      <p>No active points.</p>
    </div>

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

.dropdown-subjects {
  position: relative;
  width: 100%;
}

.dropdown-objects {
  position: relative;
  width: 100%;
}

.dropdown-instruments {
  position: relative;
  width: 100%;
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
