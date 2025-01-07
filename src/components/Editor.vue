<template>
    <div>
      <div ref="editorContainer" class="quill-editor"></div>
    </div>
    <!-- Button to transfer text -->
    <button
      class="transfer-button"
      @click="transferText"
    >
      Speichern
    </button>
  </template>
  
  <script>
  import Quill from 'quill';
  import 'quill/dist/quill.snow.css';
  
  export default {
    name: 'QuillEditor',
    props: {
      value: {
        type: String,
        default: ''
      }
    },
    emits: ['input', 'transfer'],
    data() {
      return {
        quill: null
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
              //[{ 'header': [1, 2, 3, false] }], // Header dropdown
              [{ 'list': 'ordered' }, { 'list': 'bullet' }], // Lists
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
      const content = this.quill.root.innerHTML;
      this.$emit('transfer', content); // Emit the 'transfer' event with editor content
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
  
  <style>
  .quill-editor {
    height: 250px; /* Adjust editor height */
    width: 200px; /* Adjust editor width */
  }
  .transfer-button {
    /**margin-top: 10px;*/
    background-color: #4caf50;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .transfer-button:hover {
    background-color: #45a049;
  }
  </style>
  