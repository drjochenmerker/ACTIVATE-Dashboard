import { LanguageCode } from "./knowledge_graph/structures";

/**
 * Activate Terms for the three available languages
 */
export const activateTerms: Record<LanguageCode, Record<string, string>> = {
    de: {
        subject: 'Subjekt',
        object: 'Ziel',
        instruments: 'Instrumente',
        community: 'Gemeinschaft',
        rules: 'Regeln',
        division_of_labour: 'Arbeitsteilung',
        misc: 'Sonstiges',
    },
    en: {
        subject: 'Subject',
        object: 'Object(ive)',
        instruments: 'Instruments',
        community: 'Community',
        rules: 'Rules',
        division_of_labour: 'Division of Labour',
        misc: 'Miscellaneous',
    },
    sv: {
        subject: 'Ämne',
        object: 'Mål',
        instruments: 'Instrument',
        community: 'Gemenskap',
        rules: 'Regler',
        division_of_labour: 'Arbetsdelning',
        misc: 'Övrigt',
    },
}

/** 
 * contentData is an array of objects that contain id, title and number
 * of the activity diagram participants
 */
export const contentData = [
    {
        id: 'subject',
        number: 3,
    },
    {
        id: 'object',
        number: 4,
    },
    {
        id: 'instruments',
        number: 0,
    },
    {
        id: 'community',
        number: 5,
    },
    {
        id: 'rules',
        number: 1,
    },
    {
        id: 'division_of_labour',
        number: 2,
    },
    {
        id: 'misc',
        number: 6,
    },
];

/**
 * staticContent contains the terms and phrases that helps the user understand
 * It also provides the terms in the 3 main languages English, German and Swedish
 */
