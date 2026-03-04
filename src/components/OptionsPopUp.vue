<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useLLMSettingsStore, type LLMProvider, type LLMRequestConfig } from '@/stores/llmSettingsStore';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Save, Edit, X } from 'lucide-vue-next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const llmSettingsStore = useLLMSettingsStore();
const sessionStore = useSessionStore();

const open = defineModel<boolean>('open', { default: false });
const selectedProvider = ref<LLMProvider>('gemini');

const isEditing = ref(false);

const formModelName = ref('');
const formTemperature = ref<number>(0.7);
const formOrganizationId = ref(''); // ChatGPT specific

const knowledgeGraphPrompt = ref('');
const entityExtractionPrompt = ref('');
const turtleFileMergePrompt = ref('');
// const syntaxFixPrompt = ref(''); // TODO: Discuss if adjusting this prompt is necessary
const entityAssignmentPrompt = ref('');
const tensionExtractionPrompt = ref('');
const isEditingPrompt = ref(false);

onMounted(() => {
  llmSettingsStore.loadSettings();
  selectedProvider.value = llmSettingsStore.settings.selectedProvider;
  const prompts = llmSettingsStore.getPrompts();
  knowledgeGraphPrompt.value = prompts.knowledgeGraphGeneration;
  entityExtractionPrompt.value = prompts.entityExtraction;
  turtleFileMergePrompt.value = prompts.turtleFileMerge;
  // syntaxFixPrompt.value = prompts.syntaxFixing;
  tensionExtractionPrompt.value = prompts.tensionExtraction;
  entityAssignmentPrompt.value = prompts.entityAssignment;
  loadModelConfig(selectedProvider.value);
});

const loadModelConfig = (provider: LLMProvider, resetEditing: boolean = true) => {
  const modelConfig = llmSettingsStore.getModelConfig(provider);
  if (modelConfig) {
    formModelName.value = modelConfig.config.modelName;
    formTemperature.value = modelConfig.config.temperature ?? 0.7;
    formOrganizationId.value = modelConfig.config.organizationId || '';
  } else {
    resetFormForProvider(provider);
  }
  if (resetEditing) {
    isEditing.value = false;
  }
};

const resetFormForProvider = (provider: LLMProvider) => {
  const defaults = llmSettingsStore.getDefaultConfig(provider);
  formModelName.value = defaults.modelName ?? '';
  formTemperature.value = defaults.temperature ?? 0.7;
  formOrganizationId.value = '';
};

watch(selectedProvider, (newProvider) => {
  llmSettingsStore.setSelectedProvider(newProvider);
  loadModelConfig(newProvider);
  isEditing.value = false;
});

const startEditing = () => {
  loadModelConfig(selectedProvider.value, false);
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
  loadModelConfig(selectedProvider.value);
};

const saveModelConfig = () => {
  if (!formModelName.value.trim()) {
    return;
  }

  const config: LLMRequestConfig = {
    modelName: formModelName.value,
    selectedProvider: selectedProvider.value,
    temperature: formTemperature.value,
  };

  if (selectedProvider.value === 'chatgpt' && formOrganizationId.value.trim()) {
    config.organizationId = formOrganizationId.value.trim();
  }

  llmSettingsStore.setModelConfig(selectedProvider.value, config);
  isEditing.value = false;
};

const startEditingPrompt = () => {
  isEditingPrompt.value = true;
  const prompts = llmSettingsStore.getPrompts();
  knowledgeGraphPrompt.value = prompts.knowledgeGraphGeneration;
  entityExtractionPrompt.value = prompts.entityExtraction;
  turtleFileMergePrompt.value = prompts.turtleFileMerge;
  // syntaxFixPrompt.value = prompts.syntaxFixing;
  entityAssignmentPrompt.value = prompts.entityAssignment;
  tensionExtractionPrompt.value = prompts.tensionExtraction;
};

const cancelEditingPrompt = () => {
  isEditingPrompt.value = false;
  const prompts = llmSettingsStore.getPrompts();
  knowledgeGraphPrompt.value = prompts.knowledgeGraphGeneration;
  entityExtractionPrompt.value = prompts.entityExtraction;
  turtleFileMergePrompt.value = prompts.turtleFileMerge;
  // syntaxFixPrompt.value = prompts.syntaxFixing;
  entityAssignmentPrompt.value = prompts.entityAssignment;
  tensionExtractionPrompt.value = prompts.tensionExtraction
};

