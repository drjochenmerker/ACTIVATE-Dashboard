<script setup lang="ts">
import OptionsButton from '@/components/OptionsButton.vue';
import Button from '@/components/ui/button/Button.vue';
import { llmSubmit, llmPool, llmSettingGeneration } from '@/data/knowledge_graph/llm_utils';
import { getActivities, getConflictIds } from '@/data/knowledge_graph/read_operations';
import { useLLMSettingsStore } from '@/stores/llmSettingsStore';
import { ref } from 'vue';

defineProps<{}>();

const graphId = ref("bcfe5248-e409-4416-a3d0-2953a3231169");

// --- UI STATES ---
const showArzt = ref(false);
const showPflege = ref(false);
const showPhysio = ref(false);
const isTesting = ref(false);
const readyForCombine = ref(false);
const selectedTestCount = ref(1);

// --- CUSTOM DATA STATE ---
const customRole = ref({ id: "Custom01", label: "Eigene Rolle" });
const customData = ref([{ question: "", answer: "" }]);

// --- LOGGING SYSTEM ---
const logs = ref<{ time: string, msg: string, type: 'info' | 'success' | 'error' }[]>([]);

const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString();
    logs.value.unshift({ time, msg, type }); // Neuester Eintrag oben
    console.log(`[${type.toUpperCase()}] ${msg}`);
};

const clearLogs = () => {
    logs.value = [];
};

// --- STATIC DATA ---
const arztData = {
    "graph": "bcfe5248-e409-4416-a3d0-2953a3231169",
    "role": { "id": "Physician01", "label": "Arzt 01" },
    "data": [
        { "question": "Wie haben Sie das gemeinsame Ziel des Teams verstanden und gab es unterschiedliche Perspektiven der beteiligten Berufsgruppen?", "answer": "Mein primäres Ziel war es, anhand der Laborwerte einen schnellen Überblick über den Stoffwechselzustand des Patienten zu erhalten: Glukose- und Wasserhaushalt, Säure-Basen-Haushalt usw., um eine gefährliche Ketoazidose auszuschließen. Das erfordert eine akute Behandlung und macht die Diskussion über eine Anpassung der Schmerztherapie und eine mögliche Entlassung etwas weniger wichtig." },
        { "question": "Inwieweit konnten Sie Ihre sozialen Kompetenzen einsetzen?", "answer": "Zu Beginn der Patientenbesprechung war es schwierig, die Beiträge aller Teammitglieder zu koordinieren. Ich fand es auch schwierig, den anderen schnell zu vermitteln, was die Laborwerte bedeuteten. Ich habe mir die Informationen der anderen jedoch genau angehört und mir gemeinsam mit ihnen die Zeit genommen, die Bedeutung dieser Informationen einzuschätzen und zu priorisieren." },
        { "question": "Welche Erwartungen, Rahmenbedingungen und Werte haben die Zusammenarbeit im Team geprägt?", "answer": "Die Empfehlung für die Entlassung und die Therapie dieses Patienten muss dem Oberarzt, meinem Ausbilder, vorgelegt werden, daher möchte ich, dass alles korrekt ist und alle seine/ihre Fragen gut beantwortet werden. Ich weiß, wie er/sie reagiert, wenn etwas fehlt oder unklar ist." },
        { "question": "Welche fachlichen, kommunikativen oder organisatorischen Tools haben Ihnen geholfen?", "answer": "Es war praktisch, dass Laborergebnisse, Befunde aus der Anamnese und der körperlichen Untersuchung sowie die Medikamentenliste usw. in ORBIS zu finden waren. Auch die Informationen aus der Pflege und Physiotherapie sind dort abrufbar. Es war gut, dass ich die Voicemail-Nachricht sofort abgehört habe, obwohl ich sie zweimal abspielen musste, um sie richtig zu verstehen. Die Informationen, die die Krankenschwester bei der Übergabe von ihren Kollegen über den Alkoholgeruch erhalten hatte, machten mich ebenfalls aufmerksam. Der Zugang zu digitalen Informationsquellen ermöglichte es mir, nachzuschlagen, auf welche Parameter bei einer Ketoazidose zu achten ist." },
        { "question": "Welche expliziten oder impliziten Regeln haben das Handeln in dieser Situation beeinflusst?", "answer": "Es ist schwierig zu bestimmen, wann der Ansatz in die Palliativpflege übergeht und wie ernst man eine Alkohol-Wechselwirkung mit Medikamenten nehmen sollte, wenn sie sich ansonsten positiv auf die vom Patienten empfundene Lebensqualität auswirkt." },
        { "question": "Wie war die Arbeitsteilung im Team gestaltet?", "answer": "Ich fühle mich in erster Linie für die Empfehlung verantwortlich, die wir dem Chefarzt vorlegen. Außerdem haben wir aufgrund von Personalausfällen sehr viel zu tun in der Abteilung, und ich möchte, dass die Besprechung so effizient wie möglich verläuft. Dazu sind Koordination und Steuerung meinerseits erforderlich." }
    ]
};