export const staticContent = {
    errors: {
        noMisc: {
            en: "There are no miscellaneous comments.",
            de: "Es gibt keine sonstigen Kommentare.",
            sv: "Det finns inga övriga kommentarer.",
        },
        activityNameLoad: {
            en: "Failed to load activity name.",
            de: "Aktivitätsname konnte nicht geladen werden.",
            sv: "Aktivitetsnamn kunde inte laddas.",
        },
        timestampLoad: {
            en: "Failed to load timestamp.",
            de: "Zeitstempel konnte nicht geladen werden.",
            sv: "Tidstämpel kunde inte laddas.",
        },
        noConflicts: {
            en: "There are no conflicts.",
            de: "Es gibt keine Konflikte.",
            sv: "Det finns inga konflikter.",
        },
        noElements: {
            en: "No elements to select from",
            de: "Keine Elemente zur Auswahl",
            sv: "Inga element att välja mellan",
        }
    },
    terms: {
        setting: {
            en: "Setting",
            de: "Situation",
            sv: "Läge",
        },
        author: {
            en: "Author",
            de: "Autor",
            sv: "Författare",
        },
        timestamp: {
            en: "Timestamp",
            de: "Zeitstempel",
            sv: "Tidstämpel",
        },
        status: {
            en: "Status",
            de: "Status",
            sv: "Status",
        },
        participants: {
            en: "Participants",
            de: "Teilnehmer",
            sv: "Deltagare",
        },
        replies: {
            en: "Replies",
            de: "Antworten",
            sv: "Svar",
        },
        done: {
            en: "Done",
            de: "Fertig",
            sv: "Färdig",
        },
        add: {
            en: "Add",
            de: "Hinzufügen",
            sv: "Lägg till",
        },
        changeTheme: {
            en: "Change Theme",
            de: "Thema ändern",
            sv: "Ändra tema",
        },
        endSession: {
            en: "End Session",
            de: "Sitzung beenden",
            sv: "Avsluta session",
        },
        delete: {
            en: "Delete",
            de: "Löschen",
            sv: "Ta bort",
        },
        clone: {
            en: "Clone",
            de: "Klonen",
            sv: "Klon",
        },
        conflictStatus: {
            open: {
                en: "Open",
                de: "Offen",
                sv: "Öppen",
            },
            inDiscussion: {
                en: "In Discussion",
                de: "In Diskussion",
                sv: "I diskussion",
            },
            resolved: {
                en: "Resolved",
                de: "Gelöst",
                sv: "Löst",
            }
        },
    },
    placeholders: {
        search: {
            en: "Search...",
            de: "Suche...",
            sv: "Sök...",
        },
        description: {
            en: "Description...",
            de: "Beschreibung...",
            sv: "Beskrivning...",
        },
        title: {
            en: "Title...",
            de: "Titel...",
            sv: "Titel...",
        },
        answer: {
            en: "Answer...",
            de: "Antwort...",
            sv: "Svar...",
        },
        reply: {
            en: "Reply...",
            de: "Antwort...",
            sv: "Svar...",
        },
        newTitle: {
            en: "New title...",
            de: "Neuer Titel...",
            sv: "Ny titel...",
        },
        newDescriptionOptional: {
            en: "New description (optional)...",
            de: "Neue Beschreibung (optional)...",
            sv: "Ny beskrivning (valfritt)...",
        },
        roleSelect: {
            en: "Select role...",
            de: "Rolle auswählen...",
            sv: "Välj roll...",
        },
        noItems: {
            en: "No items to select from.",
            de: "Kein Element zur Auswahl.",
            sv: "Inga artiklar att välja mellan."
        }
    },
    editor: {
        header: {
            en: "Add Note to selected points:",
            de: "Notiz zu den ausgewählten Punkten hinzufügen:",
            sv: "Lägg till anteckning till valda punkter:",
        },
        headerNoSelection: {
            en: "Add Note:",
            de: "Notiz hinzufügen:",
            sv: "Lägg till anteckning:",
        },
        addTitle: {
            en: "Add a title",
            de: "Titel hinzufügen",
            sv: "Lägg till en titel",
        },
        anonymous: {
            en: "Send anonymously",
            de: "Anonym senden",
            sv: "Skicka anonymt",
        }
    },
    alerts: {
        entityEnter: {
            en: "Place enter an entity name.",
            de: "Bitte geben Sie einen Entitätsnamen ein.",
            sv: "Ange ett entitetsnamn.",
        },
        activityClassSelect: {
            en: "Please select an activity class.",
            de: "Bitte wählen Sie eine Aktivitätsklasse aus.",
            sv: "Vänligen välj en aktivitetsklass.",
        }
    },
    toastNotification: {
        conflictAdded: {
            en: "Conflict added.",
            de: "Konflikt hinzugefügt",
            sv: "Konflikt tillagd"
        },
        noteAdded: {
            en: "Note added.",
            de: "Notiz hinzugefügt.",
            sv: "Not tillagd"
        }
    },
    entitiyAdd: {
        addButton: {
            en: "Add Entity",
            de: "Entität hinzufügen",
            sv: "Lägg till entitet",
        },
        entityName: {
            en: "Entity Name",
            de: "Entitätsname",
            sv: "Entitetsnamn",
        },
        activityClass: {
            en: "Activity Class",
            de: "Aktivitätsklasse",
            sv: "Aktivitetsklass",
        },
        selectClass: {
            en: "Select Activity Class",
            de: "Aktivitätsklasse auswählen",
            sv: "Välj aktivitetsklass",
        }
    },
    tripleAdd: {
        addTripleText: {
            en: "Add RDF Triple",
            de: "RDF-Tripel hinzufügen",
            sv: "Lägg till RDF-trippel",
        },
        alertDuplicateClass: {
            en: "Subject and Object cannot be from the same class.",
            de: "Subjekt und Objekt dürfen nicht aus derselben Klasse stammen.",
            sv: "Subjekt och objekt får inte vara från samma klass.",
        },
        alertNoExistingPredicates: {
            en: "No predicates available for the selected classes.",
            de: "Keine Prädikate für die ausgewählten Klassen verfügbar.",
            sv: "Inga predikat tillgängliga för de valda klasserna.",
        },
        alertNoValidParticipants: {
            en: "Please choose a valid agent and target to see associated predicates.",
            de: "Bitte wählen Sie einen gültigen Agenten und ein Ziel aus, um die zugehörigen Prädikate anzuzeigen.",
            sv: "Vänligen välj en giltig agent och mål för att se associerade predikat.",
        },
        invalidPredicate: {
            en: "Predicate can only contain letters without spaces, numbers, or special characters.",
            de: "Das Prädikat darf nur Buchstaben ohne Leerzeichen, Zahlen oder Sonderzeichen enthalten.",
            sv: "Predikatet får endast innehålla bokstäver utan mellanslag, siffror eller specialtecken.",
        },
        mainText: {
            en: `This component lets you easily add new RDF triples to your knowledge graph. Simply select an
                agent (subject) and a target (object) from the
                provided lists. If the two are valid and belong to different categories, a list of applicable predicates
                (relationships) will appear for you
                to choose from. Please note that if the agent and target come from the same category or if no predicates
                are available for the chosen
                combination, a warning message will be displayed. If there are no existing predicates between the chosen
                agent and target you can simply
                add a new one by typing it into the predicate textfield`,
            de: `Mit dieser Komponente können Sie auf einfache Weise neue RDF-Triples zu Ihrem Wissensgraphen hinzufügen. Wählen Sie einfach einen
                Agenten (Subjekt) und ein Ziel (Objekt) aus den
                bereitgestellten Listen. Wenn die beiden gültig sind und zu verschiedenen Kategorien gehören, wird eine Liste der anwendbaren Prädikate
                (Beziehungen) angezeigt, aus der Sie
                aus der Sie wählen können. Bitte beachten Sie, dass, wenn der Agent und das Ziel aus der gleichen Kategorie stammen oder wenn keine Prädikate
                für die gewählte Kombination verfügbar sind
                Kombination vorhanden sind, wird eine Warnmeldung angezeigt. Wenn es keine Prädikate zwischen dem gewählten
                Agent und Ziel gibt, können Sie einfach
                ein neues Prädikat hinzufügen, indem Sie es in das Textfeld „Prädikat“ eingeben`,
            sv: `Med den här komponenten kan du enkelt lägga till nya RDF-tripplar i din kunskapsgraf. Välj helt enkelt en
                agent (ämne) och ett mål (objekt) från de
                tillhandahållna listorna. Om de två är giltiga och tillhör olika kategorier visas en lista med tillämpliga predikat
                (relationer) visas för dig att välja
                att välja mellan. Observera att om agenten och målet kommer från samma kategori eller om det inte finns några predikat
                finns tillgängliga för den valda
                kombination visas ett varningsmeddelande. Om det inte finns några befintliga predikat mellan den valda
                valda agenten och målet kan du helt enkelt
                lägga till ett nytt genom att skriva in det i predikatets textfält`,
        }
    },
    noteCards: {
        addComment: {
            en: "Add comment",
            de: "Kommentar hinzufügen",
            sv: "Lägg till kommentar",
        },
        save: {
            en: "Save",
            de: "Speichern",
            sv: "Spara",
        },
        cancel: {
            en: "Cancel",
            de: "Abbrechen",
            sv: "Avbryt",
        },
        answer: {
            en: "Answer",
            de: "Antworten",
            sv: "Svar",
        },
        saveComment: {
            en: "Save comment",
            de: "Kommentar speichern",
            sv: "Spara kommentar",
        },
    },
    startPage: {
        createActivity: {
            en: "Create new Setting",
            de: "Neue Situation erstellen",
            sv: "Skapa ny situation",
        },
        enterTitle: {
            en: "Enter title",
            de: "Titel eingeben",
            sv: "Ange titel",
        },
        enterDescription: {
            en: "Enter description",
            de: "Beschreibung eingeben",
            sv: "Ange beskrivning",
        },
        defaultRole: {
            en: "Enter default role",
            de: "Standardrolle eingeben",
            sv: "Ange standardroll",
        },
        deleteActivity: {
            en: "Delete activity",
            de: "Aktivität löschen",
            sv: "Ta bort aktivitet",
        },
        deleteConfirm: {
            en: "Are you sure you want to delete this activity?",
            de: "Sind Sie sicher, dass Sie diese Aktivität löschen möchten?",
            sv: "Är du säker på att du vill ta bort denna aktivitet?",
        },
        cloneActivity: {
            en: "Clone activity",
            de: "Aktivität klonen",
            sv: "Klonaktivitet",
        },
        newTitle: {
            en: "Enter new title:",
            de: "Neuen Titel eingeben:",
            sv: "Ange ny titel:",
        },
        newDescription: {
            en: "Enter new description:",
            de: "Neue Beschreibung eingeben:",
            sv: "Ange ny beskrivning:",
        },
        roleSelect: {
            en: "Role Selection",
            de: "Rollenwahl",
            sv: "Rollval",
        },
        roleSelectText: {
            en: "Please select a role for the debriefing:",
            de: "Bitte wählen Sie eine Rolle für das Debriefing aus:",
            sv: "Vänligen välj en roll för debriefingen:",
        },
        instructorMode: {
            en: "Enable instructor mode",
            de: "Dozentmodus aktivieren",
            sv: "Aktivera instruktörsläge",
        },
        activityRoleSelect: {
            en: "Select setting and role",
            de: "Situation und Rolle auswählen",
            sv: "Välj inställning och roll",
        },
        startDebriefing: {
            en: "Start debriefing",
            de: "Debriefing starten",
            sv: "Starta debriefing",
        },
        editSetting: {
            en: "Edit setting",
            de: "Situation bearbeiten",
            sv: "Välj inställning",
        },
        editTitle: {
            en: "Edit title",
            de: "Titel bearbeiten",
            sv: "Redigera titel",
        },
        titleRequired: {
            en: "Title is required",
            de: "Titel ist erforderlich",
            sv: "Titel krävs",
        },
        editDescription: {
            en: "Edit description",
            de: "Beschreibung bearbeiten",
            sv: "Redigera beskrivning",
        },
        saveChanges: {
            en: "Save changes",
            de: "Änderungen speichern",
            sv: "Spara ändringar",
        }
    }
}
