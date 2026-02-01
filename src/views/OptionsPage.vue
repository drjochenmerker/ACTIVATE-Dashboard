<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useApiKeysStore, type LLMApiKeyEntry, type LLMProvider, type LLMRequestConfig } from '@/stores/apiKeysStore';
import { useSessionStore } from '@/stores/sessionStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Key, Plus, Edit, Trash2, Eye, EyeOff, Save, X } from 'lucide-vue-next';

const apiKeysStore = useApiKeysStore();
const sessionStore = useSessionStore();

// Dialog-Zustand
const isDialogOpen = ref(false);
const editingEntry = ref<LLMApiKeyEntry | null>(null);

// Formular-Felder
const formName = ref('');
const formProvider = ref<LLMProvider>('chatgpt');
const formApiKey = ref('');
const formModelName = ref('');
const formEndpoint = ref('');
const formTemperature = ref<number>(0.7);
const formMaxTokens = ref<number>(2000);
const formOrganizationId = ref(''); // ChatGPT
const formTopK = ref<number>(40); // Gemini
const formTopP = ref<number>(0.95); // Gemini
const formAnthropicVersion = ref('2023-06-01'); // Claude
const showApiKey = ref(false);

// Sichtbarkeit der API Keys in der Liste
const showKeys = ref<Record<string, boolean>>({});

// Lade Einträge beim Mounten
onMounted(() => {
  apiKeysStore.loadApiKeys();
});

// Setze Standardwerte basierend auf Provider
const resetFormForProvider = (provider: LLMProvider) => {
  const defaults = apiKeysStore.getDefaultConfig(provider);
  formTemperature.value = defaults.temperature ?? 0.7;
  formMaxTokens.value = defaults.maxTokens ?? 2000;
  formTopK.value = defaults.topK ?? 40;
  formTopP.value = defaults.topP ?? 0.95;
  formAnthropicVersion.value = defaults.anthropicVersion ?? '2023-06-01';
  formOrganizationId.value = '';
  formEndpoint.value = '';
};

// Watch Provider-Änderung
watch(formProvider, (newProvider) => {
  if (!editingEntry.value) {
    resetFormForProvider(newProvider);
  }
});

// Öffne Dialog zum Hinzufügen
const openAddDialog = () => {
  editingEntry.value = null;
  formName.value = '';
  formProvider.value = 'chatgpt';
  formModelName.value = '';
  formApiKey.value = '';
  showApiKey.value = false;
  resetFormForProvider('chatgpt');
  isDialogOpen.value = true;
};

// Öffne Dialog zum Bearbeiten
const openEditDialog = (entry: LLMApiKeyEntry) => {
  editingEntry.value = entry;
  formName.value = entry.name;
  formProvider.value = entry.provider;
  formModelName.value = entry.config.modelName;
  formApiKey.value = entry.config.apiKey;
  formEndpoint.value = entry.config.endpoint || '';
  formTemperature.value = entry.config.temperature ?? 0.7;
  formMaxTokens.value = entry.config.maxTokens ?? 2000;
  formOrganizationId.value = entry.config.organizationId || '';
  formTopK.value = entry.config.topK ?? 40;
  formTopP.value = entry.config.topP ?? 0.95;
  formAnthropicVersion.value = entry.config.anthropicVersion || '2023-06-01';
  showApiKey.value = false;
  isDialogOpen.value = true;
};

// Speichere Eintrag (neu oder bearbeitet)
const saveEntry = () => {
  if (!formName.value.trim() || !formModelName.value.trim() || !formApiKey.value.trim()) {
    return;
  }

  const config: LLMRequestConfig = {
    apiKey: formApiKey.value,
    modelName: formModelName.value,
    temperature: formTemperature.value,
    maxTokens: formMaxTokens.value,
  };

  // Provider-spezifische Felder
  if (formEndpoint.value.trim()) {
    config.endpoint = formEndpoint.value.trim();
  }

  if (formProvider.value === 'chatgpt' && formOrganizationId.value.trim()) {
    config.organizationId = formOrganizationId.value.trim();
  }

  if (formProvider.value === 'gemini') {
    config.topK = formTopK.value;
    config.topP = formTopP.value;
  }

  if (formProvider.value === 'claude') {
    config.anthropicVersion = formAnthropicVersion.value;
  }

  if (editingEntry.value) {
    // Bearbeiten
    apiKeysStore.updateEntry(
      editingEntry.value.id,
      formName.value,
      formProvider.value,
      config
    );
  } else {
    // Neu hinzufügen
    apiKeysStore.addEntry(formName.value, formProvider.value, config);
  }

  isDialogOpen.value = false;
  resetForm();
};

