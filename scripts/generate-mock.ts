import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { loadScene, sceneArg } from "./lib/scenes";
import { sizeFor } from "../src/types";

if (!ffmpegPath) throw new Error("ffmpeg-static não encontrou um binário para este sistema.");

const { scene } = loadScene(sceneArg());
const [w, h] = sizeFor(scene.aspectRatio);
const outDir = path.resolve("public/assets");
const outFile = path.join(outDir, `${scene.id}.mp4`);
mkdirSync(outDir, { recursive: true });

// Fundo escuro elegante: gradiente azul-petróleo que "respira" + leve vinheta e grão.
const filter = [
  "geq=",
  "r='12+10*sin(2*PI*(X/W+T/5))':",
  "g='20+18*sin(2*PI*(Y/H+T/5)+1)':",
  "b='38+30*sin(2*PI*((X+Y)/(W+H)+T/5)+2)'",
  ",vignette=PI/4,noise=alls=4:allf=t,format=yuv420p",
].join("");

const cmd = [
  `"${ffmpegPath}" -y -loglevel error -f lavfi`,
  `-i color=c=black:s=${w}x${h}:r=30:d=${scene.durationInSeconds}`,
  `-vf "${filter}" -c:v libx264 -preset veryfast -crf 23 -movflags +faststart`,
  `"${outFile}"`,
].join(" ");

console.log(`🎬 Gerando vídeo mock para ${scene.id} (${w}x${h}, ${scene.durationInSeconds}s)...`);
execSync(cmd, { stdio: "inherit" });
console.log(`✅ Mock pronto: public/assets/${scene.id}.mp4`);
