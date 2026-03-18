<script setup lang="ts">
import { ref } from 'vue';
import { staticContent } from '@/data/contentData';
import { useSessionStore } from '@/stores/sessionStore';
import { Settings } from 'lucide-vue-next';
import OptionsPopUp from './OptionsPopUp.vue';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { ButtonComponent } from '@/components/ui/button';

const isOpen = ref(false);

const sessionStore = useSessionStore();

const openPopUp = () => {
  isOpen.value = true;
};
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <ButtonComponent size="icon" class="rounded-full" variant="secondary" @click="openPopUp">
          <Settings />
        </ButtonComponent>
      </TooltipTrigger>
      <TooltipContent>
        <p>{{ staticContent.terms.settings[sessionStore.activeLanguage] }}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  <OptionsPopUp v-model:open="isOpen" />
</template>