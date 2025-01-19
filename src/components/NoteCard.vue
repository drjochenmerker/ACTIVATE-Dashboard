<script lang="ts" setup>
    import { defineProps } from 'vue';

    const props = defineProps({
    content: {
        type: String,
        required: true,
    },
    isAnonymous: {
        type: Boolean,
        required: true,
    },
    });
</script>

<template>
    <div class="note-card">
      <div class="note-card-header">
        <span class="note-card-status" :class="{ 'anonymous': props.isAnonymous }">
          {{ props.isAnonymous ? 'Anonym' : 'Nicht Anonym' }}
        </span>
      </div>
      <div class="note-card-content">
        <!-- Render HTML content here -->
        <!-- TODO: check if HTML list elements can be  rendered with v-html -->
        <div v-html="props.content"></div>
      </div>
    </div>
  </template>
  

<style scoped>
    .note-card {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin: 10px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    }

    .note-card-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    }

    .note-card-status {
    font-weight: bold;
    padding: 4px 8px;
    border-radius: 4px;
    color: white;
    }

    .note-card-status.anonymous {
    background-color: #888;
    }

    .note-card-status:not(.anonymous) {
    background-color: #4caf50;
    }

    .note-card-content {
    font-size: 16px;
    color: #333;
    }

    .note-card-content p {
    margin-bottom: 1em;
    }

    .note-card-content ol {
    padding-left: 20px;
    margin-bottom: 1em;
    }

    .note-card-content li {
    margin-bottom: 0.5em;
    }

    .note-card-content ol li[data-list="bullet"] {
    list-style-type: disc;
    list-style-position: inside;
    }
</style>