// Lösche Eintrag
const deleteEntry = (id: string) => {
  if (confirm(t('confirmDelete'))) {
    apiKeysStore.deleteEntry(id);
  }
};

// Setze Formular zurück
const resetForm = () => {
  editingEntry.value = null;
  formName.value = '';
  formProvider.value = 'chatgpt';
  formModelName.value = '';
  formApiKey.value = '';
  showApiKey.value = false;
  resetFormForProvider('chatgpt');
};

// Toggle für die Anzeige des API Keys in der Liste
const toggleKeyVisibility = (entryId: string) => {
  showKeys.value[entryId] = !(showKeys.value[entryId] ?? false);
};

// Prüfe ob Key sichtbar ist (mit Standard false)
const isKeyVisible = (entryId: string): boolean => {
  return showKeys.value[entryId] ?? false;
};

// Maskiere API Key für Anzeige
const maskApiKey = (apiKey: string | undefined): string => {
  if (!apiKey || apiKey.length === 0) {
    return '';
  }
  if (apiKey.length <= 8) {
    return '•'.repeat(apiKey.length);
  }
  return apiKey.substring(0, 4) + '•'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
};

// Hole Anzeige-Endpunkt
const getDisplayEndpoint = (entry: LLMApiKeyEntry): string => {
  if (entry.config.endpoint) {
    return entry.config.endpoint;
  }
  return apiKeysStore.getDefaultEndpoint(entry.provider, entry.config.modelName);
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

// Übersetzungen
const translations = {
  title: {
    en: 'LLM API Keys',
    de: 'LLM API-Schlüssel',
    sv: 'LLM API-nycklar',
  },
  description: {
    en: 'Manage your API keys and model names for various LLMs',
    de: 'Verwalten Sie Ihre API-Schlüssel und Modellnamen für verschiedene LLMs',
    sv: 'Hantera dina API-nycklar och modellnamn för olika LLMs',
  },
  addEntry: {
    en: 'Add LLM Entry',
    de: 'LLM-Eintrag hinzufügen',
    sv: 'Lägg till LLM-post',
  },
  name: {
    en: 'Name',
    de: 'Name',
    sv: 'Namn',
  },
  namePlaceholder: {
    en: 'e.g., Gemini, GPT-4, Claude',
    de: 'z.B. Gemini, GPT-4, Claude',
    sv: 't.ex. Gemini, GPT-4, Claude',
  },
  provider: {
    en: 'LLM Provider',
    de: 'LLM-Anbieter',
    sv: 'LLM-leverantör',
  },
  modelName: {
    en: 'Model Name',
    de: 'Modellname',
    sv: 'Modellnamn',
  },
  modelNamePlaceholder: {
    en: 'e.g., gpt-4, gemini-pro, claude-3-opus',
    de: 'z.B. gpt-4, gemini-pro, claude-3-opus',
    sv: 't.ex. gpt-4, gemini-pro, claude-3-opus',
  },
  endpoint: {
    en: 'API Endpoint (optional)',
    de: 'API-Endpunkt (optional)',
    sv: 'API-slutpunkt (valfritt)',
  },
  endpointPlaceholder: {
    en: 'Leave empty for default endpoint',
    de: 'Leer lassen für Standard-Endpunkt',
    sv: 'Lämna tomt för standardslutpunkt',
  },
  temperature: {
    en: 'Temperature',
    de: 'Temperatur',
    sv: 'Temperatur',
  },
  maxTokens: {
    en: 'Max Tokens',
    de: 'Max. Tokens',
    sv: 'Max tokens',
  },
  organizationId: {
    en: 'Organization ID (optional)',
    de: 'Organisations-ID (optional)',
    sv: 'Organisations-ID (valfritt)',
  },
  topK: {
    en: 'Top K',
    de: 'Top K',
    sv: 'Top K',
  },
  topP: {
    en: 'Top P',
    de: 'Top P',
    sv: 'Top P',
  },
  anthropicVersion: {
    en: 'API Version',
    de: 'API-Version',
    sv: 'API-version',
  },
  apiKey: {
    en: 'API Key',
    de: 'API-Schlüssel',
    sv: 'API-nyckel',
  },
  apiKeyPlaceholder: {
    en: 'Enter your API key',
    de: 'Geben Sie Ihren API-Schlüssel ein',
    sv: 'Ange din API-nyckel',
  },
  save: {
    en: 'Save',
    de: 'Speichern',
    sv: 'Spara',
  },
  cancel: {
    en: 'Cancel',
    de: 'Abbrechen',
    sv: 'Avbryt',
  },
  edit: {
    en: 'Edit',
    de: 'Bearbeiten',
    sv: 'Redigera',
  },
  delete: {
    en: 'Delete',
    de: 'Löschen',
    sv: 'Ta bort',
  },
  noEntries: {
    en: 'No API key entries yet. Add your first entry to get started.',
    de: 'Noch keine API-Schlüssel-Einträge. Fügen Sie Ihren ersten Eintrag hinzu.',
    sv: 'Inga API-nyckelposter ännu. Lägg till din första post för att komma igång.',
  },
  confirmDelete: {
    en: 'Are you sure you want to delete this entry?',
    de: 'Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?',
    sv: 'Är du säker på att du vill ta bort denna post?',
  },
  editEntry: {
    en: 'Edit Entry',
    de: 'Eintrag bearbeiten',
    sv: 'Redigera post',
  },
  addNewEntry: {
    en: 'Add New Entry',
    de: 'Neuen Eintrag hinzufügen',
    sv: 'Lägg till ny post',
  },
};

const t = (key: keyof typeof translations) => {
  return translations[key][sessionStore.activeLanguage] || translations[key].de;
};

// Berechnete Eigenschaften
const entries = computed(() => apiKeysStore.getAllEntries());
const dialogTitle = computed(() => editingEntry.value ? t('editEntry') : t('addNewEntry'));

// Computed property für die Anzeige der API-Keys - muss reaktiv sein
const displayApiKey = computed(() => {
  const result: Record<string, string> = {};
  entries.value.forEach(entry => {
    const apiKey = entry.config?.apiKey;
    if (apiKey && apiKey.trim().length > 0) {
      const visible = showKeys.value[entry.id] ?? false;
      result[entry.id] = visible ? apiKey : maskApiKey(apiKey);
    } else {
      result[entry.id] = '';
    }
  });
  return result;
});


</script>

<template>
  <div class="flex flex-col h-full">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold mb-1 text-center flex items-center justify-center gap-2">
        <Key class="w-6 h-6" />
        {{ t('title') }}
      </h1>
      <p class="text-center text-muted-foreground mt-2">
        {{ t('description') }}
      </p>
      <hr
        class="mt-4 h-0.5 border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-900 to-transparent opacity-70 dark:via-neutral-400" />
    </div>

    <div class="flex-1 overflow-y-auto">
      <div class="max-w-4xl mx-auto space-y-4">
        <!-- Button zum Hinzufügen -->
        <div class="flex justify-end">
          <Button @click="openAddDialog" variant="default">
            <Plus class="w-4 h-4 mr-2" />
            {{ t('addEntry') }}
          </Button>
        </div>

        <!-- Liste der Einträge -->
        <div v-if="entries.length > 0" class="space-y-4">
          <Card v-for="entry in entries" :key="entry.id" class="w-full">
            <CardHeader>
              <div class="flex items-start justify-between">
                <div>
                  <CardTitle>{{ entry.name }}</CardTitle>
                  <CardDescription>
                    {{ getProviderDisplayName(entry.provider) }} • {{ t('modelName') }}: {{ entry.config.modelName }}
                  </CardDescription>
                </div>
                <div class="flex gap-2">
                  <Button
                    @click="openEditDialog(entry)"
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                  >
                    <Edit class="w-4 h-4" />
                  </Button>
                  <Button
                    @click="deleteEntry(entry.id)"
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div class="space-y-2">
                  <Label>{{ t('apiKey') }}</Label>
                  <div class="relative flex items-center gap-2">
                    <div class="relative flex-1">
                      <Input
                        :value="displayApiKey[entry.id] || ''"
                        readonly
                        class="pr-10 font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        class="absolute right-0 top-0 h-full px-3"
                        @click="toggleKeyVisibility(entry.id)"
                      >
                        <Eye v-if="!isKeyVisible(entry.id)" class="h-4 w-4" />
                        <EyeOff v-else class="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div class="space-y-2">
                  <Label>{{ t('endpoint') }}</Label>
                  <Input
                    :value="getDisplayEndpoint(entry)"
                    readonly
                    class="font-mono text-sm"
                  />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <Label class="text-xs text-muted-foreground">{{ t('temperature') }}</Label>
                    <div class="text-sm">{{ entry.config.temperature ?? '-' }}</div>
                  </div>
                  <div class="space-y-1">
                    <Label class="text-xs text-muted-foreground">{{ t('maxTokens') }}</Label>
                    <div class="text-sm">{{ entry.config.maxTokens ?? '-' }}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Leere Liste -->
        <Card v-else class="w-full">
          <CardContent class="py-12 text-center">
            <Key class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p class="text-muted-foreground">{{ t('noEntries') }}</p>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Dialog zum Hinzufügen/Bearbeiten -->
    <Dialog v-model:open="isDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ dialogTitle }}</DialogTitle>
          <DialogDescription>
            {{ editingEntry ? t('editEntry') : t('addNewEntry') }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <!-- Name -->
          <div class="space-y-2">
            <Label :for="'form-name'">{{ t('name') }}</Label>
            <Input
              id="form-name"
              v-model="formName"
              :placeholder="t('namePlaceholder')"
            />
          </div>

          <!-- Provider -->
          <div class="space-y-2">
            <Label :for="'form-provider'">{{ t('provider') }}</Label>
            <Select v-model="formProvider" :disabled="!!editingEntry">
              <SelectTrigger id="form-provider">
                <SelectValue :placeholder="t('provider')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chatgpt">ChatGPT (OpenAI)</SelectItem>
                <SelectItem value="gemini">Gemini (Google)</SelectItem>
                <SelectItem value="claude">Claude (Anthropic)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Modellname -->
          <div class="space-y-2">
            <Label :for="'form-model'">{{ t('modelName') }}</Label>
            <Input
              id="form-model"
              v-model="formModelName"
              :placeholder="t('modelNamePlaceholder')"
            />
          </div>

          <!-- API Key -->
          <div class="space-y-2">
            <Label :for="'form-api-key'">{{ t('apiKey') }}</Label>
            <div class="relative">
              <Input
                id="form-api-key"
                v-model="formApiKey"
                :type="showApiKey ? 'text' : 'password'"
                :placeholder="t('apiKeyPlaceholder')"
                class="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="absolute right-0 top-0 h-full px-3"
                @click="showApiKey = !showApiKey"
              >
                <Eye v-if="!showApiKey" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <!-- Endpoint (optional) -->
          <div class="space-y-2">
            <Label :for="'form-endpoint'">{{ t('endpoint') }}</Label>
            <Input
              id="form-endpoint"
              v-model="formEndpoint"
              :placeholder="t('endpointPlaceholder')"
              class="font-mono text-sm"
            />
          </div>

          <!-- Gemeinsame Parameter -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label :for="'form-temperature'">{{ t('temperature') }}</Label>
              <Input
                id="form-temperature"
                v-model.number="formTemperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
              />
            </div>
            <div class="space-y-2">
              <Label :for="'form-max-tokens'">{{ t('maxTokens') }}</Label>
              <Input
                id="form-max-tokens"
                v-model.number="formMaxTokens"
                type="number"
                min="1"
              />
            </div>
          </div>

          <!-- ChatGPT-spezifische Felder -->
          <div v-if="formProvider === 'chatgpt'" class="space-y-2">
            <Label :for="'form-org-id'">{{ t('organizationId') }}</Label>
            <Input
              id="form-org-id"
              v-model="formOrganizationId"
              :placeholder="t('organizationId')"
            />
          </div>

          <!-- Gemini-spezifische Felder -->
          <div v-if="formProvider === 'gemini'" class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label :for="'form-top-k'">{{ t('topK') }}</Label>
              <Input
                id="form-top-k"
                v-model.number="formTopK"
                type="number"
                min="1"
              />
            </div>
            <div class="space-y-2">
              <Label :for="'form-top-p'">{{ t('topP') }}</Label>
              <Input
                id="form-top-p"
                v-model.number="formTopP"
                type="number"
                step="0.01"
                min="0"
                max="1"
              />
            </div>
          </div>

          <!-- Claude-spezifische Felder -->
          <div v-if="formProvider === 'claude'" class="space-y-2">
            <Label :for="'form-version'">{{ t('anthropicVersion') }}</Label>
            <Input
              id="form-version"
              v-model="formAnthropicVersion"
              placeholder="2023-06-01"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isDialogOpen = false">
            <X class="w-4 h-4 mr-2" />
            {{ t('cancel') }}
          </Button>
          <Button
            @click="saveEntry"
            :disabled="!formName.trim() || !formModelName.trim() || !formApiKey.trim() || formTemperature < 0 || formMaxTokens < 1"
          >
            <Save class="w-4 h-4 mr-2" />
            {{ t('save') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
</style>
