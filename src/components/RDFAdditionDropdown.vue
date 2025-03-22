<template>
  <div class="dropdown" ref="dropdownContainer">
    <h3 class="label" :class="{ disabled: disabled}">{{ label }}:</h3>
    <div class="search-container" :class="{ disabled: disabled}">
      <input class="text-input" :class="{ disabled: disabled}" type="text" v-model="search" @focus="!disabled && (showDropdown = true)" @input="handleInput" placeholder="Suchen..."
        :disabled="disabled" />
    </div>
    <!-- Dropdown-Liste -->
    <ul v-if="showDropdown && !disabled" class="dropdown-list">
      <li v-for="option in filteredOptions" :key="option.label" @mousedown.prevent="selectOption(option)">
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
    },
    disabled: {
      type: Boolean,
      default: false
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
    handleInput(event) {
      if (this.disabled) return;
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
  border: 1px solid #a6a4a4;
  padding: 5px;
  border-radius: 4px;
}

.search-container.disabled {
  border: 1px solid #e6e6e6;
}

.label.disabled {
  color: #e6e6e6
}

.text-input {
  color: black;
}

.text-input.disabled {
  color: #e6e6e6;
}

.text-input.disabled::placeholder {
  color: white
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