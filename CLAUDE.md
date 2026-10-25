# Estúdio Híbrido de Vídeo

Pipeline: **JSON de cena (prompts/) → Fal.ai gera keyframe + vídeo → Remotion sobrepõe motion graphics → MP4 final.**

## Papéis do Claude neste projeto

### 1. Diretor de Fotografia — `prompts/`
- Cada cena é um JSON técnico: `prompts/cena-XX.json`.
- Campos obrigatórios: `id`, `durationInSeconds`, `aspectRatio`, `aiGeneration` (`imageModel`, `videoModel`, `cinematicSpec`) e `remotionOverlay` (`headline`, `subheadline`, `themeColor`).
- `cinematicSpec` sempre preenche: `subject`, `cameraMovement`, `lens`, `lighting`, `colorGrade`, `negativePrompt` — em inglês, linguagem de set de filmagem.
- Use `fal-ai/flux/schnell` para testes baratos e `fal-ai/flux-pro/v1.1` para a versão final.

### 2. Motion Designer — `src/`
- Composições React + TypeScript, registradas em `src/Root.tsx`.
- Vídeos de fundo vêm de `public/assets/` e são SEMPRE renderizados com `<OffthreadVideo src={staticFile("assets/<id>.mp4")} />` (nunca `<Video>` nem `<video>`).
- Animações só com `useCurrentFrame`, `spring` e `interpolate` (nada de CSS transitions / `setTimeout`).
- Textos do overlay vêm do JSON da cena, não ficam fixos no componente.

## Comandos
| Comando | O que faz |
|---|---|
| `npm run dev` | Abre o Remotion Studio (preview no navegador) |
| `npm run generate:mock` | Gera `public/assets/cena-01.mp4` grátis via FFmpeg local (`ffmpeg-static`) |
| `npm run generate:ai` | Gera o vídeo real via Fal.ai (gasta créditos, exige `FAL_KEY` no `.env`) |
| `npm run render` | Renderiza `out/video-final.mp4` |

## Regras
- Nunca commitar `.env` nem MP4s (já no `.gitignore`).
- Sempre validar com `generate:mock` + `render` antes de gastar créditos de API.
- Mac Intel: não usar Homebrew; o FFmpeg vem do pacote `ffmpeg-static`.

## Compatibilidade deste Mac (Intel, macOS 13 Ventura)
- **Remotion fixado em `4.0.438`** (versão exata, sem `^`). Da 4.0.439 em diante o FFmpeg interno do Remotion exige macOS 14+ e o render quebra com `dyld: Symbol not found: _AVCaptureDeviceTypeContinuityCamera`. Não atualizar enquanto o Mac estiver no macOS 13. Todos os pacotes `@remotion/*` devem ter a MESMA versão.
- **TypeScript na linha 5.x**: o TypeScript 7 não tem a API JS que o bundler do Remotion 4.0.438 usa.
- `ffmpeg-static` precisa de permissão de install script (`npm install-scripts approve ffmpeg-static`) para baixar o binário.
