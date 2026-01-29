<script setup lang="ts">
import { CustomSkeleton } from '@/components/ui/skeleton';
</script>

<!-- Placeholder-Component to mock new pages, useful for development -->

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <CustomSkeleton class="h-8 w-full" />
            <CustomSkeleton class="h-6 w-1/2" />
        </div>
        <div class="space-y-4">
            <CustomSkeleton class="h-32 w-full rounded-md" />
            <CustomSkeleton class="h-64 w-full rounded-md" />
            <CustomSkeleton class="h-64 w-full rounded-md" />
        </div>
    </div>
</template>

<style scoped></style>
