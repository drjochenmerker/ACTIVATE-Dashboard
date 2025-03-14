<template>
    <div class="dropdown" ref="dropdownContainer">
        <h3>{{ label }}:</h3>
        <div class="search-container">
            <!-- Anzeige der ausgewählten Optionen -->
            <div v-for="option in selectedOptions" :key="option.label" class="selected-item">
                {{ option.label }}
                <span class="remove-icon" @click="removeOption(option)">✕</span>
            </div>
            <!-- Eingabefeld für die Suche -->
            <input type="text" v-model="search" @focus="showDropdown = true" @input="updateSearch"
                placeholder="Suchen..." />
        </div>
        <!-- Dropdown-Liste -->
        <ul v-if="showDropdown" class="dropdown-list">
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
            type: Array,
            default: () => []
        }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            search: '',
            showDropdown: false,
            selectedOptions: this.modelValue
        };
    },
    computed: {
        filteredOptions() {
            return this.options.filter(
                option =>
                    option.label.toLowerCase().includes(this.search.toLowerCase()) &&
                    !this.selectedOptions.some(selected => selected.label === option.label)
            );
        }
    },
    methods: {
        updateSearch(event) {
            this.search = event.target.value;
            this.showDropdown = true;
        },
        selectOption(option) {
            this.selectedOptions.push(option);
            this.$emit('update:modelValue', this.selectedOptions);
            this.search = '';
            this.$nextTick(() => {
                const input = this.$el.querySelector('input');
                if (input) {
                    input.focus();
                }
            });
        },
        removeOption(option) {
            this.selectedOptions = this.selectedOptions.filter(o => o !== option);
            this.$emit('update:modelValue', this.selectedOptions);
        },
        handleClickOutside(event) {
            // test if the click was inside or outside the dropdown container
            if (this.$refs.dropdownContainer && !this.$refs.dropdownContainer.contains(event.target)) {
                this.showDropdown = false;
            }
        }
    },
    mounted() {
        // global click listener
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        // remove the global click listener
        document.removeEventListener('click', this.handleClickOutside);
    },
    watch: {
        modelValue(newValue) {
            this.selectedOptions = newValue;
        }
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

.selected-item {
    display: flex;
    align-items: center;
    background-color: #e0e0e0;
    padding: 5px;
    border-radius: 4px;
}

.remove-icon {
    margin-left: 5px;
    cursor: pointer;
    color: red;
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
    max-height: 150px;
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