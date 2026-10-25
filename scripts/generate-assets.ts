import "dotenv/config";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fal } from "@fal-ai/client";
import { loadScene, sceneArg } from "./lib/scenes";

const { scene, file } = loadScene(sceneArg());
const imageOnly = process.argv.includes("--so-imagem");
const ai = scene.aiGeneration;
const spec = ai.cinematicSpec;

const key = process.env.FAL_KEY?.trim();
if (!key || key === "COLE_SUA_CHAVE_AQUI") {
  console.error("❌ FAL_KEY não configurada. Cole sua chave da Fal.ai no arquivo .env e rode de novo.");
  process.exit(1);
}
fal.config({ credentials: key });

const imagePrompt = [spec.subject, spec.lens, spec.lighting, spec.colorGrade, "cinematic film still, highly detailed"].join(", ");
const videoPrompt = [spec.subject, spec.cameraMovement, spec.lighting].join(", ");
const imageSize: Record<string, string> = { "16:9": "landscape_16_9", "9:16": "portrait_16_9", "1:1": "square_hd" };
const REFERENCE_MODEL = "fal-ai/flux/dev/image-to-image";

const assetsDir = path.resolve("public/assets");
const outDir = path.resolve("out");
mkdirSync(assetsDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const onQueueUpdate = (label: string) => (u: { status: string }) => {
  if (u.status !== "COMPLETED") process.stdout.write(`   ${label}: ${u.status}        \r`);
};

async function download(url: string, destNoExt: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar ${url}: ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  const ext = type.includes("png") ? ".png" : type.includes("webp") ? ".webp" : type.includes("mp4") ? ".mp4" : ".jpg";
  const dest = destNoExt + ext;
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

/** Sobe uma imagem local (entradas/...) para a Fal.ai e devolve a URL. URLs passam direto. */
async function resolveBaseImage(src: string): Promise<string> {
  if (/^https?:\/\//.test(src)) return src;
  const local = path.resolve(src);
  if (!existsSync(local)) throw new Error(`Imagem base não encontrada: ${src}`);
  const ext = path.extname(local).toLowerCase();
  const type = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  console.log(`📤 Enviando sua imagem ${src} para a Fal.ai...`);
  return fal.storage.upload(new Blob([readFileSync(local)], { type }));
}

async function makeKeyframe(): Promise<string> {
  // 1) Sua imagem, animada como está
  if (ai.baseImage && (ai.baseImageMode ?? "animate") === "animate") {
    return resolveBaseImage(ai.baseImage);
  }

  // 2) Sua imagem como referência para uma imagem nova
  if (ai.baseImage && ai.baseImageMode === "reference") {
    const ref = await resolveBaseImage(ai.baseImage);
    console.log(`🖼️  Criando imagem nova a partir da sua referência (${REFERENCE_MODEL})...`);
    const r = await fal.subscribe(REFERENCE_MODEL, {
      input: { image_url: ref, prompt: imagePrompt, strength: ai.referenceStrength ?? 0.6 },
      onQueueUpdate: onQueueUpdate("imagem"),
    });
    const url = (r.data as { images?: { url: string }[] }).images?.[0]?.url;
    if (!url) throw new Error("O modelo de imagem não retornou nenhuma URL.");
    return url;
  }

  // 3) Imagem criada do zero a partir do texto
  console.log(`🖼️  Gerando imagem com ${ai.imageModel}...`);
  const r = await fal.subscribe(ai.imageModel, {
    input: { prompt: imagePrompt, image_size: imageSize[scene.aspectRatio] ?? "landscape_16_9", num_images: 1 },
    onQueueUpdate: onQueueUpdate("imagem"),
  });
  const url = (r.data as { images?: { url: string }[] }).images?.[0]?.url;
  if (!url) throw new Error("O modelo de imagem não retornou nenhuma URL.");
  return url;
}

async function main() {
  console.log(`🎬 Cena: ${scene.id} (${file})`);
  const imageUrl = await makeKeyframe();
  const saved = await download(imageUrl, path.join(assetsDir, `${scene.id}-keyframe`));
  const imageCopy = path.join(outDir, `${scene.id}-imagem${path.extname(saved)}`);
  copyFileSync(saved, imageCopy);
  console.log(`\n   ✔ Imagem salva: ${path.relative(process.cwd(), imageCopy)}`);

  if (imageOnly) {
    console.log("✅ Modo só imagem: nenhum vídeo foi gerado.");
    return;
  }

  console.log(`🎥 Gerando vídeo com ${ai.videoModel} (pode levar alguns minutos)...`);
  const v = await fal.subscribe(ai.videoModel, {
    input: {
      prompt: videoPrompt,
      image_url: imageUrl,
      duration: scene.durationInSeconds <= 5 ? "5" : "10",
      aspect_ratio: scene.aspectRatio,
      negative_prompt: spec.negativePrompt,
    },
    onQueueUpdate: onQueueUpdate("vídeo"),
  });
  const videoUrl = (v.data as { video?: { url: string } }).video?.url;
  if (!videoUrl) throw new Error("O modelo de vídeo não retornou nenhuma URL.");
  await download(videoUrl, path.join(assetsDir, scene.id));
  console.log(`\n✅ Vídeo de fundo salvo: public/assets/${scene.id}.mp4. Agora rode: npm run render -- ${scene.id}`);
}

main().catch((err) => {
  console.error("\n❌ Erro na geração:", err?.body ?? err?.message ?? err);
  process.exit(1);
});
