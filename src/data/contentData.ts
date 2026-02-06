import { LanguageCode } from "./knowledge_graph/structures";

/**
 * Activate Terms for the three available languages
 */
export const activateTerms: Record<LanguageCode, Record<string, string>> = {
    de: {
        subject: "Subjekt",
        object: "Ziel",
        instruments: "Werkzeuge",
        community: "Gemeinschaft",
        rules: "Regeln",
        division_of_labour: "Arbeitsteilung",
        misc: "Sonstiges",
    },
    en: {
        subject: "Subject",
        object: "Object(ive)",
        instruments: "Tools",
        community: "Community",
        rules: "Rules",
        division_of_labour: "Division of Labour",
        misc: "Miscellaneous",
    },
    sv: {
        subject: "Ämne",
        object: "Mål",
        instruments: "Verktyg",
        community: "Gemenskap",
        rules: "Regler",
        division_of_labour: "Arbetsdelning",
        misc: "Övrigt",
    },
};

/**
 * contentData is an array of objects that contain id, title and number
 * of the activity diagram participants
 */
export const contentData = [
    {
        id: "subject",
        number: 3,
    },
    {
        id: "object",
        number: 4,
    },
    {
        id: "instruments",
        number: 0,
    },
    {
        id: "community",
        number: 5,
    },
    {
        id: "rules",
        number: 1,
    },
    {
        id: "division_of_labour",
        number: 2,
    },
    {
        id: "misc",
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
        },
        incorrectPassword: {
            en: "The provided password is incorrect. Please try again.",
            de: "Das eingegebene Passwort ist falsch. Bitte versuch es nochmal.",
            sv: "Det angivna lösenordet är felaktigt. Försök igen.",
        },
    },
    login: {
        loginButton: {
            en: "Login",
            de: "Login",
            sv: "Login",
        },
    },
    homepage: {
        navbarScene: {
            en: "Scene",
            de: "Szene",
            sv: "Scen",
        },
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
        home: {
            en: "Home",
            de: "Startseite",
            sv: "Hem",
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
            },
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
            sv: "Inga artiklar att välja mellan.",
        },
        feedbackAnswer: {
            en: "Write your answer ...",
            de: "Schreiben Sie Ihre Antwort ...",
            sv: "Skriv ditt svar ...",
        },
        loading: {
            en: "Loading... This may take a while.",
            de: "Laden... Dies kann einen Moment dauern.",
            sv: "Laddar... Detta kan ta en stund.",
        },
        password: {
            en: "Password",
            de: "Passwort",
            sv: "Lösenord",
        },
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
        },
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
        },
    },
    toastNotification: {
        conflictAdded: {
            en: "Conflict added.",
            de: "Konflikt hinzugefügt",
            sv: "Konflikt tillagd",
        },
        noteAdded: {
            en: "Note added.",
            de: "Notiz hinzugefügt.",
            sv: "Not tillagd",
        },
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
        },
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
        },
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
        origin: {
            en: "Origin",
            de: "Herkunft",
            sv: "Ursprung",
        },
        showOrigin: {
            en: "Show origin",
            de: "Herkunft anzeigen",
            sv: "Visa ursprung",
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
        defaultRoleName: {
            en: "Lecturer",
            de: "Dozent",
            sv: "Lärare",
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
        withoutRoleSelectText: {
            en: "You can choose a role (optional) and start the debriefing or combine the feedback.",
            de: "Sie können eine Rolle wählen (optional) und das Debriefing starten oder das Feedback kombinieren.",
            sv: "Du kan välja en roll (valfritt) och börja debriefingen eller kombinera feedbacken.",
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
        descriptionRequired: {
            en: "Description is required",
            de: "Beschreibung ist erforderlich",
            sv: "Beskrivning krävs",
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
        },
        poolingButton: {
            en: "Combine",
            de: "Kombinieren",
            sv: "Kombinera",
        },
        confirmation: {
            en: "Confirm Combining",
            de: "Bestätigen Sie die Zusammenführung",
            sv: "Bekräfta kombination",
        },
        confirmationText: {
            en: "This will start the combining process. Do you want to continue? This may take a while.",
            de: "Dies wird die Zusammenführung starten. Möchten Sie fortfahren? Dies kann eine Weile dauern.",
            sv: "Detta kommer att starta poolningsprocessen. Vill du fortsätta? Detta kan ta en stund.",
        },
        pool: {
            en: "Yes start.",
            de: "Ja, starten.",
            sv: "Ja, starta.",
        },
        noPoolAvailable: {
            en: "There is no feedback to combine.",
            de: "Es gibt kein Feedback zum Kombinieren.",
            sv: "Det finns ingen feedback att kombinera.",
        },
        showQr: {
            en: "Show URL",
            de: "URL anzeigen",
            sv: "Visa URL",
        },
        hideQr: {
            en: "Hide URL",
            de: "URL ausblenden",
            sv: "Dölj URL",
        },
        copyLink: {
            en: "Copy Link",
            de: "Link kopieren",
            sv: "Kopiera länk",
        },
        copiedLink: {
            en: "Link copied!",
            de: "Link kopiert!",
            sv: "Länk kopierad!",
        },
    },
    hoverText: {
        object: {
            en: "What is the goal of the action? Cure, Care, adressing psychosocial issues etc. \n \
            On whom or what is this action taken? Patient, Relative, Blood sample etc.\n \
            What action must be taken? Needs assessment, Reporting, Decisionmaking etc.",
            de: "Was ist das Ziel der Maßnahme? Heilung, Pflege, Behandlung von psychosozialen Problemen usw.\n \
            An wem oder was wird die Maßnahme durchgeführt? Patient, Angehöriger, Blutprobe usw. \n\
            Welche Maßnahmen müssen ergriffen werden? Bedarfsanalyse, Berichterstattung, Entscheidungsfindung usw.",
            sv: "Vad är målet med åtgärden? Bota, vårda, ta itu med psykosociala frågor etc. \n\
            På vem eller vad vidtas denna åtgärd? Patient, anhörig, blodprov etc. \n\
            Vilken åtgärd måste vidtas? Behovsbedömning, rapportering, beslutsfattande etc.",
        },
        subject: {
            en: "Who are the actors in the action? Family physician, Medical specialist, Nurse, Social worker, Carers etc.\n \
            What perceptions, ideas and emotions are present in the actors? Uncertainty, Discomfort, Incompetence etc.",
            de: "Wer sind die Akteure der Aktion? Hausarzt, Facharzt, Krankenschwester, Sozialarbeiter, Pflegepersonal usw.\n \
            Welche Wahrnehmungen, Vorstellungen und Gefühle sind bei den Akteuren vorhanden? Ungewissheit, Unbehagen, Inkompetenz usw.",
            sv: "Vilka är aktörerna i handlingen? Familjeläkare, specialistläkare, sjuksköterska, socialarbetare, anhörigvårdare etc. \n\
            Vilka uppfattningar, idéer och känslor finns hos aktörerna? Osäkerhet, obehag, inkompetens etc.",
        },
        community: {
            en: "Where does the activity take place? Home, Nursing home, Hospital etc. \n\
            What organisation do the actors belong to? General University hospital, Independent Municipal health care practice etc. \n\
            What conditions characterise this setting? Immediate needs, Distance, Shortage etc.",
            de: "Wo findet die Aktivität statt? Zuhause, Pflegeheim, Krankenhaus usw. \n\
            Welcher Organisation gehören die Akteure an? Allgemein Universitätskrankenhaus, Selbstständige Gemeindepraxis für Gesundheitsversorgung usw. \n\
            Welche Bedingungen kennzeichnen dieses Umfeld? Unmittelbarer Bedarf, Entfernung, Mangel usw.",
            sv: "Var äger aktiviteten rum? Hem, vårdhem, sjukhus etc.\n\
            Vilken organisation tillhör aktörerna? Allmän Universitetssjukhus, Oberoende Kommunal vårdcentral etc.\n\
            Vilka förhållanden kännetecknar denna miljö? Omedelbara behov, Avstånd, Brist etc.",
        },
        instruments: {
            en: "What physical means are used in the action? Patient record, Chart, Medical device, Telephone etc. \n\
            Which abstract resources are deployed in the action? Conviction, Proactivity, Instruction etc.",
            de: "Welche materiellen Mittel werden bei der Aktion eingesetzt? Patientenakte, Krankenblatt, medizinisches Gerät, Telefon usw. \n\
            Welche abstrakten Mittel werden in der Aktion eingesetzt? Überzeugung, Proaktivität, Anweisung usw.",
            sv: "Vilka fysiska medel används i åtgärden? Patientjournal, diagram, medicinsk utrustning, telefon etc. \n\
            Vilka abstrakta resurser används i handlingen? Övertygelse, proaktivitet, instruktioner etc.",
        },
        rules: {
            en: "Which specific policies and rules are linked to the activity? Guidelines, Authorisation, Reimbursements, Co-location etc. \n\
            What implicit mores and conventions are linked to the activity? Priority, Career track, Professional jargon etc.",
            de: "Welche spezifischen Strategien und Regeln sind mit der Aktivität verbunden? Leitlinien, Genehmigungen, Erstattungen, gemeinsame Unterbringung usw. \n\
            Welche impliziten Sitten und Gebräuche sind mit der Tätigkeit verbunden? Vorrang, Laufbahn, Fachjargon usw.",
            sv: "Vilka specifika policyer och regler är kopplade till aktiviteten? Riktlinjer, auktorisation, ersättningar, samlokalisering etc. \n\
            Vilka underförstådda sedvänjor och konventioner är kopplade till aktiviteten? Prioritet, karriärväg, professionell jargong etc.",
        },
        division_of_labour: {
            en: "How can different people contribute to the activity? Hierarchy, Role, Leadership, Territorial attitude etc.",
            de: "Wie können verschiedene Personen zu der Aktivität beitragen? Hierarchie, Rolle, Führung, territoriales Verhalten usw.",
            sv: "Hur kan olika personer bidra till aktiviteten? Hierarki, roll, ledarskap, territoriell attityd etc.",
        },
    },
    feedbackpage: {
        description: {
            en: "Scan to give feedback for this activity.",
            de: "Scannen, um Feedback zu dieser Aktivität zu geben.",
            sv: "Skanna för att ge feedback på denna aktivitet.",
        },
        thankYou: {
            en: "Thanks for your feedback!",
            de: "Danke für Ihr Feedback!",
            sv: "Tack för din feedback!",
        },
        thankYouSubtext: {
            en: "You may now close the page or return to the main site.",
            de: "Sie können die Seite jetzt schließen oder zur Startseite zurückkehren.",
            sv: "Du kan nu stänga sidan eller återvända till huvudsidan.",
        },
    },
};
