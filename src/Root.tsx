import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { scenes } from "./scenes.generated";
import { sizeFor } from "./types";

const FPS = 30;

export const RemotionRoot: React.FC = () => (
  <>
    {scenes.map((scene) => {
      const [width, height] = sizeFor(scene.aspectRatio);
      return (
        <Composition
          key={scene.id}
          id={scene.id}
          component={MainVideo}
          durationInFrames={Math.round(scene.durationInSeconds * FPS)}
          fps={FPS}
          width={width}
          height={height}
          defaultProps={{ scene }}
        />
      );
    })}
  </>
);
