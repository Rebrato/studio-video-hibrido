import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import scene from "../prompts/cena-01.json";

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { headline, subheadline, themeColor } = scene.remotionOverlay;

  // Entrada do card
  const enter = spring({ frame: frame - 10, fps, config: { damping: 18, stiffness: 90 } });
  const cardY = interpolate(enter, [0, 1], [80, 0]);
  const cardBlur = interpolate(enter, [0, 1], [12, 0]);

  // Barra de destaque cresce depois do card
  const bar = spring({ frame: frame - 25, fps, config: { damping: 200 } });

  // Textos entram escalonados
  const headlineIn = spring({ frame: frame - 20, fps, config: { damping: 20 } });
  const subIn = spring({ frame: frame - 32, fps, config: { damping: 20 } });

  // Saída suave no fim
  const exit = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Zoom lento no fundo (efeito Ken Burns)
  const bgScale = interpolate(frame, [0, durationInFrames], [1.05, 1.15]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${bgScale})` }}>
        <OffthreadVideo src={staticFile("assets/cena-01.mp4")} muted />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: "linear-gradient(90deg, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.35) 55%, rgba(2,6,23,0) 100%)",
        }}
      />

      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 140, opacity: exit }}>
        <div
          style={{
            width: 1000,
            padding: "56px 64px",
            borderRadius: 28,
            background: "rgba(15, 23, 42, 0.55)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: `0 30px 80px rgba(0,0,0,0.45), 0 0 60px ${themeColor}22`,
            backdropFilter: "blur(18px)",
            transform: `translateY(${cardY}px)`,
            filter: `blur(${cardBlur}px)`,
            opacity: enter,
            fontFamily: "Inter, -apple-system, Helvetica Neue, Arial, sans-serif",
          }}
        >
          <div
            style={{
              height: 6,
              width: 140 * bar,
              borderRadius: 3,
              background: themeColor,
              marginBottom: 32,
              boxShadow: `0 0 24px ${themeColor}`,
            }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: 84,
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: -2,
              color: "#f8fafc",
              opacity: headlineIn,
              transform: `translateX(${interpolate(headlineIn, [0, 1], [-30, 0])}px)`,
            }}
          >
            {headline}
          </h1>
          <p
            style={{
              margin: "24px 0 0",
              fontSize: 36,
              lineHeight: 1.35,
              fontWeight: 400,
              color: "#cbd5e1",
              opacity: subIn,
              transform: `translateX(${interpolate(subIn, [0, 1], [-30, 0])}px)`,
            }}
          >
            {subheadline}
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