const pflegeData = {
    "graph": "bcfe5248-e409-4416-a3d0-2953a3231169",
    "role": { "id": "Nurse01", "label": "Krankenpfleger 01" },
    "data": [
        { "question": "Wie haben Sie das gemeinsame Ziel des Teams verstanden?", "answer": "Zunächst dachte ich, wir würden die Bedingungen für eine verantwortungsvolle Entlassung besprechen: wirksame Schmerzlinderung, Unterstützung der Partnerin im Umgang mit dem Verhalten ihres Mannes, aber die Voicemail, die der Arzt vom Chefarzt erhalten hatte, machte deutlich, dass zunächst die Laboruntersuchungen berücksichtigt werden mussten. Als sich herausstellte, dass diese in Ordnung waren, waren sich alle im Team einig, dass wir die Akzeptanz der Verwendung von Opioiden durch den Patienten, die Wechselwirkung von Alkohol mit den Medikamenten und die Sturzgefahr in der häuslichen Situation besprechen mussten." },
        { "question": "Inwieweit konnten Sie Ihre sozialen Kompetenzen einsetzen?", "answer": "Die Frau des Patienten war zunächst etwas enttäuscht, dass ich das Gespräch führte, da sie lieber mit dem Arzt gesprochen hätte. Ein Arzt hat nun einmal mehr Gewicht und wird ernster genommen. Da ich jedoch ruhig blieb und offen für ihre Sorgen um ihren Mann war, legte sich ihre Enttäuschung schnell und sie war froh über mein offenes Ohr und mein Versprechen, das Thema in der Teambesprechung anzusprechen." },
        { "question": "Welche Erwartungen, Rahmenbedingungen und Werte haben die Zusammenarbeit geprägt?", "answer": "In der Teambesprechung widmete der Arzt den Laborwerten und der Funktion der Leber in Bezug auf die Medikation große Aufmerksamkeit. Auch beim Alkoholkonsum wurde vor allem auf die Wechselwirkung mit den Medikamenten eingegangen. Für eine gute Situation zu Hause halte ich die zwischenmenschlichen Faktoren ebenfalls für sehr wichtig, aber die Sorge der Frau über den Einfluss von Alkohol auf das Verhalten ihres Mannes und die Spannungen, die dies zu Hause verursachen könnte, konnte ich nur schwer einbringen. Ich hatte auch das Gefühl, dass dies nicht als so wichtig angesehen wurde." },
        { "question": "Welche fachlichen, kommunikativen oder organisatorischen Tools haben Ihnen geholfen?", "answer": "Es ist gut, dass Kollegen Dinge, die ihnen bei der Pflege des Patienten auffallen, in ORBIS notieren. So gibt es genügend Hinweise darauf, dass der Patient starke Schmerzen hat (verzerrtes Gesicht beim Anziehen), während der Patient selbst dies bagatellisiert. Auch Notizen in Ihrem eigenen Notizbuch helfen Ihnen dabei, wichtige Punkte der Übergabe (Alkoholgeruch) nicht zu vergessen." },
        { "question": "Welche expliziten oder impliziten Regeln haben das Handeln beeinflusst?", "answer": "Durch unseren ständigen Kontakt mit den Patienten haben wir oft einen besseren Einblick in die tatsächlichen Emotionen und Motivationen der Patienten. Der Arzt sieht oft Momentaufnahmen und das in einem Kontext, in dem Patienten sich stark geben wollen. Bei diesem Patienten denke ich, dass wir leichter zu einer akzeptablen Lösung kommen würden, wenn wir mehr auf seine tatsächlichen Schmerzen und seine Ängste vor Opioiden eingehen würden." },
        { "question": "Wie war die Arbeitsteilung im Team gestaltet?", "answer": "Ich hatte das Gefühl, dass der Arzt bereits einen Plan im Kopf hatte und diesen nutzte, um schnell Prioritäten zu setzen. Außerdem zeigte er wenig Verständnis für die Ängste des Patienten und die Sorgen seiner Frau. Ich hätte mir etwas mehr Mitsprache und Absprache gewünscht." }
    ]
};

const physioData = {
    "graph": graphId.value,
    "role": { "id": "Physiotherapist01", "label": "Physiotherapeut 01" },
    "data": [
        { "question": "Wie haben Sie das gemeinsame Ziel des Teams verstanden?", "answer": "Unser gemeinsames Ziel war es, Empfehlungen zur Sturzprävention im häuslichen Umfeld und zur optimalen Behandlung der Schmerzen des Patienten zu besprechen. Dass Alkoholkonsum möglicherweise ein komplizierender Faktor war, wurde mir erst später mitgeteilt" },
        { "question": "Inwieweit konnten Sie Ihre sozialen Kompetenzen einsetzen?", "answer": "Da der Arzt und das Pflegepersonal ständig zusammenarbeiten, merkt man, dass sie besser aufeinander eingespielt sind. Gemeinsam sind sie besser über den Patienten informiert und halten bestimmte Dinge daher für selbstverständlich, während dies für weniger involvierte Gesundheitsfachkräfte nicht der Fall ist. Man muss immer aktiv nach solchen Informationen fragen, und dann fühle ich mich manchmal etwas unbehaglich." },
        { "question": "Welche Erwartungen, Rahmenbedingungen und Werte haben die Zusammenarbeit geprägt?", "answer": "Wir sind eine zentrale Abteilung für das gesamte Krankenhaus und daher sehr abhängig von den Informationen, die wir bei unseren Besuchen auf den Pflegestationen erhalten. In den peripheren Pflegestationen verfügen wir nur über wenige Einrichtungen, während aufgrund von Zeitmangel und der eingeschränkten Belastbarkeit der Patienten ein Transport zu den speziellen physiotherapeutischen Einrichtungen nicht möglich ist." },
        { "question": "Welche fachlichen, kommunikativen oder organisatorischen Tools haben Ihnen geholfen?", "answer": "Wir verwenden den Timed Up & Go-Test für eine schnelle Einschätzung der funktionellen Mobilität und des Gleichgewichts eines Patienten. Er gibt Aufschluss über die allgemeine Mobilität und Selbstständigkeit, ist jedoch nur ein grober und indirekter Indikator für das Sturzrisiko. Um dieses einzuschätzen, sind intensivere und wiederholte Untersuchungen erforderlich. Dafür ist in diesem Zusammenhang keine Zeit. Wenn sich später noch herausstellt, dass Opioide und Alkohol hinzukommen, wird es ganz schwierig, etwas Sinnvolles zu sagen. Auch die Messung der Schmerzintensität liefert nur eine Momentaufnahme. Der Arzt sollte dem keine allzu große Bedeutung beimessen. Wir können die Daten der Physiotherapie zusammen mit denen der Ergotherapie und Logopädie in ORBIS einsehen, was einen guten Überblick verschafft. Es wäre auch gut, wenn wir in ORBIS auch Zugriff auf die medizinischen Informationen hätten." },
        { "question": "Welche expliziten oder impliziten Regeln haben das Handeln beeinflusst?", "answer": "Der Arzt fordert Untersuchungen wie den Timed Up & Go-Test oder die Messung der Schmerzintensität bei uns an, aber deren Wert ist in dieser Situation begrenzt. Es ist jedoch wichtig, dass die Physiotherapie über die Schmerzbeschwerden des Patienten informiert ist, damit wir diese bei den Mobilisierungsübungen berücksichtigen können und beispielsweise auch nachverfolgen können, welche Bettlagen sich positiv auswirken oder wie er sich am besten drehen oder bücken kann." },
        { "question": "Wie war die Arbeitsteilung im Team gestaltet?", "answer": "Ärzte haben oft keine genaue Vorstellung davon, was wir als Physiotherapeuten leisten können, und verschreiben daher manchmal weniger geeignete Untersuchungen oder Behandlungen. Auch das Pflegepersonal ist sich manchmal nicht bewusst, dass wir bei der Verbesserung der Lagerung und beim Transfer mitdenken können." }
    ]
};

