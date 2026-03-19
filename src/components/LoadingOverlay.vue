<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next';
import { onBeforeUnmount, watch } from 'vue';

const props = defineProps<{
    visible: boolean
    message?: string
}>()

const appRoot = document.getElementById('app');
const blockedEventTypes = ['keydown', 'pointerdown', 'click', 'touchstart', 'touchmove', 'wheel'] as const;

const blockInteraction = (event: Event) => {
    if (!props.visible) return;
    event.preventDefault();
    event.stopPropagation();
};

const setInteractionLock = (enabled: boolean) => {
    for (const eventType of blockedEventTypes) {
        if (enabled) {
            window.addEventListener(eventType, blockInteraction, true);
            continue;
        }

        window.removeEventListener(eventType, blockInteraction, true);
    }
};

watch(
    () => props.visible,
    (isVisible: boolean) => {
        if (isVisible) {
            appRoot?.setAttribute('inert', '');
            appRoot?.setAttribute('aria-busy', 'true');
            document.body.style.overflow = 'hidden';

            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }

            setInteractionLock(true);
            return;
        }

        appRoot?.removeAttribute('inert');
        appRoot?.removeAttribute('aria-busy');
        document.body.style.overflow = '';
        setInteractionLock(false);
    },
    { immediate: true }
);

onBeforeUnmount(() => {
    appRoot?.removeAttribute('inert');
    appRoot?.removeAttribute('aria-busy');
    document.body.style.overflow = '';
    setInteractionLock(false);
});
</script>

<template>
    <Teleport to="body">
        <div
            v-if="visible"
            class="fixed inset-0 z-[2147483647] bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center pointer-events-auto"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <Loader2 class="animate-spin h-10 w-10 text-white" />
            <span class="mt-3 text-white text-lg">{{ message }}</span>
        </div>
    </Teleport>
</template>
