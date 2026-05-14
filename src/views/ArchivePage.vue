<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useActivityStore } from '@/stores/activityStore';
import { useSessionStore } from '@/stores/sessionStore';
import ActivityCard from '@/components/ActivityCard.vue';
import LanguageSelect from '@/components/LanguageSelect.vue';
import ThemeSwitchButton from '@/components/ThemeSwitchButton.vue';
import LogoutButton from '@/components/LogoutButton.vue';
import HomeButton from '@/components/HomeButton.vue';
import { staticContent } from '@/data/contentData';

const activityStore = useActivityStore();
const sessionStore = useSessionStore();

const archivedActivities = computed(() => activityStore.archivedActivities);

onMounted(async () => {
  await activityStore.refreshActivityList();
});
</script>

<template>
  <div class="flex flex-col items-center justify-center py-4 px-4">
    <div class="flex items-center gap-2 justify-end w-full mb-4">
        <LanguageSelect />
        <HomeButton />
        <LogoutButton />
        <ThemeSwitchButton />
    </div>

    <div class="w-full max-w-5xl">
      <h1 class="text-3xl font-semibold text-center mb-6">
        {{ staticContent.startPage.archivePageTitle[sessionStore.activeLanguage] }}
      </h1>

      <div v-if="archivedActivities.length === 0" class="text-center text-muted-foreground">
        {{ staticContent.startPage.noArchivedActivities[sessionStore.activeLanguage] }}
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-6">
        <ActivityCard
          v-for="activity in archivedActivities"
          :key="activity.graph"
          :activity="activity"
          :is-archived-view="true"
          class="h-fit"
        />
      </div>
    </div>
  </div>
</template>
