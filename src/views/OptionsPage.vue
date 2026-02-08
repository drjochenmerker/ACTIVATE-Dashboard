<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useApiKeysStore, type LLMProvider, type LLMRequestConfig } from '@/stores/apiKeysStore';
import { useSessionStore } from '@/stores/sessionStore';
import { staticContent } from '@/data/contentData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Key, Save, Edit, X } from 'lucide-vue-next';

const apiKeysStore = useApiKeysStore();
const sessionStore = useSessionStore();

// Ausgewähltes Modell
const selectedProvider = ref<LLMProvider>('chatgpt');

// Bearbeiten-Modus
const isEditing = ref(false);

// Formular-Felder für die Konfiguration
const formApiKey = ref('');
const formModelName = ref('');
const formTemperature = ref<number>(0.7);
const formOrganizationId = ref(''); // ChatGPT

// Prompt
const prompt = ref('');
const isEditingPrompt = ref(false);

// Lade Einstellungen beim Mounten
onMounted(() => {
  apiKeysStore.loadSettings();
  selectedProvider.value = apiKeysStore.settings.selectedProvider;
  prompt.value = apiKeysStore.getPrompt();
  loadModelConfig(selectedProvider.value);
});

// Lade Konfiguration für ein Modell
const loadModelConfig = (provider: LLMProvider, resetEditing: boolean = true) => {
  const modelConfig = apiKeysStore.getModelConfig(provider);
  if (modelConfig) {
    formModelName.value = modelConfig.config.modelName;
    formTemperature.value = modelConfig.config.temperature ?? 0.7;
    formOrganizationId.value = modelConfig.config.organizationId || '';
  } else {
    // Setze Standardwerte
    resetFormForProvider(provider);
  }
  if (resetEditing) {
    isEditing.value = false;
  }
};

// Setze Standardwerte basierend auf Provider
const resetFormForProvider = (provider: LLMProvider) => {
  const defaults = apiKeysStore.getDefaultConfig(provider);
  formApiKey.value = '';
  formModelName.value = '';
  formTemperature.value = defaults.temperature ?? 0.7;
  formOrganizationId.value = '';
};

// Watch Provider-Änderung
watch(selectedProvider, (newProvider) => {
  apiKeysStore.setSelectedProvider(newProvider);
  loadModelConfig(newProvider);
  isEditing.value = false;
});

// Öffne Bearbeitungsmodus
const startEditing = () => {
  loadModelConfig(selectedProvider.value, false);
  isEditing.value = true;
};

// Abbrechen Bearbeitung
const cancelEditing = () => {
  isEditing.value = false;
  loadModelConfig(selectedProvider.value);
};

// Speichere Konfiguration für das aktuelle Modell
const saveModelConfig = () => {
  if (!formModelName.value.trim()) {
    return;
  }

  // Verwende gespeicherten API-Key, falls vorhanden, sonst den eingegebenen
  const existingConfig = apiKeysStore.getModelConfig(selectedProvider.value);

  const config: LLMRequestConfig = {
    modelName: formModelName.value,
    selectedProvider: selectedProvider.value,
    temperature: formTemperature.value,
  };

  if (selectedProvider.value === 'chatgpt' && formOrganizationId.value.trim()) {
    config.organizationId = formOrganizationId.value.trim();
  }

  apiKeysStore.setModelConfig(selectedProvider.value, config);
  isEditing.value = false;
};

// Öffne Prompt-Bearbeitung
const startEditingPrompt = () => {
  isEditingPrompt.value = true;
  prompt.value = apiKeysStore.getPrompt();
};

// Abbrechen Prompt-Bearbeitung
const cancelEditingPrompt = () => {
  isEditingPrompt.value = false;
  prompt.value = apiKeysStore.getPrompt();
};

// Speichere Prompt
const savePrompt = () => {
  apiKeysStore.setPrompt(prompt.value);
  isEditingPrompt.value = false;
};

// Provider-Namen für Anzeige
const getProviderDisplayName = (provider: LLMProvider): string => {
  const names = {
    chatgpt: 'ChatGPT (OpenAI)',
    gemini: 'Gemini (Google)',
    claude: 'Claude (Anthropic)',
  };
  return names[provider];
};

