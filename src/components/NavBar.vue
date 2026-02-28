<!-- NavBar Component -->
<script setup lang="ts">
import { activateTerms, contentData } from '@/data/contentData';
import ThemeSwitchButton from './ThemeSwitchButton.vue';
import { User, Users } from 'lucide-vue-next';
import { useSessionStore } from '@/stores/sessionStore';
import { CustomSelect, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    <header class="flex h-16 border-b bg-background px-6">
        <nav class="flex justify-between items-center w-full">
            <!-- Homepage link -->
            <router-link to="/" class="flex items-center gap-2 font-semibold">
                <img src="@/assets/images/activate-logo-small.png" class="w-10 h-10 rounded-xl" alt="Logo" />
                <span>Debriefing-Dashboard</span>
            </router-link>

            <!-- Navigation links -->
            <div class="flex items-center gap-6 whitespace-nowrap">
                <router-link
                    v-for="item in contentData"
                    :key="item.id"
                    :to="`/${item.id}`"
                    :class="
                        $route.path === `/${item.id}` ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'
                    "
                >
                    {{ activateTerms[sessionStore.activeLanguage][item.id] }}
                </router-link>
            </div>

            <!-- Right-side user controls -->
            <div class="flex items-center gap-2 justify-end">
                <div class="flex flex-row gap-2 items-center my-2 w-32">
                    <template v-if="sessionStore.instructorMode">
                        <Users class="w-1/3" />
                        <CustomSelect id="roleSelect" v-model="sessionStore.sessionRole">
                            <SelectTrigger class="w-[180px] overflow-hidden whitespace-nowrap truncate">
                                <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent>
                                <RecursiveSelect :node="sessionStore.availableRoles" />
                            </SelectContent>
                        </CustomSelect>
                    </template>
                    <template v-else>
                        <User />
                        <CustomSelect id="roleSelect" v-model="sessionStore.sessionRole">
                            <SelectTrigger class="w-[180px] overflow-hidden whitespace-nowrap truncate">
                                <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent>
                                <RecursiveSelect :node="sessionStore.availableRoles" />
                            </SelectContent>
                        </CustomSelect>
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
