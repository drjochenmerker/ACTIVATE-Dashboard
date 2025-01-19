<template>
  <div class="editor-container">
    <div ref="editorContainer" class="quill-editor"></div>

    <!-- Checkbox for anonymous submission -->
    <label class="anonymous-checkbox">
      <input 
        type="checkbox" 
        v-model="isAnonymous" 
      />
      Send anonymously
    </label>

    <!-- Button to transfer text -->
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

<script>
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import Button from '@/components/ui/button/Button.vue';

export default {
  name: 'QuillEditor',
  components: {
    Button // import the Button component
  },
  props: {
    value: {
      type: String,
      default: ''
    }
  },
  emits: ['input', 'transfer'],
  data() {
    return {
      quill: null,
      isAnonymous: false, // State for anonymous submission
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
          toolbar: [ // ONLY BASIC TOOLBAR ==> NOT TOO MANY OPTIONS FOR USERS
              ['bold', 'italic', 'underline'], // Toggle buttons
              [{ 'list': 'ordered' }, { 'list': 'bullet' }], // Lists
              //[{ 'header': [1, 2, 3, false] }], // Header dropdown
              //[{ 'align': [] }], // Alignment options
              //['link', 'image'] // Links and images
            ]
        }
      });

      // Set initial value
      this.quill.root.innerHTML = this.value;

      // Listen for text changes and emit input event
      this.quill.on('text-change', () => {
        this.$emit('input', this.quill.root.innerHTML);
      });
    },
    transferText() {
      const payload = {
        content: this.quill.root.innerHTML, // Include the text-content
        isAnonymous: this.isAnonymous, // Include the anonymous state
      };

      // Emit the 'transfer' event with content and anonymous status
      this.$emit('transfer', payload);
    }
  },
  watch: {
    value(newValue) {
      if (newValue !== this.quill.root.innerHTML) {
        this.quill.root.innerHTML = newValue;
      }
    }
  }
};
</script>

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
</style>
