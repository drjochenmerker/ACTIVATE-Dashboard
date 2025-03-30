<script setup lang="ts">
import { ref } from 'vue';
import Button from '@/components/ui/button/Button.vue';
import { defineProps } from 'vue';
import { useColorMode } from '@vueuse/core';
import { useSessionStore } from '@/stores/sessionStore';
import { Activity, KnowledgeGraphActivityClass } from '@/data/knowledge_graph/structures';
import { addEntity } from '@/data/knowledge_graph/write_operations';
import { getActivityDetail } from '@/data/knowledge_graph/read_operations';

defineProps<{
    isOpen: Boolean,
}>();

const mode = useColorMode();
const sessionStore = useSessionStore();

const isOpen = ref(false);
const entityName = ref('');
const selectedClass = ref<KnowledgeGraphActivityClass | ''>('');

const activityClassOptions = [
    { label: KnowledgeGraphActivityClass.subject, value: KnowledgeGraphActivityClass.subject },
    { label: KnowledgeGraphActivityClass.object, value: KnowledgeGraphActivityClass.object },
    { label: KnowledgeGraphActivityClass.rules, value: KnowledgeGraphActivityClass.rules },
    { label: KnowledgeGraphActivityClass.instruments, value: KnowledgeGraphActivityClass.instruments },
    { label: KnowledgeGraphActivityClass.divison_of_labour, value: KnowledgeGraphActivityClass.divison_of_labour },
    { label: KnowledgeGraphActivityClass.community, value: KnowledgeGraphActivityClass.community }
];

const openDialog = async () => {
    isOpen.value = true;
};

const closeDialog = () => {
    isOpen.value = false;
    resetInputs();
};

const resetInputs = () => {
    entityName.value = '';
    selectedClass.value = '';
};

const applyEntity = async () => {
    if (!entityName.value.trim()) {
        alert("Please enter an entity name.");
        return;
    }
    if (!selectedClass.value) {
        alert("Please select an activity class.");
        return;
    }

    const response = await addEntity(
        sessionStore.sessionActivity!.graph,
        entityName.value,
        selectedClass.value as KnowledgeGraphActivityClass
    );

    const activityData = await getActivityDetail(sessionStore.sessionActivity as Activity)

    // TODO: Neue Entität ist nicht hier drin...
    console.log(activityData)
    console.log("Entity addition response:", response);

    closeDialog();
};
</script>

<template>
    <Button class="mb-4" @click="openDialog">
        Add New Entity
    </Button>

    <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
       @click.self="closeDialog">
    <div :class="mode === 'dark' ? 'modal-container dark' : 'modal-container light'">
      <button class="close-btn" @click="closeDialog">×</button>
      <div class="header-container flex items-center mb-4">
        <h2 class="text-xl font-bold">Add New Entity</h2>
      </div>

      <!-- Side-by-side inputs for entity name and activity class -->
      <div class="inputs-container mb-4">
        <div class="input-group">
          <label for="entityName" class="input-label">Entity Name</label>
          <input id="entityName" type="text" v-model="entityName" placeholder="Enter entity name" class="input-field" />
        </div>
        <div class="input-group">
          <label for="entityClass" class="input-label">Activity Class</label>
          <select id="entityClass" v-model="selectedClass" class="input-field">
            <option disabled value="">Select a class</option>
            <option v-for="option in activityClassOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex gap-4">
        <Button class="w-full" @click="applyEntity">Apply</Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-container {
  position: relative;
  border-radius: 0.5rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  width: 100%;
  max-width: 90%;
}
.modal-container.light {
  background: white;
}
.modal-container.dark {
  background: #2d3748;
}
.close-btn {
  position: absolute;
  top: 0.5rem;
  right: 1rem;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: inherit;
}

/* Container for side-by-side inputs */
.inputs-container {
  display: flex;
  gap: 1rem;
}

/* Each input group styled like the RDFAdditionDropdown input */
.input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.input-label {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  color: #4a5568;
}
select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
}
.input-field {
  padding: 8px;
  border: 1px solid #a6a4a4;
  border-radius: 4px;
  font-size: 1rem;
  outline: none;
  width: 100%;
}
.input-field:focus {
  border-color: #3182ce;
}
</style>
