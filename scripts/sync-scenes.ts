// Gera src/scenes.generated.ts com todas as cenas de prompts/ e prompts/privados/.
import { readFileSync, writeFileSync } from "node:fs";
import { listSceneFiles, SCENE_ID } from "./lib/scenes";

const files = listSceneFiles().filter((f) => {
  const { id } = JSON.parse(readFileSync(f, "utf8"));
  if (!SCENE_ID.test(id ?? "")) {
    console.warn(`⚠️  Ignorando ${f}: "id" inválido (use letras sem acento, números e hífen).`);
    return false;
  }
  return true;
});

const lines = [
  "// Arquivo gerado automaticamente por scripts/sync-scenes.ts. Não editar.",
  'import type { Scene } from "./types";',
  ...files.map((f, i) => `import s${i} from "../${f}";`),
  "",
  `export const scenes = [${files.map((_, i) => `s${i}`).join(", ")}] as Scene[];`,
  "",
];
writeFileSync("src/scenes.generated.ts", lines.join("\n"));
console.log(`🎞️  ${files.length} cena(s) registradas.`);
