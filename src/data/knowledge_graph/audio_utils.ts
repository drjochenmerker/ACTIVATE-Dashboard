
// /**
//  * Interface defines the structure of the speaker mapping object.
//  * Keys are the placeholders (e.g., "speaker_01") and values are the roles (e.g., "nurse01").
//  */
// interface SpeakerMap {
//   [key: string]: string;
// }

// /**
//  * Replaces speaker placeholders in a transcript string with specific roles.
//  * * @param transcript - The raw transcript string.
//  * @param mapping - An object mapping speaker IDs to roles.
//  * @returns The formatted transcript with roles replaced.
//  */
// export function replaceSpeakerRoles(transcript: string, mapping: SpeakerMap): string {
//   // Regex explanation:
//   // \b        -> Word boundary (ensures we don't match parts of other words)
//   // SPEAKER_  -> Literal match for the prefix
//   // \d+       -> Matches one or more digits (01, 02, etc.)
//   // /gi       -> Flags: Global (all occurrences) and Case Insensitive
//   const regex = /\bSPEAKER_\d+\b/gi;

//   return transcript.replace(regex, (match) => {
//     // Normalize the found match to lowercase to look it up in the mapping
//     // (Ensure 'SPEAKER_01' finds 'speaker_01' in your object)
//     const key = match.toLowerCase();

//     // Return the mapped role if it exists, otherwise return the original text
//     return mapping[key] || match;
//   });
// }

// // --- Usage Example ---

// // 1. The Transcript String
// const rawTranscript = `
// [0.94s - 84.58s] SPEAKER_02: ich bin arzt. Ähm, ja, ich weiß nicht...
// [85.46s - 234.21s] SPEAKER_01: ich bin physiotherapist. hm, gehen können...
// `;

// // 2. The Mapping Object
// // Note: We use lowercase keys here to ensure matches work regardless of input casing
// const speakerMapping: SpeakerMap = {
//   "speaker_01": "Nurse01",
//   "speaker_02": "Physiotherapist02"
// };

// // 3. Execute
// const result = replaceSpeakerRoles(rawTranscript, speakerMapping);

// console.log(result);