import rdf from "rdf-ext";
import ParserN3 from "@rdfjs/parser-n3";
import { DatasetCore, NamedNode, Quad } from "@rdfjs/types";
import { Readable } from "stream";
import fs from "fs/promises";


interface Activity {
  name: string;
  subject: string | null;
  object: string | null;
  community: string | null;
  tools: string[];
  rules: string[];
}

interface ActivitiesJSON {
  activities: Activity[];
}

function stringToStream(input: string): Readable {
  return Readable.from([input]);
}

function extractLocalName(uri: string): string {
  return uri.split("/").pop() || uri; // Nimmt den letzten Teil nach dem letzten "/"
}

async function saveJSONToFile(data: ActivitiesJSON, filePath: string): Promise<void> {
  try {
    const jsonString = JSON.stringify(data, null, 2); // JSON in einen lesbaren String umwandeln
    await fs.writeFile(filePath, jsonString, "utf8"); // Datei schreiben
    console.log(`JSON erfolgreich unter ${filePath} gespeichert.`);
  } catch (error) {
    console.error(`Fehler beim Speichern der Datei: ${error}`);
  }
}

// Hilfsfunktion zur Extraktion von Werten aus Quads
function getQuadValue(
  dataset: DatasetCore,
  subject: NamedNode,
  predicateUri: string
): string | null {
  const quad = Array.from(dataset.match(subject, rdf.namedNode(predicateUri)))[0];
  return quad ? extractLocalName(quad.object.value) : null;
}

// Hauptfunktion
async function parseTurtleToJSON(turtleFilePath: string): Promise<ActivitiesJSON> {
  // Turtle-Daten einlesen
  const turtleData = await fs.readFile(turtleFilePath, "utf-8");

  // RDF-Dataset und Parser initialisieren
  const parser = new ParserN3();
  const dataset: DatasetCore = rdf.dataset();

  // Turtle-Daten in das Dataset parsen
  await new Promise<void>((resolve, reject) => {
    parser
      .import(stringToStream(turtleData))
      .on("data", (quad: Quad) => dataset.add(quad))
      .on("end", resolve)
      .on("error", reject);
  });

  const activities: Activity[] = [];


  // Aktivitäten aus dem Dataset extrahieren
  for (const quad of dataset.match(
    null,
    rdf.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
    rdf.namedNode("http://www.semanticweb.org/tobia/ontologies/2024/10/Activity_Theory/Activity")
  )) {
    const subjectNode = quad.subject as NamedNode;

    const activity: Activity = {
      name: extractLocalName(subjectNode.value), // Aktivitätsname extrahieren
      subject: getQuadValue(
        dataset,
        subjectNode,
        "http://www.semanticweb.org/tobia/ontologies/2024/10/Activity_Theory/hasSubject"
      ),
      object: getQuadValue(
        dataset,
        subjectNode,
        "http://www.semanticweb.org/tobia/ontologies/2024/10/Activity_Theory/hasObject"
      ),
      community: getQuadValue(
        dataset,
        subjectNode,
        "http://www.semanticweb.org/tobia/ontologies/2024/10/Activity_Theory/hasCommunity"
      ),
      tools: Array.from(dataset.match(
          subjectNode,
          rdf.namedNode("http://www.semanticweb.org/tobia/ontologies/2024/10/Activity_Theory/hasTools")
        ))
        .map((toolQuad) => extractLocalName(toolQuad.object.value)),
      rules: Array.from(dataset.match(
          subjectNode,
          rdf.namedNode("http://www.semanticweb.org/tobia/ontologies/2024/10/Activity_Theory/hasRules")
        ))
        .map((ruleQuad) => extractLocalName(ruleQuad.object.value)),
    };

    activities.push(activity);
  }

  return { activities };
}

(async () => {
  const turtleFilePath = "../assets/data/Beispieldaten.ttl";
  const jsonOutputPath = "../assets/data/Beispieldaten.json";

  try {
    const result = await parseTurtleToJSON(turtleFilePath);
    console.log(JSON.stringify(result, null, 2));
    await saveJSONToFile(result, jsonOutputPath); // JSON speichern
  } catch (error) {
    console.error("Fehler beim Parsen der Turtle-Datei:", error);
  }
})();
