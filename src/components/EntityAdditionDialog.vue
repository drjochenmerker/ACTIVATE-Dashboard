<script setup lang="ts">
import { ref, watch } from 'vue';
import Button from '@/components/ui/button/Button.vue';
import { useColorMode } from '@vueuse/core';
import { useSessionStore } from '@/stores/sessionStore';
import { KnowledgeGraphActivityClass } from '@/data/knowledge_graph/structures';
import { addEntity } from '@/data/knowledge_graph/write_operations';
import { activateTerms, staticContent } from '@/data/contentData';


/**
 * Props of the AddEntityModal component
 * @property isOpen - Indicates if the modal is open (passed from parent)
 */
const props = defineProps<{
  isOpen: boolean,
}>();

// Current color mode (Light- or Dark-Mode)
const mode = useColorMode();

// Session store to access and modify current activity data
const sessionStore = useSessionStore();

// Local state for modal visibility and input values
const isOpen = ref(props.isOpen);
const entityName = ref('');
const selectedClass = ref<KnowledgeGraphActivityClass | ''>('');


/**
 * Options for the activity class dropdown
 * Includes label and value for each supported activity class
 */
let activityClassOptions = [
  { label: activateTerms[sessionStore.activeLanguage].subject, value: KnowledgeGraphActivityClass.subject },
  { label: activateTerms[sessionStore.activeLanguage].object, value: KnowledgeGraphActivityClass.object },
  { label: activateTerms[sessionStore.activeLanguage].rules, value: KnowledgeGraphActivityClass.rules },
  { label: activateTerms[sessionStore.activeLanguage].instruments, value: KnowledgeGraphActivityClass.instruments },
  { label: activateTerms[sessionStore.activeLanguage].division_of_labour, value: KnowledgeGraphActivityClass.divison_of_labour },
  { label: activateTerms[sessionStore.activeLanguage].community, value: KnowledgeGraphActivityClass.community }
];

watch(() => sessionStore.activeLanguage, () => {
  activityClassOptions = [
    { label: activateTerms[sessionStore.activeLanguage].subject, value: KnowledgeGraphActivityClass.subject },
    { label: activateTerms[sessionStore.activeLanguage].object, value: KnowledgeGraphActivityClass.object },
    { label: activateTerms[sessionStore.activeLanguage].rules, value: KnowledgeGraphActivityClass.rules },
    { label: activateTerms[sessionStore.activeLanguage].instruments, value: KnowledgeGraphActivityClass.instruments },
    { label: activateTerms[sessionStore.activeLanguage].division_of_labour, value: KnowledgeGraphActivityClass.divison_of_labour },
    { label: activateTerms[sessionStore.activeLanguage].community, value: KnowledgeGraphActivityClass.community }
  ];
});

/**
 * Opens the modal dialog
 */
const openDialog = async () => {
  isOpen.value = true;
};

/**
 * Closes the modal and resets the input fields
 */
const closeDialog = () => {
  isOpen.value = false;
  resetInputs();
};

/**
 * Resets input fields to default values
 */
const resetInputs = () => {
  entityName.value = '';
  selectedClass.value = '';
};

/**
 * Applies the entity creation logic
 * Validates inputs and adds the entity to the knowledge graph
 */
const applyEntity = async () => {
  if (!entityName.value.trim()) {
    alert(staticContent.alerts.entityEnter[sessionStore.activeLanguage]);
    return;
  }
  if (!selectedClass.value) {
    alert(staticContent.alerts.activityClassSelect[sessionStore.activeLanguage]);
    return;
  }

  await addEntity(
    sessionStore.sessionActivity!.graph,
    entityName.value,
    selectedClass.value as KnowledgeGraphActivityClass,
    sessionStore.activeLanguage
  );

  // Notify other components that data is outdated
  sessionStore.outdated = true;
  closeDialog();
};
</script>

<template>
  <Button class="mb-4" @click="openDialog">
    {{ staticContent.entitiyAdd.addButton[sessionStore.activeLanguage] }}
  </Button>

  <div
v-if="isOpen" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    @click.self="closeDialog">
    <div :class="mode === 'dark' ? 'modal-container dark' : 'modal-container light'">
      <button class="close-btn" @click="closeDialog">×</button>
      <div class="header-container flex items-center mb-4">
        <h2 class="text-xl font-bold">{{ staticContent.entitiyAdd.addButton[sessionStore.activeLanguage] }}</h2>
      </div>

      <!-- Side-by-side inputs for entity name and activity class -->
      <div class="inputs-container mb-4">
        <div class="input-group">
          <label
for="entityName"
            class="input-label">{{ staticContent.entitiyAdd.entityName[sessionStore.activeLanguage] }}</label>
          <input
id="entityName" v-model="entityName" type="text"
            :placeholder="staticContent.alerts.entityEnter[sessionStore.activeLanguage]" class="input-field" />
        </div>
        <div class="input-group">
          <label for="entityClass" class="input-label">{{
            staticContent.entitiyAdd.activityClass[sessionStore.activeLanguage] }}</label>
          <select id="entityClass" v-model="selectedClass" class="input-field">
            <option disabled value="">{{ staticContent.entitiyAdd.selectClass[sessionStore.activeLanguage] }}</option>
            <option v-for="option in activityClassOptions" :key="option.label" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex gap-4">
        <Button class="w-full" @click="applyEntity">{{ staticContent.terms.add[sessionStore.activeLanguage] }}</Button>
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
