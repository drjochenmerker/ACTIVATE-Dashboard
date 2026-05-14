<!-- NavBar Component -->
<script setup lang="ts">
import { activateTerms, contentData } from '@/data/contentData';
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
import SceneChangeButton from './SceneChangeButton.vue';
import LanguageSelect from './LanguageSelect.vue';
import OptionsButton from './OptionsButton.vue';
import InstructorViewSelect from './InstructorViewSelect.vue';
import HomeButton from './HomeButton.vue';

const sessionStore = useSessionStore();
</script>

<template>
    <header class="border-b bg-background px-6 py-3">
        <nav class="flex w-full flex-wrap items-center gap-x-4 gap-y-3">
            <!-- Homepage link -->
            <router-link to="/" class="flex shrink-0 items-center gap-2 font-semibold">
                <img src="@/assets/images/activate-logo-small.png" class="w-10 h-10 rounded-xl" alt="Logo" />
                <span class="whitespace-nowrap">Debriefing-Dashboard</span>
            </router-link>

            <!-- Navigation links -->
            <div class="flex min-w-[14rem] flex-1 flex-wrap items-center gap-x-6 gap-y-2">
                <router-link
                    v-for="item in contentData"
                    :key="item.id"
                    :to="`/${item.id}`"
                    :class="$route.path === `/${item.id}` ? 'font-semibold' : 'text-muted-foreground hover:text-foreground font-semibold'">
                    {{ activateTerms[sessionStore.activeLanguage][item.id] }}
                </router-link>
            </div>

            <!-- Right-side user controls -->
            <div class="ml-auto flex flex-wrap items-center justify-end gap-2">
                <div class="my-2 flex flex-row items-center gap-2 w-32">
                    <template v-if="sessionStore.instructorMode">
                        <Users class="w-1/3" />
                        <Select id="roleSelect" v-model="sessionStore.sessionRole">
                            <SelectTrigger class="w-[180px] overflow-hidden whitespace-nowrap truncate">
                                <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent>
                                <RecursiveSelect :node="sessionStore.availableRoles" />
                            </SelectContent>
                        </Select>
                    </template>
                    <template v-else>
                        <User />
                        <Select id="roleSelect" v-model="sessionStore.sessionRole">
                            <SelectTrigger class="w-[180px] overflow-hidden whitespace-nowrap truncate">
                                <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent>
                                <RecursiveSelect :node="sessionStore.availableRoles" />
                            </SelectContent>
                        </Select>
                    </template>
                </div>
                <SceneChangeButton />
                <InstructorViewSelect v-if="sessionStore.instructorMode" />
                <LanguageSelect />
                <template  v-if="sessionStore.instructorMode">
                    <OptionsButton />
                </template>
                <HomeButton />
                <LogoutButton />
                <ThemeSwitchButton />
            </div>
        </nav>
    </header>
</template>
