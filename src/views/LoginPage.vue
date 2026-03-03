<script setup lang="ts">
// Import necessary dependencies and components
import { useColorMode } from '@vueuse/core';
// UI components imports...
import {
  Card,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import LanguageSelect from '@/components/LanguageSelect.vue';
import { ref } from 'vue';
import { ACCOUNT_ROLE, checkPassword } from '@/data/auth';
import { useRouter, useRoute } from 'vue-router'; // ÄNDERUNG: useRoute importieren
import { useSessionStore } from '@/stores/sessionStore';
import { staticContent } from '@/data/contentData';
import ThemeSwitchButton from '@/components/ThemeSwitchButton.vue';

useColorMode();

const loading = ref(false);
const passwordInput = ref('');
const showValidationErrors = ref(false);

const router = useRouter();
const route = useRoute(); // ÄNDERUNG: route initialisieren
const sessionStore = useSessionStore();

const login = async () => {
  try {
    showValidationErrors.value = false;
    loading.value = true;

    // Returns the role based on the entered password
    let role = await checkPassword(passwordInput.value);

    loading.value = false;

    if (role == ACCOUNT_ROLE.STUDENT || role == ACCOUNT_ROLE.ROOT) {
      sessionStore.startSession();

      // Set instructor mode as true if the root password has been entered
      sessionStore.instructorMode = role == ACCOUNT_ROLE.ROOT;

      // redirect logic
      // check if redirect query parameter exists (e.g., /login?redirect=/feedback)
      const redirectPath = route.query.redirect as string;

      if (redirectPath && redirectPath !== '/') {
        // if yes, redirect to that path
        router.push(redirectPath);
      } else {
        // Fallback: redirect to start page
        router.push('/start');
      }
    } else {
      showValidationErrors.value = true;
    }
  } catch (error) {
    console.error("Error during login:", error);
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col items-center justify-center py-4 px-4">
    <div class="flex items-center gap-2 justify-end w-full mb-4">
      <LanguageSelect />
      <ThemeSwitchButton />
    </div>
    <Card class="w-full max-w-5xl">

      <CardHeader class="flex justify-center items-center">
        <CardTitle class="flex justify-center w-full">
          <div class="flex flex-col items-center w-full">
            <h1 class="text-center text-4xl font-semibold mb-4">
              Login
            </h1>
            <img src="@/assets/images/activate-logo-full.gif" alt="Logo" class="mx-auto mt-2" />
          </div>
        </CardTitle>
      </CardHeader>

      <div class="flex justify-center my-6">
        <form @submit.prevent="login">
          <input v-model="passwordInput" :disabled="loading" type="password"
            class="dark:bg-gray-900 border border-gray-600 rounded-md p-2"
            :placeholder="staticContent.placeholders.password[sessionStore.activeLanguage]">
        </form>
      </div>
      <div v-if="showValidationErrors" class="flex justify-center my-6">
        <p class="mt-4 text-red-500">{{ staticContent.errors.incorrectPassword[sessionStore.activeLanguage] }}</p>
      </div>
      <div class="flex justify-center my-6">
        <button @click="login" :disabled="loading"
          class="text-l px-6 py-3 rounded-full text-black bg-white border border-black hover:bg-black hover:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black">
          {{ staticContent.login.loginButton[sessionStore.activeLanguage] }}
        </button>
      </div>
    </Card>
  </div>
</template>