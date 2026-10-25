import { execSync } from "node:child_process";
import { loadScene, sceneArg } from "./lib/scenes";

const { scene } = loadScene(sceneArg());
execSync("tsx scripts/sync-scenes.ts", { stdio: "inherit" });
execSync(`npx remotion render ${scene.id} out/${scene.id}.mp4`, { stdio: "inherit" });
console.log(`✅ Vídeo final: out/${scene.id}.mp4`);