// Zentralisiertes Array für einfacheren Zugriff
const availableDatasets = [arztData, pflegeData, physioData];

const activity = {
    "title": "IPL LLM Test" + new Date().toLocaleString(), // Einzigartiger Titel mit Timestamp
    "description": "Der Patient Herman Braun leidet an metastasierendem Prostatakarzinom mit starken Rückenschmerzen und Gangunsicherheit. Das interprofessionelle Team muss klären, ob ein wahrgenommener Alkoholgeruch auf einen Rückfall oder auf eine diabetische Ketoazidose hinweist und eine gemeinsame Empfehlung zur weiteren Schmerztherapie und Entlassung formulieren. Die Ehefrau sorgt sich wegen seiner Sturzgefahr und seines Temperaments unter Alkoholeinfluss um häusliche Überlastung.",
};
const getActivityData = async () => {
    try {
        // 1. Daten von der API abrufen
        const res = await getActivities();

        // 2. Das spezifische Objekt anhand der graphId finden
        // graphId.value kommt vermutlich aus einem Vue/React Ref oder State
        const selectedActivity = res.find(item => item.graph === graphId.value);
        // const resu = await getActivityDetail(selectedActivity);
        const conflicts = await getConflictIds(graphId.value);
        if (selectedActivity) {
            console.log("Aktivität mit zugehöriger ID: ", selectedActivity);
            // console.log("Detail der Aktivität: ", resu);
            console.log("Konflikte der Aktivität: ", conflicts);
            addLog(`Konflikte der Aktivität: ${JSON.stringify(conflicts, null, 2)}`, 'info');
        } else {
            console.warn("Keine Aktivität mit dieser ID gefunden.");
        }
    } catch (err) {
        console.error("Fehler beim Abrufen der Aktivitäten:", err);
    }

    try {
        const response = await fetch(`${import.meta.env.VITE_KNOWLEDGE_GRAPH_URL}${!import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT ? "" : ":" + import.meta.env.VITE_KNOWLEDGE_GRAPH_PORT}/debug-ttl/${graphId.value}`);
        const data = await response.json();
        addLog(`Inhalt der TTL Datei für Graph ID ${graphId.value} abgerufen. Siehe Console`, 'success');
        console.log("Inhalt der TTL Datei:\n", data.content); // Jetzt siehst du den Code direkt in der Browser-Konsole!
    } catch (err) {
        console.error("Fehler beim Abrufen der Aktivitätsdetails:", err);
    }
}

// --- METHODS ---
const createActivity = async () => {
    addLog(`Starte Erstellung der Activity: ${activity.title}`, 'info');
    try {
        const res = await llmSettingGeneration(activity.description, useLLMSettingsStore().getCurrentModelRequestConfig(), activity.title);
        addLog(`Activity erfolgreich erstellt:  ${JSON.stringify(res, null, 2)}`, 'success');

    } catch (error: any) {
        addLog(`Fehler beim Erstellen der Activity: ${error.message || error}`, 'error');
    }
}

const runTests = async () => {
    if (isTesting.value) return;
    isTesting.value = true;
    addLog(`Starte Testlauf für ${selectedTestCount.value} Datensatz/Datensätze...`, 'info');

    try {
        const config = useLLMSettingsStore().getCurrentModelRequestConfig();
        for (let i = 0; i < selectedTestCount.value; i++) {
            const currentSet = availableDatasets[i];
            addLog(`Sende Feedback für Rolle: ${currentSet.role.label} (${i + 1}/${selectedTestCount.value})...`);

            await llmSubmit(graphId.value, currentSet.role, currentSet.data, config);
            addLog(`Erfolgreich gesendet: ${currentSet.role.label}`, 'success');
        }
        addLog(`Testlauf abgeschlossen!`, 'success');
        readyForCombine.value = true;
    } catch (error: any) {
        addLog(`Testlauf abgebrochen wegen Fehler: ${error.message || error}`, 'error');
    } finally {
        isTesting.value = false;
    }
}

const testCustomData = async () => {
    if (isTesting.value) return;
    if (customData.value.some(d => !d.question || !d.answer)) {
        addLog(`Bitte alle Felder im Custom Dataset ausfüllen!`, 'error');
        return;
    }

    isTesting.value = true;
    addLog(`Sende manuelles Feedback für Rolle: ${customRole.value.label}...`, 'info');
    try {
        const config = useLLMSettingsStore().getCurrentModelRequestConfig();
        await llmSubmit(graphId.value, customRole.value, customData.value, config);
        addLog(`Manuelles Feedback erfolgreich gesendet!`, 'success');
    } catch (error: any) {
        addLog(`Fehler beim Senden des manuellen Feedbacks: ${error.message || error}`, 'error');
    } finally {
        isTesting.value = false;
    }
}

