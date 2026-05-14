import { KnowledgeGraphActivityClass, LanguageCode } from "./structures";
import { addEntity } from "./write_operations";
import requiredEntitiesData from "./requiredEntities.json" with { type: 'json' };

export interface RequiredEntity {
    id: string;
    labels: {
        [key: string]: string;
    };
}

export interface RequiredEntitiesStructure {
    subjects: RequiredEntity[];
    objects: RequiredEntity[];
    instruments: RequiredEntity[];
    rules: RequiredEntity[];
    communities: RequiredEntity[];
    divisionsOfLabour: RequiredEntity[];
}

function parseRequiredEntitiesOrFallback(customPredefinedEntitiesJson?: string): RequiredEntitiesStructure {
    if (!customPredefinedEntitiesJson || !customPredefinedEntitiesJson.trim()) {
        return requiredEntitiesData as RequiredEntitiesStructure;
    }

    try {
        const parsed = JSON.parse(customPredefinedEntitiesJson) as Partial<RequiredEntitiesStructure>;
        return {
            subjects: parsed.subjects ?? [],
            objects: parsed.objects ?? [],
            instruments: parsed.instruments ?? [],
            rules: parsed.rules ?? [],
            communities: parsed.communities ?? [],
            divisionsOfLabour: parsed.divisionsOfLabour ?? [],
        };
    } catch (error) {
        console.error('Invalid predefinedEntities JSON, using default requiredEntities.json', error);
        return requiredEntitiesData as RequiredEntitiesStructure;
    }
}

/**
 * Adds all required entities to a specific graph using the addEntity function
 * @param graphId The graph ID where entities will be added
 */
export async function addRequiredEntitiesToGraph(graphId: string, customPredefinedEntitiesJson?: string): Promise<void> {
    const data = parseRequiredEntitiesOrFallback(customPredefinedEntitiesJson);
    const labelLanguages: LanguageCode[] = [
        LanguageCode.Deutsch,
        LanguageCode.English,
        LanguageCode.Svenska,
    ];
    
    const classMap: { [key: string]: KnowledgeGraphActivityClass } = {
        'subjects': KnowledgeGraphActivityClass.subject,
        'objects': KnowledgeGraphActivityClass.object,
        'instruments': KnowledgeGraphActivityClass.instruments,
        'rules': KnowledgeGraphActivityClass.rules,
        'communities': KnowledgeGraphActivityClass.community,
        'divisionsOfLabour': KnowledgeGraphActivityClass.divison_of_labour
    };

    for (const [classKey, activityClass] of Object.entries(classMap)) {
        const entities = data[classKey as keyof RequiredEntitiesStructure] || [];
        for (const entity of entities) {
            try {
                for (const lang of labelLanguages) {
                    const label = entity.labels[lang];
                    if (!label) {
                        console.error(`Missing required label for entity ${entity.id} in language ${lang}`);
                        continue;
                    }
                    await addEntity(graphId, label, activityClass, lang, entity.id);
                }
            } catch (error) {
                console.error(`Failed to add required entity ${entity.id} to graph ${graphId}:`, error);
            }
        }
    }
}
