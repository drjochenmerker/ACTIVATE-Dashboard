<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton';
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <Skeleton class="h-8 w-full" />
            <Skeleton class="h-6 w-1/2" />
        </div>
        <div class="space-y-4">
            <Skeleton class="h-32 w-full rounded-md" />
            <Skeleton class="h-64 w-full rounded-md" />
            <Skeleton class="h-64 w-full rounded-md" />
        </div>
    </div>
</template>

<style scoped></style>