const addCustomQAPair = () => {
    customData.value.push({ question: "", answer: "" });
}
const removeCustomQAPair = (index: number) => {
    customData.value.splice(index, 1);
}

const combineData = async () => {
    addLog(`Starte LLM Combine Endpoint...`, 'info');
    try {
        const config = useLLMSettingsStore().getCurrentModelRequestConfig();
        const res = await llmPool(graphId.value, config);

        if (res.success === false) {
            addLog(`Combine fehlgeschlagen (success: false).`, 'error');
            return;
        }
        addLog(`LLM Combine erfolgreich!`, 'success');
        console.log(res);
    } catch (error: any) {
        addLog(`Fehler beim Combine: ${error.message || error}`, 'error');
    }
}
</script>

<template>
    <div class="flex flex-col h-full space-y-6 p-4 bg-gray-50 min-h-screen">
        <OptionsButton />

        <div class="p-4 bg-gray-200 rounded-lg shadow-sm border border-gray-300">
            <h2 class="font-bold text-lg mb-1">LLM-Test Debug Dashboard</h2>
            <p class="text-sm text-gray-600">Steuerung, Tests und Live-Logs für die LLM-Schnittstelle.</p>
        </div>


        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div class="flex flex-col gap-6">
                <div>
                    <h3 class="font-semibold text-gray-800 text-sm mb-2">Aktivität erstellen. ID aus console ziehen.
                    </h3>
                    <Button @click="createActivity" variant="outline">Create Activity</Button>
                </div>
                <div class="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <label class="text-sm font-semibold text-gray-700 block mb-2">Aktive Graph ID:</label>
                    <input v-model="graphId" type="text" placeholder="Graph ID eingeben..."
                        class="w-full p-2 border rounded bg-gray-50 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div class="p-4 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col gap-3">
                    <h3 class="font-semibold text-gray-800 border-b pb-2">Vordefinierte Tests</h3>
                    <div class="flex items-center gap-4 mb-2">
                        <label class="text-sm text-gray-600">Anzahl der Rollen nacheinander:</label>
                        <select v-model="selectedTestCount" class="border rounded p-1 text-sm bg-gray-50">
                            <option :value="1">1 (Nur Arzt)</option>
                            <option :value="2">2 (Arzt + Pflege)</option>
                            <option :value="3">3 (Alle Rollen)</option>
                        </select>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <Button @click="runTests" :disabled="isTesting"
                            class="bg-blue-600 hover:bg-blue-700 text-white">
                            {{ isTesting ? 'Verarbeite...' : 'Test starten' }}
                        </Button>
                        <Button @click="combineData" variant="outline" :disabled="!readyForCombine"
                            class="border-blue-600 text-blue-600 hover:bg-blue-50">Combine (Pool)</Button>

                    </div>
                </div>

                <div class="p-4 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col gap-3">
                    <h3 class="font-semibold text-gray-800 border-b pb-2">Manuelles Feedback hinzufügen</h3>

                    <div class="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <label class="text-xs text-gray-500">Rollen ID</label>
                            <input v-model="customRole.id" class="w-full p-1.5 text-sm border rounded bg-gray-50" />
                        </div>
                        <div>
                            <label class="text-xs text-gray-500">Rollen Label</label>
                            <input v-model="customRole.label" class="w-full p-1.5 text-sm border rounded bg-gray-50" />
                        </div>
                    </div>

                    <div v-for="(qa, index) in customData" :key="index"
                        class="p-3 bg-gray-50 border rounded relative mt-2">
                        <button v-if="customData.length > 1" @click="removeCustomQAPair(index)"
                            class="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs font-bold">X</button>
                        <label class="text-xs font-semibold block mb-1">Frage {{ index + 1 }}</label>
                        <textarea v-model="qa.question" rows="1" class="w-full p-1.5 text-sm border rounded mb-2"
                            placeholder="Frage..."></textarea>

                        <label class="text-xs font-semibold block mb-1">Antwort {{ index + 1 }}</label>
                        <textarea v-model="qa.answer" rows="2" class="w-full p-1.5 text-sm border rounded"
                            placeholder="Antwort..."></textarea>
                    </div>

                    <div class="flex justify-between items-center mt-2">
                        <button @click="addCustomQAPair" class="text-xs text-blue-600 font-medium hover:underline">+ Q/A
                            hinzufügen</button>
                        <Button @click="testCustomData" :disabled="isTesting"
                            class="bg-green-600 hover:bg-green-700 text-white text-xs py-1">
                            Senden
                        </Button>
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-6">

                <div class="p-4 bg-gray-900 rounded-lg shadow-sm border border-gray-800 flex flex-col h-64">
                    <div class="flex justify-between items-center border-b border-gray-700 pb-2 mb-2">
                        <h3 class="font-semibold text-gray-100 text-sm flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full"
                                :class="isTesting ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'"></div>
                            Live Logs
                        </h3>
                        <button @click="clearLogs" class="text-xs text-gray-400 hover:text-white">Clear</button>
                    </div>
                    <div class="flex-1 overflow-y-auto font-mono text-xs space-y-1 pr-2">
                        <div v-if="logs.length === 0" class="text-gray-500 italic">Noch keine Aktionen ausgeführt...
                        </div>
                        <div v-for="(log, idx) in logs" :key="idx" class="flex gap-2">
                            <span class="text-gray-500 shrink-0">[{{ log.time }}]</span>
                            <span :class="{
                                'text-blue-300': log.type === 'info',
                                'text-green-400': log.type === 'success',
                                'text-red-400': log.type === 'error'
                            }">{{ log.msg }}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <Button @click="getActivityData" variant="outline">Aktivitätsdaten abrufen (API Test)</Button>
                </div>
                <div class="space-y-2">
                    <h3 class="font-semibold text-gray-800 text-sm ml-1">Vordefinierte Daten ansehen</h3>
                    <div class="bg-white rounded border border-gray-200 overflow-hidden">
                        <button @click="showArzt = !showArzt"
                            class="w-full p-3 text-sm font-medium text-left bg-gray-50 hover:bg-gray-100 flex justify-between">
                            <span>Arzt Feedback</span><span>{{ showArzt ? '▼' : '▶' }}</span>
                        </button>
                        <pre v-if="showArzt"
                            class="p-4 text-[10px] text-gray-700 overflow-x-auto border-t">{{ JSON.stringify(arztData, null, 2) }}</pre>
                    </div>

                    <div class="bg-white rounded border border-gray-200 overflow-hidden">
                        <button @click="showPflege = !showPflege"
                            class="w-full p-3 text-sm font-medium text-left bg-gray-50 hover:bg-gray-100 flex justify-between">
                            <span>Pflege Feedback</span><span>{{ showPflege ? '▼' : '▶' }}</span>
                        </button>
                        <pre v-if="showPflege"
                            class="p-4 text-[10px] text-gray-700 overflow-x-auto border-t">{{ JSON.stringify(pflegeData, null, 2) }}</pre>
                    </div>

                    <div class="bg-white rounded border border-gray-200 overflow-hidden">
                        <button @click="showPhysio = !showPhysio"
                            class="w-full p-3 text-sm font-medium text-left bg-gray-50 hover:bg-gray-100 flex justify-between">
                            <span>Physio Feedback</span><span>{{ showPhysio ? '▼' : '▶' }}</span>
                        </button>
                        <pre v-if="showPhysio"
                            class="p-4 text-[10px] text-gray-700 overflow-x-auto border-t">{{ JSON.stringify(physioData, null, 2) }}</pre>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>
