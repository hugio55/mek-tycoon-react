"use client";

import { useState } from "react";
import StarfieldCanvas from "./StarfieldCanvas";
import CompactDebugPanel from "./CompactDebugPanel";

type AnimationMode = "forward" | "asteroidBelt";

export interface StarfieldDebugControls {
  logoScale: number;
  logoVerticalOffset: number;
  fontFamily: string;
}

interface StarfieldWithControlsProps {
  onDebugControlsChange?: (controls: StarfieldDebugControls) => void;
}

export default function StarfieldWithControls({ onDebugControlsChange }: StarfieldWithControlsProps) {
  // Starfield controls
  const [mode, setMode] = useState<AnimationMode>("forward");
  const [speed, setSpeed] = useState(1.0);
  const [scale, setScale] = useState(1.0);
  const [density, setDensity] = useState(1.0);

  // Logo controls
  const [logoScale, setLogoScale] = useState(1.0);
  const [logoVerticalOffset, setLogoVerticalOffset] = useState(0);

  // Font controls
  const [fontFamily, setFontFamily] = useState('Orbitron');

  // Notify parent of debug control changes
  const handleLogoScaleChange = (value: number) => {
    setLogoScale(value);
    onDebugControlsChange?.({ logoScale: value, logoVerticalOffset, fontFamily });
  };

  const handleLogoVerticalOffsetChange = (value: number) => {
    setLogoVerticalOffset(value);
    onDebugControlsChange?.({ logoScale, logoVerticalOffset: value, fontFamily });
  };

  const handleFontFamilyChange = (value: string) => {
    setFontFamily(value);
    onDebugControlsChange?.({ logoScale, logoVerticalOffset, fontFamily: value });
  };

  return (
    <>
      <StarfieldCanvas
        mode={mode}
        speed={speed}
        scale={scale}
        density={density}
      />
      <CompactDebugPanel
        starMode={mode}
        starSpeed={speed}
        starScale={scale}
        starDensity={density}
        onStarModeChange={setMode}
        onStarSpeedChange={setSpeed}
        onStarScaleChange={setScale}
        onStarDensityChange={setDensity}
        logoScale={logoScale}
        logoVerticalOffset={logoVerticalOffset}
        onLogoScaleChange={handleLogoScaleChange}
        onLogoVerticalOffsetChange={handleLogoVerticalOffsetChange}
        fontFamily={fontFamily}
        onFontFamilyChange={handleFontFamilyChange}
      />
    </>
  );
}
