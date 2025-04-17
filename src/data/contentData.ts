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
        community: 'Samhälle',
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
            }
        },
        texts: {
            editor: {
                header: {
                    en: "Add Note to selected points:",
                    de: "Notiz zu den ausgewählten Punkten hinzufügen:",
                    sv: "Lägg till anteckning till valda punkter:",
                }
            }
        }
    }
}