<!-- <script setup lang="ts">
import { ref, reactive } from 'vue';
import OptionsButton from '@/components/OptionsButton.vue';
import Button from '@/components/ui/button/Button.vue';
import { llmSubmit, llmPool, llmSettingGeneration } from '@/data/knowledge_graph/llm_utils';
import { useLLMSettingsStore } from '@/stores/llmSettingsStore';

// --- STATE ---
const graphId = ref("bcfe5248-e409-4416-a3d0-2953a3231169");
const loading = ref(false);
const logs = ref<string[]>([]); // Für Status-Updates in der UI

// Hier speichern wir die Datensätze, die abgeschickt werden sollen
const testQueue = ref<any[]>([]);

// --- VORLAGEN (Hier kannst du einfach neue Rollen hinzufügen) ---
const templates = {
    arzt: {
        role: { id: "Physician01", label: "Arzt 01" },
        "data": [
            {
                "question": "Wie haben Sie das gemeinsame Ziel des Teams verstanden und gab es unterschiedliche Perspektiven der beteiligten Berufsgruppen?",
                "answer": "Mein primäres Ziel war es, anhand der Laborwerte einen schnellen Überblick über den Stoffwechselzustand des Patienten zu erhalten: Glukose- und Wasserhaushalt, Säure-Basen-Haushalt usw., um eine gefährliche Ketoazidose auszuschließen. Das erfordert eine akute Behandlung und macht die Diskussion über eine Anpassung der Schmerztherapie und eine mögliche Entlassung etwas weniger wichtig."
            },
            {
                "question": "Inwieweit konnten Sie Ihre sozialen Kompetenzen einsetzen – Agency Skill (durchsetzungsstarkes, selbstsicheres, entschlossenes und energisches Verhalten), Communion Skill (warmherziges, freundliches und mitfühlendes Verhalten) oder Interpersonelle Resilienz (gelassenes, entspanntes und emotional ausgeglichenes Verhalten), wenn die zwischenmenschliche Situation es verlangte?",
                "answer": "Zu Beginn der Patientenbesprechung war es schwierig, die Beiträge aller Teammitglieder zu koordinieren. Ich fand es auch schwierig, den anderen schnell zu vermitteln, was die Laborwerte bedeuteten. Ich habe mir die Informationen der anderen jedoch genau angehört und mir gemeinsam mit ihnen die Zeit genommen, die Bedeutung dieser Informationen einzuschätzen und zu priorisieren."
            },
            {
                "question": "Welche Erwartungen, Rahmenbedingungen und Werte haben die Zusammenarbeit im Team geprägt (z. B. Organisation, Berufsgruppen, Patient*innen, Zugehörige)?",
                "answer": "Die Empfehlung für die Entlassung und die Therapie dieses Patienten muss dem Oberarzt, meinem Ausbilder, vorgelegt werden, daher möchte ich, dass alles korrekt ist und alle seine/ihre Fragen gut beantwortet werden. Ich weiß, wie er/sie reagiert, wenn etwas fehlt oder unklar ist."
            },
            {
                "question": "Welche fachlichen, kommunikativen oder organisatorischen Tools haben Ihnen geholfen, die Situation zu verstehen und gut mit anderen zusammenzuarbeiten?",
                "answer": "Es war praktisch, dass Laborergebnisse, Befunde aus der Anamnese und der körperlichen Untersuchung sowie die Medikamentenliste usw. in ORBIS zu finden waren. Auch die Informationen aus der Pflege und Physiotherapie sind dort abrufbar. Es war gut, dass ich die Voicemail-Nachricht sofort abgehört habe, obwohl ich sie zweimal abspielen musste, um sie richtig zu verstehen. Die Informationen, die die Krankenschwester bei der Übergabe von ihren Kollegen über den Alkoholgeruch erhalten hatte, machten mich ebenfalls aufmerksam.\nDer Zugang zu digitalen Informationsquellen ermöglichte es mir, nachzuschlagen, auf welche Parameter bei einer Ketoazidose zu achten ist."
            },
            {
                "question": "Welche expliziten oder impliziten Regeln haben das Handeln in dieser Situation beeinflusst (z. B. Leitlinien, gesetzliche Vorgaben, Goldstandards, Teamkultur)?",
                "answer": "Es ist schwierig zu bestimmen, wann der Ansatz in die Palliativpflege übergeht und wie ernst man eine Alkohol-Wechselwirkung mit Medikamenten nehmen sollte, wenn sie sich ansonsten positiv auf die vom Patienten empfundene Lebensqualität auswirkt."
            },
            {
                "question": "Wie war die Arbeitsteilung im Team gestaltet, und wie wurden Verantwortung und Entscheidungsmacht verteilt?",
                "answer": "Ich fühle mich in erster Linie für die Empfehlung verantwortlich, die wir dem Chefarzt vorlegen. Außerdem haben wir aufgrund von Personalausfällen sehr viel zu tun in der Abteilung, und ich möchte, dass die Besprechung so effizient wie möglich verläuft. Dazu sind Koordination und Steuerung meinerseits erforderlich.\n"
            }
        ]
    },
    pflege: {
        role: { id: "Nurse01", label: "Krankenpfleger 01" },
        "data": [
            {
                "question": "Wie haben Sie das gemeinsame Ziel des Teams verstanden und gab es unterschiedliche Perspektiven der beteiligten Berufsgruppen?",
                "answer": "Zunächst dachte ich, wir würden die Bedingungen für eine verantwortungsvolle Entlassung besprechen: wirksame Schmerzlinderung, Unterstützung der Partnerin im Umgang mit dem Verhalten ihres Mannes, aber die Voicemail, die der Arzt vom Chefarzt erhalten hatte, machte deutlich, dass zunächst die Laboruntersuchungen berücksichtigt werden mussten. Als sich herausstellte, dass diese in Ordnung waren, waren sich alle im Team einig, dass wir die Akzeptanz der Verwendung von Opioiden durch den Patienten, die Wechselwirkung von Alkohol mit den Medikamenten und die Sturzgefahr in der häuslichen Situation besprechen mussten.\n"
            },
            {
                "question": "Inwieweit konnten Sie Ihre sozialen Kompetenzen einsetzen – Agency Skill (durchsetzungsstarkes, selbstsicheres, entschlossenes und energisches Verhalten), Communion Skill (warmherziges, freundliches und mitfühlendes Verhalten) oder Interpersonelle Resilienz (gelassenes, entspanntes und emotional ausgeglichenes Verhalten), wenn die zwischenmenschliche Situation es verlangte?",
                "answer": "Die Frau des Patienten war zunächst etwas enttäuscht, dass ich das Gespräch führte, da sie lieber mit dem Arzt gesprochen hätte. Ein Arzt hat nun einmal mehr Gewicht und wird ernster genommen. Da ich jedoch ruhig blieb und offen für ihre Sorgen um ihren Mann war, legte sich ihre Enttäuschung schnell und sie war froh über mein offenes Ohr und mein Versprechen, das Thema in der Teambesprechung anzusprechen.\n"
            },
            {
                "question": "Welche Erwartungen, Rahmenbedingungen und Werte haben die Zusammenarbeit im Team geprägt (z. B. Organisation, Berufsgruppen, Patient*innen, Zugehörige)?",
                "answer": "In der Teambesprechung widmete der Arzt den Laborwerten und der Funktion der Leber in Bezug auf die Medikation große Aufmerksamkeit. Auch beim Alkoholkonsum wurde vor allem auf die Wechselwirkung mit den Medikamenten eingegangen. Für eine gute Situation zu Hause halte ich die zwischenmenschlichen Faktoren ebenfalls für sehr wichtig, aber die Sorge der Frau über den Einfluss von Alkohol auf das Verhalten ihres Mannes und die Spannungen, die dies zu Hause verursachen könnte, konnte ich nur schwer einbringen. Ich hatte auch das Gefühl, dass dies nicht als so wichtig angesehen wurde.\n"
            },
            {
                "question": "Welche fachlichen, kommunikativen oder organisatorischen Tools haben Ihnen geholfen, die Situation zu verstehen und gut mit anderen zusammenzuarbeiten?",
                "answer": "Es ist gut, dass Kollegen Dinge, die ihnen bei der Pflege des Patienten auffallen, in ORBIS notieren. So gibt es genügend Hinweise darauf, dass der Patient starke Schmerzen hat (verzerrtes Gesicht beim Anziehen), während der Patient selbst dies bagatellisiert. Auch Notizen in Ihrem eigenen Notizbuch helfen Ihnen dabei, wichtige Punkte der Übergabe (Alkoholgeruch) nicht zu vergessen.\n"
            },
            {
                "question": "Welche expliziten oder impliziten Regeln haben das Handeln in dieser Situation beeinflusst (z. B. Leitlinien, gesetzliche Vorgaben, Goldstandards, Teamkultur)?",
                "answer": "Durch unseren ständigen Kontakt mit den Patienten haben wir oft einen besseren Einblick in die tatsächlichen Emotionen und Motivationen der Patienten. Der Arzt sieht oft Momentaufnahmen und das in einem Kontext, in dem Patienten sich stark geben wollen. Bei diesem Patienten denke ich, dass wir leichter zu einer akzeptablen Lösung kommen würden, wenn wir mehr auf seine tatsächlichen Schmerzen und seine Ängste vor Opioiden eingehen würden.\n"
            },
            {
                "question": "Wie war die Arbeitsteilung im Team gestaltet, und wie wurden Verantwortung und Entscheidungsmacht verteilt?",
                "answer": "Ich hatte das Gefühl, dass der Arzt bereits einen Plan im Kopf hatte und diesen nutzte, um schnell Prioritäten zu setzen. Außerdem zeigte er wenig Verständnis für die Ängste des Patienten und die Sorgen seiner Frau. Ich hätte mir etwas mehr Mitsprache und Absprache gewünscht.\n"
            }
        ]
    },
    physio: {
        role: { id: "Physiotherapist01", label: "Physiotherapeut 01" },
        "data": [
            {
                "question": "Wie haben Sie das gemeinsame Ziel des Teams verstanden und gab es unterschiedliche Perspektiven der beteiligten Berufsgruppen?",
                "answer": "Unser gemeinsames Ziel war es, Empfehlungen zur Sturzprävention im häuslichen Umfeld und zur optimalen Behandlung der Schmerzen des Patienten zu besprechen. Dass Alkoholkonsum möglicherweise ein komplizierender Faktor war, wurde mir erst später mitgeteilt.\n"
            },
            {
                "question": "Inwieweit konnten Sie Ihre sozialen Kompetenzen einsetzen – Agency Skill (durchsetzungsstarkes, selbstsicheres, entschlossenes und energisches Verhalten), Communion Skill (warmherziges, freundliches und mitfühlendes Verhalten) oder Interpersonelle Resilienz (gelassenes, entspanntes und emotional ausgeglichenes Verhalten), wenn die zwischenmenschliche Situation es verlangte?",
                "answer": "Da der Arzt und das Pflegepersonal ständig zusammenarbeiten, merkt man, dass sie besser aufeinander eingespielt sind. Gemeinsam sind sie besser über den Patienten informiert und halten bestimmte Dinge daher für selbstverständlich, während dies für weniger involvierte Gesundheitsfachkräfte nicht der Fall ist. Man muss immer aktiv nach solchen Informationen fragen, und dann fühle ich mich manchmal etwas unbehaglich.\n"
            },
            {
                "question": "Welche Erwartungen, Rahmenbedingungen und Werte haben die Zusammenarbeit im Team geprägt (z. B. Organisation, Berufsgruppen, Patient*innen, Zugehörige)?",
                "answer": "Wir sind eine zentrale Abteilung für das gesamte Krankenhaus und daher sehr abhängig von den Informationen, die wir bei unseren Besuchen auf den Pflegestationen erhalten. In den peripheren Pflegestationen verfügen wir nur über wenige Einrichtungen, während aufgrund von Zeitmangel und der eingeschränkten Belastbarkeit der Patienten ein Transport zu den speziellen physiotherapeutischen Einrichtungen nicht möglich ist.\n"
            },
            {
                "question": "Welche fachlichen, kommunikativen oder organisatorischen Tools haben Ihnen geholfen, die Situation zu verstehen und gut mit anderen zusammenzuarbeiten?",
                "answer": "Wir verwenden den Timed Up & Go-Test für eine schnelle Einschätzung der funktionellen Mobilität und des Gleichgewichts eines Patienten. Er gibt Aufschluss über die allgemeine Mobilität und Selbstständigkeit, ist jedoch nur ein grober und indirekter Indikator für das Sturzrisiko. Um dieses einzuschätzen, sind intensivere und wiederholte Untersuchungen erforderlich. Dafür ist in diesem Zusammenhang keine Zeit. Wenn sich später noch herausstellt, dass Opioide und Alkohol hinzukommen, wird es ganz schwierig, etwas Sinnvolles zu sagen. Auch die Messung der Schmerzintensität liefert nur eine Momentaufnahme. Der Arzt sollte dem keine allzu große Bedeutung beimessen.\nWir können die Daten der Physiotherapie zusammen mit denen der Ergotherapie und Logopädie in ORBIS einsehen, was einen guten Überblick verschafft. Es wäre auch gut, wenn wir in ORBIS auch Zugriff auf die medizinischen Informationen hätten.\n"
            },
            {
                "question": "Welche expliziten oder impliziten Regeln haben das Handeln in dieser Situation beeinflusst (z. B. Leitlinien, gesetzliche Vorgaben, Goldstandards, Teamkultur)?",
                "answer": "Der Arzt fordert Untersuchungen wie den Timed Up & Go-Test oder die Messung der Schmerzintensität bei uns an, aber deren Wert ist in dieser Situation begrenzt. Es ist jedoch wichtig, dass die Physiotherapie über die Schmerzbeschwerden des Patienten informiert ist, damit wir diese bei den Mobilisierungsübungen berücksichtigen können und beispielsweise auch nachverfolgen können, welche Bettlagen sich positiv auswirken oder wie er sich am besten drehen oder bücken kann.\n"
            },
            {
                "question": "Wie war die Arbeitsteilung im Team gestaltet, und wie wurden Verantwortung und Entscheidungsmacht verteilt?",
                "answer": "Ärzte haben oft keine genaue Vorstellung davon, was wir als Physiotherapeuten leisten können, und verschreiben daher manchmal weniger geeignete Untersuchungen oder Behandlungen. Auch das Pflegepersonal ist sich manchmal nicht bewusst, dass wir bei der Verbesserung der Lagerung und beim Transfer mitdenken können.\n"
            }
        ]
    }
};

