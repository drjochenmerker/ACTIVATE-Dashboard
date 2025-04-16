<script setup lang="ts">
import { contentData } from '@/data/contentData';
import ThemeSwitchButton from './ThemeSwitchButton.vue';
import { User, Users } from 'lucide-vue-next';
import { useSessionStore } from '@/stores/sessionStore';
import {
    Select,
    SelectContent,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import LogoutButton from './LogoutButton.vue';
import RecursiveSelect from './RecursiveSelect.vue';

const sessionStore = useSessionStore();
</script>

<template>
    <header class="flex h-16 border-b bg-background px-6">
        <nav class="flex justify-between items-center w-full">
            <a class="flex-1">
                <router-link class="flex items-center gap-2 font-semibold" to="/">
                    <img src="@/assets/images/activate-logo-small.png" class="w-10 h-10 rounded-xl" alt="Logo" />
                    <span>Dashboard</span>
                </router-link>
            </a>

            <!-- Links to the different pages of the activity classes providing the conflict views -->
            <div class="flex items-center gap-6 whitespace-nowrap">
                <router-link v-for="item in contentData" :key="item.id" :to="`/${item.id}`" :class="$route.path === `/${item.id}` ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'
                    ">
                    {{ item.title }}
                </router-link>
            </div>

            <div class="flex items-center gap-6 flex-1 justify-end">
                <div class="flex flex-row gap-2 items-center my-2">
                    <!-- Either present a select for the all the roles (instructor mode), or just the role chosen at login -->
                    <template v-if="sessionStore.instructorMode">
                        <Users />
                        <Select v-model="sessionStore.sessionRole" id="roleSelect">
                            <SelectTrigger>
                                <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent>
                                <RecursiveSelect :node="sessionStore.availableRoles" />
                            </SelectContent>
                        </Select>
                    </template>
                    <template v-else>
                        <User />
                        <span>{{ sessionStore.sessionRole }}</span>
                    </template>
                </div>
                <div class="flex flex-row gap-1">
                <LogoutButton />
                <ThemeSwitchButton />
            </div>
            </div>
        </nav>
    </header>
</template>

<style scoped></style>
