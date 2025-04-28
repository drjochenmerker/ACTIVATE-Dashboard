<script>
import { activateTerms, staticContent } from '@/data/contentData';
import { useSessionStore } from '@/stores/sessionStore';

/** 
 * Dropdown-Component
 * Component that is used in the Editor component to display a dropdown menu
 * Allows to select from a given list of options 
 * Is used to show the possible explicit participants of an activity
 */
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
            selectedOptions: this.modelValue,
            sessionStore: useSessionStore(),
            staticContent: staticContent,
            activateTerms: activateTerms
        };
    },
    computed: {
        /** 
         * Filters available options based on search input and currently selected options
         * Returns options that match the search term and have not already been selected
         * @returns {Array} Filtered list of dropdown options
         */
        filteredOptions() {
            return this.options.filter(
                option =>
                    option.label.toLowerCase().includes(this.search.toLowerCase()) &&
                    !this.selectedOptions.some(selected => selected.label === option.label)
            );
        },
            placeholderText() {
            const lang = this.sessionStore.activeLanguage || "en";
            return this.staticContent.placeholders.search[lang] 
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
        /**
         * Removes a specific option from the list of selected options
         * Updates the component's selected options and emits an update event
         * @param {Object} option - The option to be removed from the selected options
         */
        removeOption(option) {
            this.selectedOptions = this.selectedOptions.filter(o => o !== option);
            this.$emit('update:modelValue', this.selectedOptions);
        },
        /**
         * Handles clicks outside the dropdown container to close the dropdown
         * @param {Event} event - The click event triggered outside the dropdown
         */
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
    /**
     * Removes the global click event listener when the component is about to be unmounted
     * Prevents memory leaks by cleaning up event listeners
     */
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    /**
     * Watches for changes to the modelValue prop and updates the selectedOptions accordingly
     * Ensures the component's internal state reflects the latest prop value
     * @param {Array} newValue - The new value of the modelValue prop
     */
    watch: {
        modelValue(newValue) {
            this.selectedOptions = newValue;
        }
    }
};
</script>

<template>
    <div class="dropdown" ref="dropdownContainer">
        <h3>{{ activateTerms[sessionStore.activeLanguage][label] }}:</h3>
        <div class="search-container">

            <!-- Show selected options -->
            <div v-for="option in selectedOptions" :key="option.id" class="selected-item">
                {{ option.label.split("/").pop() }}
                <span class="remove-icon" @click="removeOption(option)">✕</span>
            </div>

            <!-- Input field for searching -->
            <input type="text" v-model="search" @focus="showDropdown = true" @input="updateSearch"
                :placeholder="placeholderText" />
        </div>

        <!-- Dropdown list -->
        <ul v-if="showDropdown" class="dropdown-list">
            <li v-if="filteredOptions.length === 0" class="no-options">
                {{ staticContent.errors.noElements[sessionStore.activeLanguage] || staticContent.errors.noElements.en }}
            </li>
            <li v-else v-for="option in filteredOptions" :key="option.id" @mousedown.prevent="selectOption(option)">
                {{ option.label.split("/").pop() }}
            </li>
        </ul>

    </div>
</template>


<style scoped>
.dropdown {
    position: relative;
    width: 100%;
    margin-bottom: 0.5em;
}

.dark .dropdown {
    background-color: #1e1e1e;
    color: #ffffff;
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

.dark .search-container {
    background-color: #1e1e1e;
    color: #ffffff;
}

.selected-item {
    display: flex;
    align-items: center;
    background-color: #e0e0e0;
    padding: 5px;
    border-radius: 4px;
}

.dark .selected-item {
    background-color: #ffffff;
    color: #1e1e1e;
}

.dark .input-search {
    background-color: #1e1e1e;
    color: #ffffff;
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

.dark .dropdown-list {
    background-color: #1e1e1e;
    color: #ffffff;
}

.dark .dropdown-list li:hover {
    background-color: #333;
    color: #ffffff;
}

.dropdown-list li {
    padding: 8px;
    cursor: pointer;
}

.dropdown-list li:hover {
    background: #f0f0f0;
}
</style>