// --- LOGIK ---

// Datensatz zur aktuellen Test-Schlange hinzufügen
const addToQueue = (type: keyof typeof templates) => {
    // Wir erstellen eine tiefe Kopie, damit Änderungen an der Queue die Vorlage nicht verändern
    const newItem = JSON.parse(JSON.stringify(templates[type]));
    testQueue.value.push(newItem);
};

const removeFromQueue = (index: number) => {
    testQueue.value.splice(index, 1);
};

const runAllTests = async () => {
    if (testQueue.value.length === 0) return;

    loading.value = true;
    logs.value = [];
    const settings = useLLMSettingsStore().getCurrentModelRequestConfig();

    try {
        for (const [index, item] of testQueue.value.entries()) {
            logs.value.push(`Sende Feedback ${index + 1} (${item.role.label})...`);

            await llmSubmit(graphId.value, item.role, item.data, settings);

            logs.value[logs.value.length - 1] += " ✅ Erfolg";
        }
        logs.value.push("Alle Test-Calls abgeschlossen!");
    } catch (error) {
        console.error("Fehler:", error);
        logs.value.push("❌ Fehler bei der Übertragung.");
    } finally {
        loading.value = false;
    }
};

const combineData = async () => {
    const settings = useLLMSettingsStore().getCurrentModelRequestConfig();
    logs.value.push("Pooling wird gestartet...");
    try {
        const res = await llmPool(graphId.value, settings);
        logs.value.push(res.success ? "✅ Pooling erfolgreich" : "❌ Pooling fehlgeschlagen");
    } catch (e) {
        logs.value.push("❌ Error beim Pooling");
    }
};

