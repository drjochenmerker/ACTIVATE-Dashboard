<script setup lang="ts">
// Import necessary dependencies and components
import { useColorMode } from '@vueuse/core';
import { getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { ref, onMounted, watch, computed } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';
import { KnowledgeGraphActivityClass } from '@/data/knowledge_graph/structures';
// UI components imports...
import {
  Card,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ButtonComponent } from '@/components/ui/button';
import ActivityCard from '@/components/ActivityCard.vue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
// import { addActivity, addEntity } from '@/data/knowledge_graph/write_operations';
import { useActivityStore } from '@/stores/activityStore';
import { buildTreeStructByLang } from '@/data/knowledge_graph/utils';
import { staticContent } from '@/data/contentData';
import LanguageSelect from '@/components/LanguageSelect.vue';
import InstructorViewSelect from '@/components/InstructorViewSelect.vue';
import { PlusIcon } from 'lucide-vue-next';
import { llmSettingGeneration } from '@/data/knowledge_graph/llm_utils';
import LoadingOverlay from '@/components/LoadingOverlay.vue';
import { useLLMSettingsStore } from '@/stores/llmSettingsStore';
import OptionsButton from '@/components/OptionsButton.vue';
import ThemeSwitchButton from '@/components/ThemeSwitchButton.vue';
import LogoutButton from '@/components/LogoutButton.vue';

useColorMode();
const sessionStore = useSessionStore();

// refs
const dialogOpen = ref(false);
const loading = ref(false);

// State management for activities
const selectedActivity = ref<string>();
const activityStore = useActivityStore();
const activities = computed(() => activityStore.activityList);

const newTitle = ref('');
const newDescription = ref('');
const defaultRole = ref('');
const showValidationErrors = ref(false);



// Load all available activities on component mount
onMounted(async () => {
  try {
    await activityStore.getAllActivities();
  } catch (error) {
    console.error("Failed to load activities:", error);
  }
});
// Update available roles when selected activity changes
watch(selectedActivity, async () => {
  if (!selectedActivity.value) {
    return;
  }
  sessionStore.availableRoles = buildTreeStructByLang(
    await getActivityClassIds(selectedActivity.value, KnowledgeGraphActivityClass.subject),
    sessionStore.activeLanguage);
  sessionStore.sessionRole = undefined; // Reset role selection
});



const addNewActivity = async () => {
  showValidationErrors.value = true;
  try {
    loading.value = true;
    await llmSettingGeneration(newDescription.value, useLLMSettingsStore().getCurrentModelRequestConfig(), newTitle.value, defaultRole.value);
    loading.value = false;
  } catch (error) {
    console.error("Error during LLM generation:", error);
  }

  dialogOpen.value = false;
  newTitle.value = '';
  newDescription.value = '';
  defaultRole.value = '';
  showValidationErrors.value = false; // Reset validation state
  await activityStore.refreshActivityList();
};


</script>

<template>
  <div class="flex flex-col items-center justify-center py-4 px-4">
    <div class="flex items-center gap-2 justify-end w-full mb-4">
      <!-- instructorview select has to stay instructorMode so the button stays clickable for the instructor lol  -->
      <InstructorViewSelect v-if="sessionStore.instructorMode" />
      <LanguageSelect />
      <!-- options button always visible if instructor mode is active -->
      <template v-if="sessionStore.instructorMode">
        <OptionsButton />
      </template>
      <LogoutButton />
      <ThemeSwitchButton />
    </div>
    <Card class="w-full max-w-5xl">


      <!-- Card header with logo -->
      <CardHeader class="flex justify-center items-center">
        <CardTitle class="flex justify-center w-full">
          <div class="flex flex-col items-center w-full">
            <h1 class="text-center text-4xl font-semibold mb-4">
              Debriefing-Dashboard
            </h1>
            <img src="@/assets/images/activate-logo-full.gif" alt="Logo" class="mx-auto mt-2" />
          </div>
        </CardTitle>
      </CardHeader>
      <!-- "add button" in the middle -->
      <div v-if="sessionStore.instructorView" class="flex justify-center my-6">
        <Dialog v-model:open="dialogOpen">
          <DialogTrigger as-child>
            <ButtonComponent
              class="text-3xl px-6 py-3 rounded-full text-black bg-white border border-black hover:bg-black hover:text-white transition-colors duration-300">
              <PlusIcon class="h-6 w-6" />
            </ButtonComponent>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{{ staticContent.startPage.createActivity[sessionStore.activeLanguage] }}</DialogTitle>

              <!-- Optional Title -->
              <DialogDescription>{{ staticContent.startPage.enterTitle[sessionStore.activeLanguage] }}
              </DialogDescription>
              <input
v-model="newTitle" type="text"
                class="w-full border rounded p-2 mb-2 dark:bg-gray-900 border-gray-300" />

              <!-- Required Description -->
              <DialogDescription>{{ staticContent.startPage.enterDescription[sessionStore.activeLanguage] }}
              </DialogDescription>
              <textarea
v-model="newDescription" class="w-full border rounded p-2 mb-1 dark:bg-gray-900" :class="[
                showValidationErrors && !newDescription.trim() ? 'border-red-500' : 'border-gray-300'
              ]" />
              <p v-if="showValidationErrors && !newDescription.trim()" class="text-red-500 text-sm mb-2">
                {{ staticContent.startPage.descriptionRequired[sessionStore.activeLanguage] }}
              </p>

              <!-- Optional Default Role -->
              <DialogDescription>{{ staticContent.startPage.defaultRole[sessionStore.activeLanguage] }}
              </DialogDescription>
              <input v-model="defaultRole" class="w-full border rounded p-2 mb-2 dark:bg-gray-900 border-gray-300" />

              <ButtonComponent @click="addNewActivity">{{ staticContent.terms.done[sessionStore.activeLanguage] }}</ButtonComponent>

              <!-- <div v-if="loading">
                <Loader2 class="animate-spin h-5 w-5 ml-2 inline-block" />
                {{ staticContent.placeholders.loading[sessionStore.activeLanguage] }}
              </div> -->
            </DialogHeader>
            <LoadingOverlay
:visible="loading"
              :message="staticContent.placeholders.loading[sessionStore.activeLanguage]"
              class="mt-4 text-red-500 font-semibold" />
          </DialogContent>
        </Dialog>
      </div>

      <!-- Activities Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-6">
        <ActivityCard v-for="activity in activities" :key="activity.graph" :activity="activity" class="h-fit" />
      </div>
    </Card>
  </div>
</template>