// Hole aktuelle Modell-Konfiguration für Anzeige
const getCurrentModelConfig = () => {
  return apiKeysStore.getModelConfig(selectedProvider.value);
};
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold mb-1 text-center flex items-center justify-center gap-2">
        <Key class="w-6 h-6" />
        {{ staticContent.optionsPage.title[sessionStore.activeLanguage] }}
      </h1>
      <p class="text-center text-muted-foreground mt-2">
        {{ staticContent.optionsPage.description[sessionStore.activeLanguage] }}
      </p>
      <hr
        class="mt-4 h-0.5 border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-900 to-transparent opacity-70 dark:via-neutral-400" />
    </div>

    <div class="flex-1 overflow-y-auto">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Modell-Auswahl -->
        <Card>
          <CardHeader>
            <CardTitle>{{ staticContent.optionsPage.selectModel[sessionStore.activeLanguage] }}</CardTitle>
            <CardDescription>
              {{ staticContent.optionsPage.provider[sessionStore.activeLanguage] }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select v-model="selectedProvider">
              <SelectTrigger>
                <SelectValue :placeholder="staticContent.optionsPage.selectModel[sessionStore.activeLanguage]" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chatgpt">ChatGPT (OpenAI)</SelectItem>
                <SelectItem value="gemini">Gemini (Google)</SelectItem>
                <SelectItem value="claude">Claude (Anthropic)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <!-- Modell-Konfiguration -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>{{ staticContent.optionsPage.modelConfiguration[sessionStore.activeLanguage] }}</CardTitle>
                <CardDescription>
                  {{ getProviderDisplayName(selectedProvider) }}
                </CardDescription>
              </div>
              <Button
                v-if="!isEditing"
                @click="startEditing"
                variant="outline"
                size="sm"
              >
                <Edit class="w-4 h-4 mr-2" />
                {{ staticContent.optionsPage.edit[sessionStore.activeLanguage] }}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <!-- Anzeige-Modus -->
            <div v-if="!isEditing">
              <div v-if="getCurrentModelConfig()" class="space-y-4">
                <div class="space-y-3">
                  <div class="space-y-1">
                    <Label class="text-xs text-muted-foreground">{{ staticContent.optionsPage.modelName[sessionStore.activeLanguage] }}</Label>
                    <div class="text-sm font-medium">{{ getCurrentModelConfig()?.config.modelName }}</div>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                      <Label class="text-xs text-muted-foreground">{{ staticContent.optionsPage.temperature[sessionStore.activeLanguage] }}</Label>
                      <div class="text-sm">{{ getCurrentModelConfig()?.config.temperature ?? '-' }}</div>
                    </div>
                  </div>
                  <div v-if="selectedProvider === 'chatgpt' && getCurrentModelConfig()?.config.organizationId" class="space-y-1">
                    <Label class="text-xs text-muted-foreground">{{ staticContent.optionsPage.organizationId[sessionStore.activeLanguage] }}</Label>
                    <div class="text-sm">{{ getCurrentModelConfig()?.config.organizationId }}</div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-8 text-muted-foreground">
                <p>{{ staticContent.optionsPage.noConfiguration[sessionStore.activeLanguage] }}</p>
              </div>
            </div>

            <!-- Bearbeitungs-Modus -->
            <div v-else class="space-y-4">
              <!-- Modellname -->
              <div class="space-y-2">
                <Label :for="'form-model'">{{ staticContent.optionsPage.modelName[sessionStore.activeLanguage] }}</Label>
                <Input
                  id="form-model"
                  v-model="formModelName"
                  :placeholder="staticContent.optionsPage.modelNamePlaceholder[sessionStore.activeLanguage]"
                />
              </div>

              <!-- Gemeinsame Parameter -->
              <div class="">
                <div class="space-y-2">
                  <Label :for="'form-temperature'">{{ staticContent.optionsPage.temperature[sessionStore.activeLanguage] }}</Label>
                  <Input
                    id="form-temperature"
                    v-model.number="formTemperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                  />
                </div>
              </div>

              <!-- ChatGPT-spezifische Felder -->
              <div v-if="selectedProvider === 'chatgpt'" class="space-y-2">
                <Label :for="'form-org-id'">{{ staticContent.optionsPage.organizationId[sessionStore.activeLanguage] }}</Label>
                <Input
                  id="form-org-id"
                  v-model="formOrganizationId"
                  :placeholder="staticContent.optionsPage.organizationId[sessionStore.activeLanguage]"
                />
              </div>

              <!-- Buttons -->
              <div class="flex justify-end gap-2 pt-2">
                <Button variant="outline" @click="cancelEditing">
                  <X class="w-4 h-4 mr-2" />
                  {{ staticContent.optionsPage.cancel[sessionStore.activeLanguage] }}
                </Button>
                <Button
                  @click="saveModelConfig"
                  :disabled="!formModelName.trim() || formTemperature < 0"
                >
                  <Save class="w-4 h-4 mr-2" />
                  {{ staticContent.optionsPage.save[sessionStore.activeLanguage] }}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Prompt-Konfiguration -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>{{ staticContent.optionsPage.promptConfiguration[sessionStore.activeLanguage] }}</CardTitle>
                <CardDescription>
                  {{ staticContent.optionsPage.promptPlaceholder[sessionStore.activeLanguage] }}
                </CardDescription>
              </div>
              <Button
                v-if="!isEditingPrompt"
                @click="startEditingPrompt"
                variant="outline"
                size="sm"
              >
                <Edit class="w-4 h-4 mr-2" />
                {{ staticContent.optionsPage.edit[sessionStore.activeLanguage] }}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <!-- Anzeige-Modus -->
            <div v-if="!isEditingPrompt">
              <div v-if="apiKeysStore.getPrompt()" class="space-y-2">
                <div class="rounded-md border bg-muted p-4">
                  <pre class="whitespace-pre-wrap text-sm font-mono">{{ apiKeysStore.getPrompt() }}</pre>
                </div>
              </div>
              <div v-else class="text-center py-8 text-muted-foreground">
                <p>{{ staticContent.optionsPage.noConfiguration[sessionStore.activeLanguage] }}</p>
              </div>
            </div>

            <!-- Bearbeitungs-Modus -->
            <div v-else class="space-y-4">
              <div class="space-y-2">
                <Label :for="'form-prompt'">{{ staticContent.optionsPage.prompt[sessionStore.activeLanguage] }}</Label>
                <Textarea
                  id="form-prompt"
                  v-model="prompt"
                  :placeholder="staticContent.optionsPage.promptPlaceholder[sessionStore.activeLanguage]"
                  class="min-h-[200px] font-mono text-sm"
                />
              </div>
              <div class="flex justify-end gap-2">
                <Button variant="outline" @click="cancelEditingPrompt">
                  <X class="w-4 h-4 mr-2" />
                  {{ staticContent.optionsPage.cancel[sessionStore.activeLanguage] }}
                </Button>
                <Button @click="savePrompt">
                  <Save class="w-4 h-4 mr-2" />
                  {{ staticContent.optionsPage.save[sessionStore.activeLanguage] }}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