const activity = {
    "title": "IPL LLM Test",
    "description": "Der Patient Herman Braun leidet an metastasierendem Prostatakarzinom mit starken Rückenschmerzen und Gangunsicherheit. Das interprofessionelle Team muss klären, ob ein wahrgenommener Alkoholgeruch auf einen Rückfall oder auf eine diabetische Ketoazidose hinweist und eine gemeinsame Empfehlung zur weiteren Schmerztherapie und Entlassung formulieren. Die Ehefrau sorgt sich wegen seiner Sturzgefahr und seines Temperaments unter Alkoholeinfluss um häusliche Überlastung.",
};
const createActivity = async () => {
    try {
        console.log("Starting activity creation with description:", activity.description);
        const res = await llmSettingGeneration(activity.description, useLLMSettingsStore().getCurrentModelRequestConfig(), activity.title);
        console.log("Activity created successfully with res: ", res);

    } catch (error) {
        console.error("Error during LLM generation:", error);
    }
}
const jsonPasteArea = ref('');
const jsonError = ref<string | null>(null);

const addJsonToQueue = () => {
    jsonError.ref = null;
    try {
        // 1. String parsen
        const parsed = JSON.parse(jsonPasteArea.value);

        // 2. Kurze Validierung (Hat es role und data?)
        if (!parsed.role || !parsed.data || !Array.isArray(parsed.data)) {
            throw new Error("Ungültiges Format: 'role' und 'data' (Array) werden benötigt.");
        }

        // 3. In die Queue schieben
        testQueue.value.push(parsed);

        // 4. Feld leeren
        jsonPasteArea.value = '';
    } catch (e: any) {
        jsonError.value = "JSON Fehler: " + e.message;
        console.error("Paste Error:", e);
    }
};

