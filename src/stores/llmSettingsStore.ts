import { entityAssignmentPrompt, entityExtractionPrompt, knowledgeGraphGenerationPrompt, tensionExtractionPrompt, ttlMergePrompt, ttlSyntaxFixPrompt } from '@/data/knowledge_graph/prompts';
import requiredEntitiesData from '@/data/knowledge_graph/requiredEntities.json';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useSessionStore } from './sessionStore';

/**
 * Supported LLM providers
 */
export type LLMProvider = 'chatgpt' | 'gemini' | 'claude' | 'cortecs';

/**
 * Request format configuration for different LLM providers
 */
export interface LLMRequestConfig {
  // Common fields
  modelName: string;
  selectedProvider: LLMProvider;
  
  // Provider-specific configuration
  temperature?: number;
  maxTokens?: number;
  
  // ChatGPT-specific
  organizationId?: string; // Optional for OpenAI Organization
  
  // Gemini-specific
  topK?: number;
  topP?: number;
  
  // Claude-specific
  anthropicVersion?: string; // API version for Anthropic
}

/**
 * Interface for the configuration of a single model
 */
export interface LLMModelConfig {
  provider: LLMProvider;
  config: LLMRequestConfig;
}

/**
 * Interface for LLM settings
 */
export interface LLMSettings {
  selectedProvider: LLMProvider;
  models: {
    chatgpt: LLMModelConfig | null;
    gemini: LLMModelConfig | null;
    claude: LLMModelConfig | null;
    cortecs: LLMModelConfig | null;
  };
  /**
   * Shared prompts for different LLM tasks
   */
  prompts: {
    knowledgeGraphGeneration: string;
    entityExtraction: string;
    turtleFileMerge: string;
    syntaxFixing: string;
    tensionExtraction: string;
    entityAssignment: string;
    predefinedEntities: string;
  };
}

/**
 * Store for managing LLM settings (prompts, model config, temperature, etc.)
 */
export const useLLMSettingsStore = defineStore('llmSettings', () => {
  const SETTINGS_STORAGE_KEY = 'activate_llm_settings';
  const sessionStore = useSessionStore();

  // Settings for the three supported models
  const settings = ref<LLMSettings>({
    selectedProvider: sessionStore.instructorMode ? 'gemini' : 'chatgpt',
    models: {
      chatgpt: null,
      gemini: null,
      claude: null,
      cortecs: null,
    },
    prompts: {
      knowledgeGraphGeneration: knowledgeGraphGenerationPrompt,
      entityExtraction: entityExtractionPrompt,
      turtleFileMerge: ttlMergePrompt,
      syntaxFixing: ttlSyntaxFixPrompt,
      tensionExtraction: tensionExtractionPrompt,
      entityAssignment: entityAssignmentPrompt,
      predefinedEntities: JSON.stringify(requiredEntitiesData, null, 2),
    },
  });

  // Get default configuration for a provider
  const getDefaultConfig = (provider: LLMProvider): Partial<LLMRequestConfig> => {
    switch (provider) {
      case 'chatgpt':
        return {
          modelName: 'gpt-5-mini-2025-08-07',
          temperature: 0.7,
          maxTokens: 2000,
        };
      case 'gemini':
        return {
          modelName: 'gemini-2.5-flash',
          temperature: 0.2,
          maxTokens: 2048,
          topK: 40,
          topP: 0.95,
        };
      case 'claude':
        return {
          modelName: 'claude-opus-4-6',
          temperature: 0.7,
          maxTokens: 4096,
          anthropicVersion: '2023-06-01',
        };
      case 'cortecs':
        return {
          modelName: 'mistral-large-2512',
          temperature: 0.7,
          maxTokens: 4096,
        };
      default:
        return {};
    }
  };

  // Load settings from localStorage
  const loadSettings = () => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        parsed.prompts = {
          knowledgeGraphGeneration: parsed.prompts?.knowledgeGraphGeneration ?? settings.value.prompts.knowledgeGraphGeneration,
          entityExtraction: parsed.prompts?.entityExtraction ?? settings.value.prompts.entityExtraction,
          turtleFileMerge: parsed.prompts?.turtleFileMerge ?? settings.value.prompts.turtleFileMerge,
          syntaxFixing: parsed.prompts?.syntaxFixing ?? settings.value.prompts.syntaxFixing,
          tensionExtraction: parsed.prompts?.tensionExtraction ?? settings.value.prompts.tensionExtraction,
          entityAssignment: parsed.prompts?.entityAssignment ?? settings.value.prompts.entityAssignment,
          predefinedEntities: parsed.prompts?.predefinedEntities ?? settings.value.prompts.predefinedEntities,
        };

        settings.value = { ...settings.value, ...parsed };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Save settings to localStorage
  const saveSettings = () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings.value));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Set configuration for a model
  const setModelConfig = (provider: LLMProvider, config: LLMRequestConfig) => {
    settings.value.models[provider] = {
      provider,
      config: {
        ...config,
        modelName: config.modelName.trim(),
      },
    };
    saveSettings();
  };

  // Get configuration for a model
  const getModelConfig = (provider: LLMProvider): LLMModelConfig | null => {
    return settings.value.models[provider];
  };

  // Set selected model
  const setSelectedProvider = (provider: LLMProvider) => {
    settings.value.selectedProvider = provider;
    saveSettings();
  };

  // Set prompt
  const setPrompt = (prompt: string) => {
    settings.value.prompts.knowledgeGraphGeneration = prompt;
    saveSettings();
  };

  // Get prompt
  const getPrompt = (): string => {
    return settings.value.prompts.knowledgeGraphGeneration ||  '';
  };

  // Set multiple prompts at once (partial update possible)
  const setPrompts = (prompts: Partial<LLMSettings['prompts']>) => {
    settings.value.prompts = {
      ...settings.value.prompts,
      ...prompts,
    };
    saveSettings();
  };

  // Get all prompts
  const getPrompts = (): LLMSettings['prompts'] => {
    return settings.value.prompts;
  };

  // Get LLMRequestConfig for the currently selected model
  const getCurrentModelRequestConfig = (): LLMRequestConfig => {
    const selectedProvider = settings.value.selectedProvider;
    const modelConfig = settings.value.models[selectedProvider];
    if (!modelConfig) {
      throw new Error("No model config found!");
    }
    return modelConfig.config;
  };

  const initializeDefaultConfigs = () => {
    const providers: LLMProvider[] = ['chatgpt', 'gemini', 'claude', 'cortecs'];
    let changed = false;
  
    for (const provider of providers) {
      if (!settings.value.models[provider]) {
        const defaults = getDefaultConfig(provider);
        if (defaults.modelName) {
          settings.value.models[provider] = {
            provider,
            config: {
              modelName: defaults.modelName,
              selectedProvider: provider,
              temperature: defaults.temperature,
              maxTokens: defaults.maxTokens,
              ...defaults,
            },
          };
          changed = true;
        }
      }
    }
  
    if (changed) saveSettings();
  };

  // Initialize when loading the store
  loadSettings();
  initializeDefaultConfigs();

  return {
    settings,
    getDefaultConfig,
    loadSettings,
    saveSettings,
    setModelConfig,
    getModelConfig,
    setSelectedProvider,
    setPrompt,
    getPrompt,
    setPrompts,
    getPrompts,
    getCurrentModelRequestConfig,
  };
});
