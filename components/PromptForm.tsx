"use client";

import { useMemo, useState } from "react";

export type PromptFormValues = {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: string; // e.g., "16:9"
  durationSeconds: number; // 1..60
  fps: number; // 24, 30, 60
  resolution: string; // "7680x4320" for 8K
  seed?: number | null;
};

export default function PromptForm({ onSubmit, disabled }: { onSubmit: (values: PromptFormValues) => Promise<void>; disabled?: boolean; }) {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [durationSeconds, setDurationSeconds] = useState(8);
  const [fps, setFps] = useState(24);
  const [resolution, setResolution] = useState("7680x4320");
  const [seed, setSeed] = useState<string>("");

  const canSubmit = useMemo(() => prompt.trim().length > 3 && !disabled, [prompt, disabled]);

  return (
    <form className="vstack" onSubmit={(e) => {
      e.preventDefault();
      if (!canSubmit) return;
      onSubmit({
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        aspectRatio,
        durationSeconds,
        fps,
        resolution,
        seed: seed ? Number(seed) : undefined,
      });
    }}>
      <div>
        <label>Prompt</label>
        <textarea placeholder="Describe your cinematic scene..."
          value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      </div>

      <div>
        <label>Negative Prompt <span className="helper">(optional)</span></label>
        <input type="text" placeholder="Things to avoid (e.g., blur, artifacts)"
          value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} />
      </div>

      <div className="row">
        <div>
          <label>Aspect Ratio</label>
          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="1:1">1:1</option>
            <option value="2.39:1">2.39:1 (cinema)</option>
          </select>
        </div>
        <div>
          <label>FPS</label>
          <select value={fps} onChange={(e) => setFps(Number(e.target.value))}>
            <option value={24}>24</option>
            <option value={30}>30</option>
            <option value={60}>60</option>
          </select>
        </div>
      </div>

      <div className="row">
        <div>
          <label>Duration (seconds)</label>
          <input type="text" inputMode="numeric" placeholder="8" value={durationSeconds}
            onChange={(e) => setDurationSeconds(Math.max(1, Math.min(60, Number(e.target.value) || 1)))} />
        </div>
        <div>
          <label>Resolution</label>
          <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
            <option value="7680x4320">8K (7680x4320)</option>
            <option value="3840x2160">4K (3840x2160)</option>
            <option value="1920x1080">1080p (1920x1080)</option>
          </select>
        </div>
      </div>

      <div className="row">
        <div>
          <label>Seed <span className="helper">(optional)</span></label>
          <input type="text" inputMode="numeric" placeholder="Random" value={seed}
            onChange={(e) => setSeed(e.target.value)} />
        </div>
        <div>
          <label>&nbsp;</label>
          <button className="button" type="submit" disabled={!canSubmit}>Generate</button>
        </div>
      </div>
    </form>
  );
}
