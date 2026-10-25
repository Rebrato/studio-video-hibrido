import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Scene } from "../../src/types";

export const SCENE_ID = /^[a-zA-Z0-9-]+$/;
const DIRS = ["prompts", "prompts/privados"];

/** Lista todos os JSON de cena (públicos e privados). */
export function listSceneFiles(): string[] {
  return DIRS.flatMap((dir) =>
    existsSync(dir)
      ? readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => path.join(dir, f))
      : [],
  );
}

/** Aceita um id ("cena-02") ou caminho ("prompts/cena-02.json"). Padrão: cena-01. */
export function loadScene(arg = "cena-01"): { scene: Scene; file: string } {
  const candidates = arg.endsWith(".json") ? [arg] : DIRS.map((d) => path.join(d, `${arg}.json`));
  const file = candidates.find((c) => existsSync(c));
  if (!file) {
    console.error(`❌ Cena "${arg}" não encontrada em prompts/ nem em prompts/privados/.`);
    process.exit(1);
  }
  const scene: Scene = JSON.parse(readFileSync(file, "utf8"));
  if (!SCENE_ID.test(scene.id)) {
    console.error(`❌ O "id" da cena em ${file} só pode ter letras sem acento, números e hífen.`);
    process.exit(1);
  }
  return { scene, file };
}

/** Primeiro argumento que não é flag (--algo). */
export const sceneArg = () => process.argv.slice(2).find((a) => !a.startsWith("--"));
