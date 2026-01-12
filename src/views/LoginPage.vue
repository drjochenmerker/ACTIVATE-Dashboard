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
import { checkPassword } from '@/data/auth';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/sessionStore';
import { staticContent } from '@/data/contentData';

useColorMode();

const loading = ref(false);
const passwordInput = ref('');
const showValidationErrors = ref(false);

const router = useRouter();
const sessionStore = useSessionStore();

const login = async () => {
  try {
		showValidationErrors.value = false;
    loading.value = true;
		let success = await checkPassword(passwordInput.value);
		loading.value = false;
    if (success) {
			sessionStore.startSession();
			router.push('/start');
		}
		else {
			showValidationErrors.value = true;
		}
  } catch (error) {
    console.error("Error during login:", error);
  }
};

</script>

<template>
  <div class="flex flex-col items-center justify-center py-10 px-4">
    <LanguageSelect class="absolute top-0 right-0 mt-4 mr-4" />
    <Card class="w-full max-w-5xl">

      <!-- Card header with logo -->
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
				<form>
					<input v-model="passwordInput" type="password" class="dark:bg-gray-900" :placeholder="staticContent.placeholders.password[sessionStore.activeLanguage]" }}>
				</form>
      </div>
			<div v-if="showValidationErrors" class="flex justify-center my-6">
				<p class="mt-4 text-red-500">{{ staticContent.errors.incorrectPassword[sessionStore.activeLanguage] }}</p>
			</div>
			<div class="flex justify-center my-6">
				<Button @click="login" class="text-l px-6 py-3 rounded-full text-black bg-white border border-black hover:bg-black hover:text-white transition-colors duration-300">
          {{ staticContent.login.loginButton[sessionStore.activeLanguage] }}
        </Button>
			</div>
    </Card>
  </div>
</template>
