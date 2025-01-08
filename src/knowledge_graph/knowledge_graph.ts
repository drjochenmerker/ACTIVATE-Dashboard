import { readFile } from "fs";

export async function getActivities(lang: string = "de") {
  readFile("queries/getActivities.sparql", (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    let query = data.toString();
    query = query.replace("{{lang}}", lang);

    console.log(query);
  });
}