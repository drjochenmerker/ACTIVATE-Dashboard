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

/**
 * Adds all required entities to a specific graph using the addEntity function
 * @param graphId The graph ID where entities will be added
 */
export async function addRequiredEntitiesToGraph(graphId: string): Promise<void> {
    const data = requiredEntitiesData as RequiredEntitiesStructure;
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
