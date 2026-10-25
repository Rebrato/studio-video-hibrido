import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fal } from "@fal-ai/client";

type CinematicSpec = {
  subject: string;
  cameraMovement: string;
  lens: string;
  lighting: string;
  colorGrade: string;
  negativePrompt: string;
};

type Scene = {
  id: string;
  durationInSeconds: number;
  aspectRatio: "16:9" | "9:16" | "1:1";
  aiGeneration: {
    imageModel: string;
    videoModel: string;
    cinematicSpec: CinematicSpec;
  };
};

const sceneFile = process.argv[2] ?? "prompts/cena-01.json";
const scene: Scene = JSON.parse(readFileSync(path.resolve(sceneFile), "utf8"));

const key = process.env.FAL_KEY?.trim();
if (!key || key === "COLE_SUA_CHAVE_AQUI") {
  console.error("❌ FAL_KEY não configurada. Cole sua chave da Fal.ai no arquivo .env e rode de novo.");
  process.exit(1);
}
fal.config({ credentials: key });

const spec = scene.aiGeneration.cinematicSpec;
const imagePrompt = [spec.subject, spec.lens, spec.lighting, spec.colorGrade, "cinematic film still, highly detailed"].join(", ");
const videoPrompt = [spec.subject, spec.cameraMovement, spec.lighting].join(", ");

const imageSizeByRatio: Record<Scene["aspectRatio"], string> = {
  "16:9": "landscape_16_9",
  "9:16": "portrait_16_9",
  "1:1": "square_hd",
};

const logQueue = (label: string) => (update: { status: string }) => {
  if (update.status === "IN_QUEUE" || update.status === "IN_PROGRESS") {
    process.stdout.write(`   ${label}: ${update.status}\r`);
  }
};

async function download(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar ${url}: ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const assetsDir = path.resolve("public/assets");
  mkdirSync(assetsDir, { recursive: true });

  // 1) Keyframe
  console.log(`🖼️  Gerando keyframe com ${scene.aiGeneration.imageModel}...`);
  const img = await fal.subscribe(scene.aiGeneration.imageModel, {
    input: {
      prompt: imagePrompt,
      image_size: imageSizeByRatio[scene.aspectRatio],
      num_images: 1,
    },
    logs: true,
    onQueueUpdate: logQueue("imagem"),
  });
  const imageUrl: string | undefined = (img.data as { images?: { url: string }[] }).images?.[0]?.url;
  if (!imageUrl) throw new Error("O modelo de imagem não retornou nenhuma URL.");
  await download(imageUrl, path.join(assetsDir, `${scene.id}-keyframe.jpg`));
  console.log(`\n   ✔ Keyframe salvo: public/assets/${scene.id}-keyframe.jpg`);

  // 2) Image-to-Video
  console.log(`🎥 Gerando vídeo com ${scene.aiGeneration.videoModel} (pode levar alguns minutos)...`);
  const vid = await fal.subscribe(scene.aiGeneration.videoModel, {
    input: {
      prompt: videoPrompt,
      image_url: imageUrl,
      duration: scene.durationInSeconds <= 5 ? "5" : "10",
      aspect_ratio: scene.aspectRatio,
      negative_prompt: spec.negativePrompt,
    },
    logs: true,
    onQueueUpdate: logQueue("vídeo"),
  });
  const videoUrl: string | undefined = (vid.data as { video?: { url: string } }).video?.url;
  if (!videoUrl) throw new Error("O modelo de vídeo não retornou nenhuma URL.");

  const outFile = path.join(assetsDir, `${scene.id}.mp4`);
  await download(videoUrl, outFile);
  console.log(`\n✅ Vídeo salvo: public/assets/${scene.id}.mp4 — rode "npm run render".`);
}

main().catch((err) => {
  console.error("❌ Erro na geração:", err?.body ?? err);
  process.exit(1);
});
