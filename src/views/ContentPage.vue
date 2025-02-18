<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { contentData } from '@/data/contentData';
import ContentTemplate from '@/components/ContentTemplate.vue';

const route = useRoute();
const pageData = contentData.find((item) => item.id === route.params.id);
</script>

<template>
    <h1 class="text-2xl font-semibold mb-4">{{ pageData?.title }}</h1>
    <ContentTemplate :pageData="pageData" />
</template>
