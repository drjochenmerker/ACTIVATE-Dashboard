<script setup lang="ts">
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { GraduationCap } from 'lucide-vue-next';
import { useSessionStore } from '@/stores/sessionStore';
import { computed } from 'vue';
import { staticContent } from '@/data/contentData';

const sessionStore = useSessionStore();

const viewOptions = computed(() => [
  { value: 'true', label: staticContent.navbarInstructorView.instructor[sessionStore.activeLanguage] },
  { value: 'false', label: staticContent.navbarInstructorView.standard[sessionStore.activeLanguage] },
]);

const selectedView = computed({
  get: () => String(sessionStore.instructorView),
  set: (value: string) => {
    sessionStore.instructorView = value === 'true';
  }
});

</script>

<template>
  <div class="flex flex-row gap-2 items-center">
    <GraduationCap class="w-5 h-5" />
    <Select :default-value="'false'" v-model="selectedView" id="instructorViewSelect">
      <SelectTrigger class="w-40 overflow-hidden whitespace-nowrap truncate">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="option in viewOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
