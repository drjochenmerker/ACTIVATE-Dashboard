<script>
import { activateTerms, staticContent } from '@/data/contentData';
import { buildLanguageString } from '@/lib/utils';
import { useSessionStore } from '@/stores/sessionStore';
import { Delete, DeleteIcon } from 'lucide-vue-next';

export default {
    name: 'Dropdown',

    /**
     * Props of the Dropdown component
     * @property label - Label for the input field
     * @property options - List of selectable options (each with a label)
     * @property modelValue - Bound value from parent for v-model
     * @property disabled - Whether the input and dropdown should be disabled
     */
    props: {
        label: {
            type: String,
            required: true,
        },
        options: {
            type: Array,
            required: true,
        },
        modelValue: {
            type: Object,
            default: {},
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['update:modelValue'],

    /**
     * Component's local state
     * @property search - Current search input value
     * @property showDropdown - Controls visibility of the dropdown list
     */
    data() {
        return {
            search: '',
            showDropdown: false,
            sessionStore: useSessionStore(),
            staticContent: staticContent,
            activateTerms: activateTerms,
        };
    },
    computed: {
        /**
         * Returns options filtered based on current search input
         */
        filteredOptions() {
            return this.options.filter((option) =>
                buildLanguageString(option, this.sessionStore.activeLanguage)
                    .toLowerCase()
                    .includes(this.search.toLowerCase()),
            );
        },
        placeholderText() {
            const lang = this.sessionStore.activeLanguage || 'en';
            return this.staticContent.placeholders.search[lang];
        },
        buildLanguageString() {
            return (option, lang, isLabel) => {
                return buildLanguageString(option, lang, isLabel);
            };
        },
    },
    watch: {
        /**
         * Updates local search value when modelValue prop changes
         */
        modelValue(newVal) {
            try {
                this.search = buildLanguageString(newVal, this.sessionStore.activeLanguage, true);
            } catch (_error) {
                this.search = '';
            }
        },
    },
    mounted() {
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    methods: {
        /**
         * Handles user input in the text field
         * Emits the new value to the parent and opens the dropdown
         */
        handleInput(event) {
            if (this.disabled) return;
            this.search = event.target.value;
            this.showDropdown = true;
        },

        /**
         * Selects an option from the dropdown
         * Sets the search to the selected label and closes the dropdown
         */
        selectOption(option) {
            this.search = buildLanguageString(option, this.sessionStore.activeLanguage, true);
            this.$emit('update:modelValue', option);
            this.showDropdown = false;
        },

        /**
         * Closes dropdown if the user clicks outside the component
         */
        handleClickOutside(event) {
            if (this.$refs.dropdownContainer && !this.$refs.dropdownContainer.contains(event.target)) {
                this.showDropdown = false;
            }
        },

        /**
         * Clears the current input value and hides the dropdown
         */
        clearInput() {
            this.search = '';
            this.$emit('update:modelValue', {});
            this.showDropdown = false;
        },
    },
};
</script>

<template>
    <div ref="dropdownContainer" class="dropdown">
        <h3 class="label" :class="{ disabled: disabled }">{{ label }}:</h3>
        <div class="search-container" :class="{ disabled: disabled }">
            <input
                v-model="search"
                class="text-input"
                :class="{ disabled: disabled }"
                type="text"
                :placeholder="placeholderText"
                :disabled="disabled"
                @focus="!disabled && (showDropdown = true)"
                @input="handleInput"
            />
            <button v-if="search" type="button" class="clear-btn" @click="clearInput">×</button>
        </div>

        <ul v-if="showDropdown && !disabled" class="dropdown-list">
            <li v-for="option in filteredOptions" :key="option.id" @mousedown.prevent="selectOption(option)">
                {{
                    buildLanguageString(option, sessionStore.activeLanguage, true) +
                    (activateTerms[sessionStore.activeLanguage][option.type]
                        ? ' (' + activateTerms[sessionStore.activeLanguage][option.type] + ')'
                        : '')
                }}
            </li>
        </ul>
    </div>
</template>

<style scoped>
.dropdown {
    position: relative;
    width: 100%;
}

.search-container {
    position: relative;
    display: flex;
    align-items: center;
    border: 1px solid #a6a4a4;
    padding: 5px 35px 5px 5px; /* Rechts Platz für das Icon */
    border-radius: 4px;
}

.search-container.disabled {
    border: 1px solid #e6e6e6;
}

.label.disabled {
    color: #e6e6e6;
}

.text-input {
    color: black;
    flex: 1;
    border: none;
    padding: 8px;
}

.text-input.disabled {
    color: #e6e6e6;
}

.text-input.disabled::placeholder {
    color: white;
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

.clear-btn {
    position: absolute;
    right: 10px;
    top: 45%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    color: #ff0000;
    padding: 0;
    line-height: 1;
}
</style>
