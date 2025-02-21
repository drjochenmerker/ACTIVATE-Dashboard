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
      isAnonymous: false
    };
  },
  mounted() {
    this.initQuill();
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

    <h3>Add Note:</h3>

    <div ref="editorContainer" class="quill-editor"></div>

    <div class="active-points" v-if="activePoints.length">
      <h3>Aktive Punkte:</h3>
      <ul>
        <li v-for="(point, index) in activePoints" :key="index">{{ point }}</li>
      </ul>
    </div>
    <div v-else class="no-active-points">
      <p>Keine aktiven Punkte.</p>
    </div>

    <label class="anonymous-checkbox">
      <input 
        type="checkbox" 
        v-model="isAnonymous" 
      />
      Send anonymously
    </label>

    <Button
      variant="primary"
      size="large"
      class="transfer-button"
      @click="transferText"
    >
      Done
    </Button>
  </div>
</template>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #ffffff;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 400px;
  max-width: 600px;
  margin: 0 auto;
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
