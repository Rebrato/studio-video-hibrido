# Estúdio Híbrido de Vídeo

Pipeline: **JSON de cena (prompts/) → Fal.ai gera keyframe + vídeo → Remotion sobrepõe motion graphics → MP4 final.**

## Papéis do Claude neste projeto

### 1. Diretor de Fotografia — `prompts/`
- Cada cena é um JSON técnico: `prompts/cena-XX.json`.
- Campos obrigatórios: `id`, `durationInSeconds`, `aspectRatio`, `aiGeneration` (`imageModel`, `videoModel`, `cinematicSpec`) e `remotionOverlay` (`headline`, `subheadline`, `themeColor`).
- `cinematicSpec` sempre preenche: `subject`, `cameraMovement`, `lens`, `lighting`, `colorGrade`, `negativePrompt` — em inglês, linguagem de set de filmagem.
- Use `fal-ai/flux/schnell` para testes baratos e `fal-ai/flux-pro/v1.1` para a versão final.
- Imagem própria do usuário: arquivo em `entradas/` (ignorada pelo Git) referenciado em `aiGeneration.baseImage`. `baseImageMode: "animate"` anima a imagem como está; `"reference"` cria uma imagem nova inspirada nela (`fal-ai/flux/dev/image-to-image`, intensidade em `referenceStrength`, 0.1 a 0.9).

### 2. Motion Designer — `src/`
- Composições React + TypeScript, registradas em `src/Root.tsx`.
- Cada JSON em `prompts/` ou `prompts/privados/` vira automaticamente uma composição com o mesmo `id` (via `scripts/sync-scenes.ts` → `src/scenes.generated.ts`, arquivo gerado e ignorado pelo Git). O `id` só aceita letras sem acento, números e hífen, e deve ser igual ao nome do arquivo.
- Tamanho vem de `aspectRatio` (`16:9`, `9:16`, `1:1`) e duração de `durationInSeconds` (o Kling aceita 5 ou 10 s).
- Vídeos de fundo vêm de `public/assets/<id>.mp4` e são SEMPRE renderizados com `<OffthreadVideo src={staticFile(`assets/${scene.id}.mp4`)} />` (nunca `<Video>` nem `<video>`).
- Animações só com `useCurrentFrame`, `spring` e `interpolate` (nada de CSS transitions / `setTimeout`).
- Textos do overlay vêm do JSON da cena, não ficam fixos no componente.

## Comandos
| Comando | O que faz |
|---|---|
| `npm run dev` | Abre o Remotion Studio (preview no navegador) com todas as cenas |
| `npm run generate:mock -- <id>` | Vídeo de fundo grátis via FFmpeg local (`ffmpeg-static`) |
| `npm run generate:image -- <id>` | Só a imagem via Fal.ai → `out/<id>-imagem.jpg` (barato) |
| `npm run generate:ai -- <id>` | Imagem + vídeo via Fal.ai (gasta créditos, exige `FAL_KEY` no `.env`) |
| `npm run render -- <id>` | Renderiza o vídeo final → `out/<id>.mp4` |

Sem `<id>`, todos usam `cena-01`.

## Regras
- Nunca commitar `.env` nem MP4s (já no `.gitignore`).
- Sempre validar com `generate:mock` + `render` antes de gastar créditos de API.
- Mac Intel: não usar Homebrew; o FFmpeg vem do pacote `ffmpeg-static`.

## Compatibilidade deste Mac (Intel, macOS 13 Ventura)
- **Remotion fixado em `4.0.438`** (versão exata, sem `^`). Da 4.0.439 em diante o FFmpeg interno do Remotion exige macOS 14+ e o render quebra com `dyld: Symbol not found: _AVCaptureDeviceTypeContinuityCamera`. Não atualizar enquanto o Mac estiver no macOS 13. Todos os pacotes `@remotion/*` devem ter a MESMA versão.
- **TypeScript na linha 5.x**: o TypeScript 7 não tem a API JS que o bundler do Remotion 4.0.438 usa.
- `ffmpeg-static` precisa de permissão de install script (`npm install-scripts approve ffmpeg-static`) para baixar o binário.

## Regras Críticas de Segurança (Repositório Público)
Este repositório é **PÚBLICO**. Tudo que for commitado fica visível para qualquer pessoa, para sempre.

- **NUNCA** escrever chaves de API, tokens ou senhas em arquivos `.ts`, `.tsx`, `.json`, `.md` ou `.yml`. Sempre ler de `process.env.NOME_DA_VARIAVEL` (carregado do `.env` via `dotenv`).
- **NUNCA** commitar `.env` nem `.env.*`. Só `.env.example` (com valores vazios) vai para o Git. Ao criar uma variável nova, adicione o nome dela vazio em `.env.example`.
- **NUNCA** usar `git add -f`, `git commit --no-verify` ou desativar o hook `pre-commit` para contornar um bloqueio. Se o hook bloquear, remova o segredo.
- **NUNCA** repetir uma chave real em respostas, logs ou comandos (`echo`, `cat .env` etc.).
- Roteiros públicos/gerais → `prompts/`. Roteiros confidenciais (clientes, campanhas não lançadas) → `prompts/privados/` (ignorada pelo Git).
- No GitHub Actions, segredos vêm só de `secrets.*` (Settings → Secrets and variables → Actions).
- Se uma chave vazar (chat, commit, log): revogar no painel do provedor e gerar outra. Apagar o commit não basta.

### Trava local (`.git/hooks/pre-commit`)
Bloqueia commits com: arquivos `.env*` (exceto `.env.example`), arquivos em `prompts/privados/`, padrões de chave (FAL, ElevenLabs, OpenAI `sk-`, GitHub `ghp_`/`github_pat_`, AWS, Google, chaves privadas PEM) e arquivos > 50MB. O hook não é versionado (fica só em `.git/hooks`): ao clonar o repositório em outra máquina, recriar o hook.

## Render na nuvem (GitHub Actions)
Workflow `.github/workflows/render.yml`, disparado manualmente (aba Actions → "Render video" → Run workflow). Com o secret `FAL_KEY` configurado, ele gera o vídeo via IA (gasta créditos). Sem ele, usa o mock grátis. O campo `scene` escolhe a cena (só cenas de `prompts/`; as privadas não existem no GitHub, e fotos de `entradas/` também não). O conteúdo de `out/` fica disponível para download como Artifact da execução.
