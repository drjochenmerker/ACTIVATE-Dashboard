<template>
    <div class="dropdown" ref="dropdownContainer">
      <h3>{{ label }}:</h3>
      <div class="search-container">
        <input
          type="text"
          v-model="search"
          @focus="showDropdown = true"
          @input="updateSearch"
          placeholder="Suchen..."
        />
      </div>
      <!-- Dropdown-Liste -->
      <ul v-if="showDropdown" class="dropdown-list">
        <li
          v-for="option in filteredOptions"
          :key="option.label"
          @mousedown.prevent="selectOption(option)"
        >
          {{ option.label }}
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    name: 'Dropdown',
    props: {
      label: {
        type: String,
        required: true
      },
      options: {
        type: Array,
        required: true
      },
      modelValue: {
        type: String,
        default: ''
      }
    },
    emits: ['update:modelValue'],
    data() {
      return {
        search: this.modelValue,
        showDropdown: false
      };
    },
    computed: {
      filteredOptions() {
        return this.options.filter(option =>
          option.label.toLowerCase().includes(this.search.toLowerCase())
        );
      }
    },
    methods: {
      updateSearch(event) {
        this.search = event.target.value;
        this.$emit('update:modelValue', this.search);
        this.showDropdown = true;
      },
      selectOption(option) {
        this.search = option.label;
        this.$emit('update:modelValue', this.search);
        this.showDropdown = false;
      },
      handleClickOutside(event) {
        if (
          this.$refs.dropdownContainer &&
          !this.$refs.dropdownContainer.contains(event.target)
        ) {
          this.showDropdown = false;
        }
      }
    },
    watch: {
      modelValue(newVal) {
        this.search = newVal;
      }
    },
    mounted() {
      document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
      document.removeEventListener('click', this.handleClickOutside);
    }
  };
  </script>
  
  <style scoped>
  .dropdown {
    position: relative;
    width: 100%;
  }
  
  .search-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    border: 1px solid #ccc;
    padding: 5px;
    border-radius: 4px;
  }
  
  input {
    flex-grow: 1;
    padding: 8px;
    border: none;
  }
  
  input:focus {
    outline: none;
  }
  
  .dropdown-list {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 300px;
    overflow-y: auto;
    z-index: 1001;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .dropdown-list li {
    padding: 8px;
    cursor: pointer;
  }
  
  .dropdown-list li:hover {
    background: #f0f0f0;
  }
  </style>
  