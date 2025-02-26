<template>
    <div class="dropdown">
        <h3>{{ label }}:</h3>
        <input type="text" v-model="search" @focus="showDropdown = true" @blur="hideWithDelay" />
        <ul v-if="showDropdown">
            <li v-for="option in filteredOptions" :key="option.label" @mousedown="selectOption(option)">
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
        modelValue: { // Use `modelValue` for v-model
            type: Object,
            default: null
        }
    },
    emits: ['update:modelValue'], // Emit `update:modelValue`
    data() {
        return {
            search: "",
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
        hideWithDelay() {
            setTimeout(() => {
                this.showDropdown = false;
            }, 200);
        },
        selectOption(option) {
            this.$emit('update:modelValue', option);
            this.search = option.label;
            this.showDropdown = false;
            console.log("Selected in Dropdown:", option); // Log the selected option
        },
        // ... other methods
    },
    watch: {
        modelValue: {  // Watch for changes in the bound value
            immediate: true,
            handler(newValue) {
                if (newValue) {
                    this.search = newValue.label; // Update the search input when the value changes
                } else {
                    this.search = ""; // Clear the search if the value is null
                }
            }
        }
    }
};
</script>

<style scoped>
.dropdown {
    position: relative;
    width: 100%;
    margin-bottom: 10px;
}

input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

ul {
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

li {
    padding: 8px;
    cursor: pointer;
}

li:hover {
    background: #f0f0f0;
}
</style>