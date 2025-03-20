<script setup lang="ts">
import { contentData } from '@/data/contentData';
import ThemeSwitchButton from './ThemeSwitchButton.vue';
import { User } from 'lucide-vue-next';
import { useActivityStore } from '@/stores/activityStore';

const role = useActivityStore().getRole();
</script>

<template>
    <header class="flex h-16 items-center border-b bg-background px-6">
        <nav class="flex justify-between w-full">
            <a>
                <router-link class="flex items-center gap-2 font-semibold" to="/">
                    <img src="@/assets/images/activate-logo-small.png" class="w-10 h-10 rounded-xl" alt="Logo" />
                    <span>Dashboard</span>
                </router-link>
            </a>

            <div class="flex items-center gap-6 whitespace-nowrap">
                <router-link v-for="item in contentData" :key="item.id" :to="`/${item.id}`" :class="$route.path === `/${item.id}` ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'
                    ">
                    {{ item.title }}
                </router-link>
            </div>

            <div class="flex items-center gap-6">
                <div class="flex flex-row gap-1">
                <User />
                <span>{{role}}</span>
                </div>
                <ThemeSwitchButton />
            </div>
        </nav>

        <!-- TODO: Add mobile menu and make responsive -->
    </header>
</template>

<style scoped></style>
