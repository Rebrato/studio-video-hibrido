export type AspectRatio = "16:9" | "9:16" | "1:1";

export type Scene = {
  id: string;
  durationInSeconds: number;
  aspectRatio: AspectRatio | string;
  aiGeneration: {
    imageModel: string;
    videoModel: string;
    /** Sua própria imagem: caminho em entradas/ (ex.: "entradas/foto.jpg") ou URL. */
    baseImage?: string;
    /** "animate" = anima sua imagem como está; "reference" = cria uma imagem nova inspirada nela. */
    baseImageMode?: "animate" | "reference";
    /** Só no modo "reference": 0.1 = quase igual à original, 0.9 = muito diferente. */
    referenceStrength?: number;
    cinematicSpec: {
      subject: string;
      cameraMovement: string;
      lens: string;
      lighting: string;
      colorGrade: string;
      negativePrompt: string;
    };
  };
  remotionOverlay: {
    headline: string;
    subheadline: string;
    themeColor: string;
  };
};

export const SIZES: Record<AspectRatio, [number, number]> = {
  "16:9": [1920, 1080],
  "9:16": [1080, 1920],
  "1:1": [1080, 1080],
};

export const sizeFor = (ratio: string): [number, number] =>
  SIZES[ratio as AspectRatio] ?? SIZES["16:9"];
