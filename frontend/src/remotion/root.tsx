import * as React from "react";
import { Composition } from "remotion";

import { DianaProjectVideo, dianaVideoDurationInFrames, dianaVideoFps } from "./video";

export function RemotionRoot() {
  return React.createElement(Composition, {
    id: "DianaProjectVideo",
    component: DianaProjectVideo,
    durationInFrames: dianaVideoDurationInFrames,
    fps: dianaVideoFps,
    width: 1920,
    height: 1080,
  });
}
