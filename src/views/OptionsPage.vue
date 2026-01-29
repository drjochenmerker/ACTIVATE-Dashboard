<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useApiKeysStore, type LLMApiKeyEntry } from '@/stores/apiKeysStore';
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
import { Key, Plus, Edit, Trash2, Eye, EyeOff, Save, X } from 'lucide-vue-next';

const apiKeysStore = useApiKeysStore();
const sessionStore = useSessionStore();

// Dialog-Zustand
const isDialogOpen = ref(false);
const editingEntry = ref<LLMApiKeyEntry | null>(null);

// Formular-Felder
const formName = ref('');
const formModelName = ref('');
const formApiKey = ref('');
const showApiKey = ref(false);

// Sichtbarkeit der API Keys in der Liste
const showKeys = ref<Record<string, boolean>>({});

// Lade Einträge beim Mounten
onMounted(() => {
  apiKeysStore.loadApiKeys();
});

// Öffne Dialog zum Hinzufügen
const openAddDialog = () => {
  editingEntry.value = null;
  formName.value = '';
  formModelName.value = '';
  formApiKey.value = '';
  showApiKey.value = false;
  isDialogOpen.value = true;
};

// Öffne Dialog zum Bearbeiten
const openEditDialog = (entry: LLMApiKeyEntry) => {
  editingEntry.value = entry;
  formName.value = entry.name;
  formModelName.value = entry.modelName;
  formApiKey.value = entry.apiKey;
  showApiKey.value = false;
  isDialogOpen.value = true;
};

// Speichere Eintrag (neu oder bearbeitet)
const saveEntry = () => {
  if (!formName.value.trim() || !formModelName.value.trim() || !formApiKey.value.trim()) {
    return;
  }

  if (editingEntry.value) {
    // Bearbeiten
    apiKeysStore.updateEntry(
      editingEntry.value.id,
      formName.value,
      formModelName.value,
      formApiKey.value
    );
  } else {
    // Neu hinzufügen
    apiKeysStore.addEntry(formName.value, formModelName.value, formApiKey.value);
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
  formModelName.value = '';
  formApiKey.value = '';
  showApiKey.value = false;
};

// Toggle für die Anzeige des API Keys in der Liste
const toggleKeyVisibility = (entryId: string) => {
  showKeys.value[entryId] = !showKeys.value[entryId];
};

// Maskiere API Key für Anzeige
const maskApiKey = (apiKey: string): string => {
  if (apiKey.length <= 8) {
    return '•'.repeat(apiKey.length);
  }
  return apiKey.substring(0, 4) + '•'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
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
  modelName: {
    en: 'Model Name',
    de: 'Modellname',
    sv: 'Modellnamn',
  },
  modelNamePlaceholder: {
    en: 'e.g., gpt-4.1-mini, gemini-pro',
    de: 'z.B. gpt-4.1-mini, gemini-pro',
    sv: 't.ex. gpt-4.1-mini, gemini-pro',
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
                    {{ t('modelName') }}: {{ entry.modelName }}
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
              <div class="space-y-2">
                <Label>{{ t('apiKey') }}</Label>
                <div class="relative flex items-center gap-2">
                  <div class="relative flex-1">
                    <Input
                      :value="showKeys[entry.id] ? entry.apiKey : maskApiKey(entry.apiKey)"
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
                      <Eye v-if="!showKeys[entry.id]" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </Button>
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
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isDialogOpen = false">
            <X class="w-4 h-4 mr-2" />
            {{ t('cancel') }}
          </Button>
          <Button
            @click="saveEntry"
            :disabled="!formName.trim() || !formModelName.trim() || !formApiKey.trim()"
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