</script>

<template>
    <OptionsButton />
    <div class="flex flex-col h-full space-y-6 p-4 max-w-4xl mx-auto">

        <div class="p-4 bg-gray-200 rounded-lg shadow-sm border-l-4 border-blue-500">
            <h2 class="font-bold">LLM Debug Console (Dynamic Mode)</h2>
            <div class="mt-4 flex flex-col gap-2">
                <label class="text-xs font-bold uppercase text-gray-600">Target Graph ID</label>
                <input v-model="graphId" class="p-2 border rounded font-mono text-sm" />
            </div>
        </div>
        <div>
            Create new Activity. See Console for id
            <Button @click="createActivity" class="self-start">Create Activity with LLM Generated Content</Button>
        </div>
        <div class="p-4 bg-white rounded-lg shadow border flex flex-wrap gap-2">
            <span class="w-full text-sm font-semibold mb-1">Feedback-Daten hinzufügen:</span>
            <Button variant="outline" @click="addToQueue('arzt')">+ Arzt</Button>
            <Button variant="outline" @click="addToQueue('pflege')">+ Pflege</Button>
            <Button variant="outline" @click="addToQueue('physio')">+ Physio</Button>
            <Button variant="destructive" @click="testQueue = []" :disabled="testQueue.length === 0">Leeren</Button>
        </div>
        <div class="p-4 bg-gray-800 rounded-lg shadow border border-gray-700 space-y-3">
            <div class="flex justify-between items-center">
                <h3 class="font-bold text-gray-100 text-sm flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">content_paste</span>
                    JSON Bulk Import
                </h3>
                <span class="text-[10px] text-gray-400 font-mono">Schema: { role: {}, data: [] }</span>
            </div>

            <textarea v-model="jsonPasteArea" placeholder='{ "role": { "id": "...", "label": "..." }, "data": [...] }'
                class="w-full h-32 p-3 bg-gray-900 border border-gray-600 rounded text-xs font-mono text-green-500 focus:ring-1 focus:ring-green-500 outline-none"></textarea>

            <div v-if="jsonError" class="text-red-400 text-[11px] font-bold">
                {{ jsonError }}
            </div>

            <Button @click="addJsonToQueue" variant="secondary"
                class="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs" :disabled="!jsonPasteArea.trim()">
                In die Queue importieren
            </Button>
        </div>

        <div v-if="testQueue.length > 0" class="space-y-2">
            <h3 class="text-sm font-bold">Aktuelle Test-Schlange ({{ testQueue.length }} Items):</h3>
            <div v-for="(item, index) in testQueue" :key="index"
                class="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                <span>{{ index + 1 }}. <strong>{{ item.role.label }}</strong> ({{ item.data.length }} Fragen)</span>
                <button @click="removeFromQueue(index)"
                    class="text-red-500 hover:text-red-700 font-bold px-2">×</button>
            </div>

            <div class="flex gap-2 pt-2">
                <Button @click="runAllTests" :disabled="loading" class="flex-1">
                    {{ loading ? 'Sende...' : 'Alle ' + testQueue.length + ' Feedbacks abschicken' }}
                </Button>
                <Button @click="combineData" variant="secondary">Combine (Pool)</Button>
            </div>
        </div>

        <div v-if="logs.length > 0"
            class="p-4 bg-black text-green-400 font-mono text-xs rounded-lg shadow-inner min-h-[100px]">
            <div v-for="(log, i) in logs" :key="i">> {{ log }}</div>
        </div>

        <details class="opacity-50">
            <summary class="cursor-pointer text-xs">Vorschau der Queue (JSON)</summary>
            <pre class="text-[10px] bg-gray-100 p-2 rounded">{{ JSON.stringify(testQueue, null, 2) }}</pre>
        </details>
    </div>
</template> -->