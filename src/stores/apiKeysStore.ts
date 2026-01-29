import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Interface für einen LLM API Key Eintrag
 */
export interface LLMApiKeyEntry {
  id: string;
  name: string;
  modelName: string;
  apiKey: string;
}

/**
 * Store für die Verwaltung von API Keys für verschiedene LLMs
 */
export const useApiKeysStore = defineStore('apiKeys', () => {
  const STORAGE_KEY = 'activate_llm_api_keys';

  // Sammlung von API Key Einträgen
  const entries = ref<LLMApiKeyEntry[]>([]);

  // Lade API Keys aus localStorage
  const loadApiKeys = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        entries.value = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Fehler beim Laden der API Keys:', error);
      entries.value = [];
    }
  };

  // Speichere API Keys in localStorage
  const saveApiKeys = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value));
    } catch (error) {
      console.error('Fehler beim Speichern der API Keys:', error);
    }
  };

  // Generiere eine eindeutige ID
  const generateId = (): string => {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Füge einen neuen Eintrag hinzu
  const addEntry = (name: string, modelName: string, apiKey: string): LLMApiKeyEntry => {
    const newEntry: LLMApiKeyEntry = {
      id: generateId(),
      name: name.trim(),
      modelName: modelName.trim(),
      apiKey: apiKey.trim(),
    };
    entries.value.push(newEntry);
    saveApiKeys();
    return newEntry;
  };

  // Aktualisiere einen bestehenden Eintrag
  const updateEntry = (id: string, name: string, modelName: string, apiKey: string): boolean => {
    const index = entries.value.findIndex(entry => entry.id === id);
    if (index !== -1) {
      entries.value[index] = {
        id,
        name: name.trim(),
        modelName: modelName.trim(),
        apiKey: apiKey.trim(),
      };
      saveApiKeys();
      return true;
    }
    return false;
  };

  // Lösche einen Eintrag
  const deleteEntry = (id: string): boolean => {
    const index = entries.value.findIndex(entry => entry.id === id);
    if (index !== -1) {
      entries.value.splice(index, 1);
      saveApiKeys();
      return true;
    }
    return false;
  };

  // Hole einen Eintrag nach ID
  const getEntry = (id: string): LLMApiKeyEntry | undefined => {
    return entries.value.find(entry => entry.id === id);
  };

  // Hole alle Einträge
  const getAllEntries = (): LLMApiKeyEntry[] => {
    return [...entries.value];
  };

  // Initialisiere beim Laden des Stores
  loadApiKeys();

  return {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    getAllEntries,
    loadApiKeys,
    saveApiKeys,
  };
});
