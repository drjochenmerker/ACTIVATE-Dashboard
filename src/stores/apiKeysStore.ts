import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Unterstützte LLM-Provider
 */
export type LLMProvider = 'chatgpt' | 'gemini' | 'claude';

/**
 * Request-Format-Konfiguration für verschiedene LLM-Provider
 */
export interface LLMRequestConfig {
  // Gemeinsame Felder
  apiKey: string;
  modelName: string;
  
  // Provider-spezifische Konfiguration
  endpoint?: string; // Optional, falls Standard-Endpoint überschrieben werden soll
  temperature?: number;
  maxTokens?: number;
  
  // ChatGPT-spezifisch
  organizationId?: string; // Optional für OpenAI Organization
  
  // Gemini-spezifisch
  topK?: number;
  topP?: number;
  
  // Claude-spezifisch
  anthropicVersion?: string; // API-Version für Anthropic
}

/**
 * Interface für einen LLM API Key Eintrag
 */
export interface LLMApiKeyEntry {
  id: string;
  name: string;
  provider: LLMProvider;
  config: LLMRequestConfig;
}

/**
 * Store für die Verwaltung von API Keys für verschiedene LLMs
 */
export const useApiKeysStore = defineStore('apiKeys', () => {
  const STORAGE_KEY = 'activate_llm_api_keys';

  // Sammlung von API Key Einträgen
  const entries = ref<LLMApiKeyEntry[]>([]);

  // Hole Standard-Konfiguration für einen Provider
  const getDefaultConfig = (provider: LLMProvider): Partial<LLMRequestConfig> => {
    switch (provider) {
      case 'chatgpt':
        return {
          temperature: 0.7,
          maxTokens: 2000,
        };
      case 'gemini':
        return {
          temperature: 0.2,
          maxTokens: 2048,
          topK: 40,
          topP: 0.95,
        };
      case 'claude':
        return {
          temperature: 0.7,
          maxTokens: 4096,
          anthropicVersion: '2023-06-01',
        };
      default:
        return {};
    }
  };

  // Migriere alte Einträge zum neuen Format
  const migrateOldEntries = (oldEntries: any[]): LLMApiKeyEntry[] => {
    return oldEntries.map((oldEntry: any) => {
      // Prüfe ob bereits im neuen Format
      if (oldEntry.provider && oldEntry.config) {
        return oldEntry as LLMApiKeyEntry;
      }
      
      // Migriere vom alten Format
      // Versuche Provider basierend auf Name/Model zu erraten
      const nameLower = (oldEntry.name || '').toLowerCase();
      const modelLower = (oldEntry.modelName || '').toLowerCase();
      let provider: LLMProvider = 'chatgpt';
      
      if (nameLower.includes('gemini') || modelLower.includes('gemini')) {
        provider = 'gemini';
      } else if (nameLower.includes('claude') || modelLower.includes('claude')) {
        provider = 'claude';
      }
      
      const defaults = getDefaultConfig(provider);
      
      return {
        id: oldEntry.id || generateId(),
        name: oldEntry.name || 'Unnamed',
        provider,
        config: {
          apiKey: oldEntry.apiKey || '',
          modelName: oldEntry.modelName || '',
          temperature: defaults.temperature,
          maxTokens: defaults.maxTokens,
          ...(provider === 'gemini' && {
            topK: defaults.topK,
            topP: defaults.topP,
          }),
          ...(provider === 'claude' && {
            anthropicVersion: defaults.anthropicVersion,
          }),
        },
      };
    });
  };

  // Lade API Keys aus localStorage
  const loadApiKeys = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Prüfe ob Migration nötig ist
        if (Array.isArray(parsed) && parsed.length > 0 && !parsed[0].provider) {
          entries.value = migrateOldEntries(parsed);
          saveApiKeys(); // Speichere migrierte Daten
        } else {
          entries.value = parsed;
        }
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
  const addEntry = (name: string, provider: LLMProvider, config: LLMRequestConfig): LLMApiKeyEntry => {
    const newEntry: LLMApiKeyEntry = {
      id: generateId(),
      name: name.trim(),
      provider,
      config: {
        ...config,
        apiKey: config.apiKey.trim(),
        modelName: config.modelName.trim(),
      },
    };
    entries.value.push(newEntry);
    saveApiKeys();
    return newEntry;
  };

  // Aktualisiere einen bestehenden Eintrag
  const updateEntry = (id: string, name: string, provider: LLMProvider, config: LLMRequestConfig): boolean => {
    const index = entries.value.findIndex(entry => entry.id === id);
    if (index !== -1) {
      entries.value[index] = {
        id,
        name: name.trim(),
        provider,
        config: {
          ...config,
          apiKey: config.apiKey.trim(),
          modelName: config.modelName.trim(),
        },
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

  // Hole Standard-Endpunkt für einen Provider
  const getDefaultEndpoint = (provider: LLMProvider, modelName: string): string => {
    switch (provider) {
      case 'chatgpt':
        return 'https://api.openai.com/v1/chat/completions';
      case 'gemini':
        return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
      case 'claude':
        return 'https://api.anthropic.com/v1/messages';
      default:
        return '';
    }
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
    getDefaultEndpoint,
    getDefaultConfig,
  };
});
