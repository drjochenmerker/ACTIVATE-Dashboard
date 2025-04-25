<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps({
    roles: {
        type: Array,
        required: true,
    },
},);
</script>
<template>
    <div>
        {{ props.roles }}
    </div>
</template>

<script scoped>
</script>