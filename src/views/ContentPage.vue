<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { contentData } from '@/data/contentData';
import ContentTemplate from '@/components/ContentTemplate.vue';
import { onMounted } from 'vue';

// Define props
const props = defineProps<{ conflicts: any[] }>();

const route = useRoute();
const pageData = contentData.find((item) => item.id === route.params.id);

onMounted(() => {
    //console.log('PAGEDATA: ', pageData);
},);
</script>

<template>
    <h1 class="text-2xl font-semibold mb-4">{{ pageData?.title }}</h1>
    <ContentTemplate v-if="pageData" :pageData="pageData" :conflicts="props.conflicts" />
</template>