const savePrompt = () => {
  llmSettingsStore.setPrompts({
    knowledgeGraphGeneration: knowledgeGraphPrompt.value,
    entityExtraction: entityExtractionPrompt.value,
    turtleFileMerge: turtleFileMergePrompt.value,
    // syntaxFixing: syntaxFixPrompt.value,
    entityAssignment: entityAssignmentPrompt.value,
    tensionExtraction: tensionExtractionPrompt.value
  });
  isEditingPrompt.value = false;
};

const getProviderDisplayName = (provider: LLMProvider): string => {
  const names = {
    chatgpt: 'ChatGPT (OpenAI)',
    gemini: 'Gemini (Google)',
    claude: 'Claude (Anthropic)',
    cortecs: 'Cortecs',
  };
  return names[provider];
};

const getCurrentModelConfig = () => {
  return llmSettingsStore.getModelConfig(selectedProvider.value);
};
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-2xl max-h-[90vh] flex flex-col p-0">
      <DialogHeader class="px-6 pt-6 pb-4 shrink-0">
        <DialogTitle class="text-xl font-semibold text-center">
          {{ staticContent.optionsPage.title[sessionStore.activeLanguage] }}
        </DialogTitle>
        <p class="text-center text-muted-foreground text-sm mt-1">
          {{ staticContent.optionsPage.description[sessionStore.activeLanguage] }}
        </p>
        <hr
          class="mt-3 h-0.5 border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-900 to-transparent opacity-70 dark:via-neutral-400" />
      </DialogHeader>

      <!-- Scrollable body -->
      <div class="flex-1 overflow-y-auto px-6 pb-6">
        <div class="space-y-6">
          <!-- Model Selection -->
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
                  <!-- <SelectItem value="claude">Claude (Anthropic)</SelectItem> -->
                  <SelectItem value="cortecs">Cortecs</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <!-- Model config -->
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
              <!-- Visual Mode -->
              <div v-if="!isEditing">
                <div v-if="getCurrentModelConfig()" class="space-y-4">
                  <div class="space-y-3">
                    <div class="space-y-1">
                      <Label class="text-xs text-muted-foreground">{{ staticContent.optionsPage.modelName[sessionStore.activeLanguage] }}</Label>
                      <div class="text-sm font-medium">{{ getCurrentModelConfig()?.config.modelName }}</div>
                    </div>
                    <div class="grid grid-cols-2 gap-4" v-if="selectedProvider !== 'chatgpt'">
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

              <!-- Edit Mode -->
              <div v-else class="space-y-4">
                <!-- Modellname -->
                <div class="space-y-2">
                  <Label :for="'form-model'">{{ staticContent.optionsPage.modelName[sessionStore.activeLanguage] }}</Label>
                  <Input
                    id="form-model"
                    v-model="formModelName"
                    :placeholder="staticContent.optionsPage.modelNamePlaceholder[sessionStore.activeLanguage]"
                  />
                  <TooltipProvider v-if="selectedProvider === 'cortecs'">
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <p class="text-xs text-muted-foreground">
                          <a
                            href="https://cortecs.ai/serverlessModels?euOnly=true"
                            target="_blank"
                            rel="noreferrer"
                            class="underline underline-offset-2"
                          >
                            {{ staticContent.optionsPage.cortecsModelLinkText[sessionStore.activeLanguage] }}
                          </a>
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {{ staticContent.optionsPage.cortecsModelTooltip[sessionStore.activeLanguage] }}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <!-- LLM Parameters -->
                <div v-if="selectedProvider !== 'chatgpt'" class="">
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

                <!-- ChatGPT specific -->
                <div v-if="selectedProvider === 'chatgpt'" class="space-y-2">
                  <Label :for="'form-org-id'">{{ staticContent.optionsPage.organizationId[sessionStore.activeLanguage] }}</Label>
                  <Input
                    id="form-org-id"
                    v-model="formOrganizationId"
                    :placeholder="staticContent.optionsPage.organizationId[sessionStore.activeLanguage]"
                  />
                </div>

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

          <!-- Prompt Configuration -->
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
              <!-- Visual Mode -->
              <div v-if="!isEditingPrompt">
                <div class="space-y-4">
                  <div class="space-y-2">
                    <Label class="text-xs text-muted-foreground">
                      {{ staticContent.optionsPage.prompts.knowledgeGraphGeneration[sessionStore.activeLanguage] }}
                    </Label>
                    <div class="rounded-md border bg-muted p-4 min-h-[60px]">
                      <pre class="whitespace-pre-wrap text-sm font-mono">
{{ llmSettingsStore.getPrompts().knowledgeGraphGeneration || staticContent.optionsPage.noConfiguration[sessionStore.activeLanguage] }}
                      </pre>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <Label class="text-xs text-muted-foreground">
                      {{ staticContent.optionsPage.prompts.entityExtraction[sessionStore.activeLanguage] }}
                    </Label>
                    <div class="rounded-md border bg-muted p-4 min-h-[60px]">
                      <pre class="whitespace-pre-wrap text-sm font-mono">
{{ llmSettingsStore.getPrompts().entityExtraction || staticContent.optionsPage.noConfiguration[sessionStore.activeLanguage] }}
                      </pre>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <Label class="text-xs text-muted-foreground">
                      {{ staticContent.optionsPage.prompts.tensionExtraction[sessionStore.activeLanguage] }}
                    </Label>
                    <div class="rounded-md border bg-muted p-4 min-h-[60px]">
                      <pre class="whitespace-pre-wrap text-sm font-mono">
{{ llmSettingsStore.getPrompts().tensionExtraction || staticContent.optionsPage.noConfiguration[sessionStore.activeLanguage] }}
                      </pre>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <Label class="text-xs text-muted-foreground">
                      {{ staticContent.optionsPage.prompts.entityAssignment[sessionStore.activeLanguage] }}
                    </Label>
                    <div class="rounded-md border bg-muted p-4 min-h-[60px]">
                      <pre class="whitespace-pre-wrap text-sm font-mono">
{{ llmSettingsStore.getPrompts().entityAssignment || staticContent.optionsPage.noConfiguration[sessionStore.activeLanguage] }}
                      </pre>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <Label class="text-xs text-muted-foreground">
                      {{ staticContent.optionsPage.prompts.turtleFileMerge[sessionStore.activeLanguage] }}
                    </Label>
                    <div class="rounded-md border bg-muted p-4 min-h-[60px]">
                      <pre class="whitespace-pre-wrap text-sm font-mono">
{{ llmSettingsStore.getPrompts().turtleFileMerge || staticContent.optionsPage.noConfiguration[sessionStore.activeLanguage] }}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Edit-Mode -->
              <div v-else class="space-y-4">
                <div class="space-y-2">
                  <Label :for="'form-prompt-kg'">
                    {{ staticContent.optionsPage.prompts.knowledgeGraphGeneration[sessionStore.activeLanguage] }}
                  </Label>
                  <Textarea
                    id="form-prompt-kg"
                    v-model="knowledgeGraphPrompt"
                    :placeholder="staticContent.optionsPage.promptPlaceholder[sessionStore.activeLanguage]"
                    class="min-h-[120px] font-mono text-sm"
                  />
                </div>
                <div class="space-y-2">
                  <Label :for="'form-prompt-entity'">
                    {{ staticContent.optionsPage.prompts.entityExtraction[sessionStore.activeLanguage] }}
                  </Label>
                  <Textarea
                    id="form-prompt-entity"
                    v-model="entityExtractionPrompt"
                    :placeholder="staticContent.optionsPage.promptPlaceholder[sessionStore.activeLanguage]"
                    class="min-h-[120px] font-mono text-sm"
                  />
                </div>
                <div class="space-y-2">
                  <Label :for="'form-prompt-tension'">
                    {{ staticContent.optionsPage.prompts.tensionExtraction[sessionStore.activeLanguage] }}
                  </Label>
                  <Textarea
                    id="form-prompt-tension"
                    v-model="tensionExtractionPrompt"
                    :placeholder="staticContent.optionsPage.promptPlaceholder[sessionStore.activeLanguage]"
                    class="min-h-[120px] font-mono text-sm"
                  />
                </div>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <Label :for="'form-prompt-assignment'">
                      {{ staticContent.optionsPage.prompts.entityAssignment[sessionStore.activeLanguage] }}
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <span class="inline-flex h-4 w-4 items-center justify-center rounded-full border text-xs font-medium cursor-help">i</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{{ staticContent.optionsPage.prompts.entityAssignmentHint[sessionStore.activeLanguage] }}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="form-prompt-assignment"
                    v-model="entityAssignmentPrompt"
                    :placeholder="staticContent.optionsPage.promptPlaceholder[sessionStore.activeLanguage]"
                    class="min-h-[120px] font-mono text-sm"
                  />
                </div>
                <div class="space-y-2">
                  <Label :for="'form-prompt-merge'">
                    {{ staticContent.optionsPage.prompts.turtleFileMerge[sessionStore.activeLanguage] }}
                  </Label>
                  <Textarea
                    id="form-prompt-merge"
                    v-model="turtleFileMergePrompt"
                    :placeholder="staticContent.optionsPage.promptPlaceholder[sessionStore.activeLanguage]"
                    class="min-h-[120px] font-mono text-sm"
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
    </DialogContent>
  </Dialog>
</template>

<style scoped>
</style>