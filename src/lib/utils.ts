import type { Updater } from '@tanstack/vue-table'
import type { Ref } from 'vue'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { LanguageCode } from '@/data/knowledge_graph/structures'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function valueUpdater<T extends Updater<any>>(updaterOrValue: T, ref: Ref) {
  ref.value
    = typeof updaterOrValue === 'function'
      ? updaterOrValue(ref.value)
      : updaterOrValue
}

export function buildLanguageString(input: { id: string, labels: Record<string, string> }, language: LanguageCode, split: boolean = false, includeLanguageTag: boolean = true) {
  let res = "";
  if (input.labels[language]) res = input.labels[language];
  else if (input.labels.en) res = input.labels.en + (includeLanguageTag ? " (en)" : "");
  else {
    const keys = Object.keys(input.labels);
    if (keys.length > 0) res = input.labels[keys[0]] + (includeLanguageTag ? " (" + keys[0] + ")" : "");
    else res = "Error: no labels found ";
  }
  if (split) return res.split("/").pop();
  return res;
}

