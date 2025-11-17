"use client";

import { useCallback, useMemo, useState } from "react";
import PromptForm from "@/components/PromptForm";
import VideoResult from "@/components/VideoResult";

export default function Page() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const reset = useCallback(() => {
    setJobId(null);
    setVideoUrl(null);
    setStatus("");
  }, []);

  const poll = useCallback(async (operationName: string) => {
    let attempts = 0;
    const maxAttempts = 60; // up to ~5 min if 5s interval
    while (attempts < maxAttempts) {
      attempts += 1;
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.status) setStatus(data.status);
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setIsLoading(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
    throw new Error("Timeout waiting for video");
  }, []);

  const onSubmit = useCallback(async (form: {
    prompt: string;
    negativePrompt?: string;
    aspectRatio: string;
    durationSeconds: number;
    fps: number;
    resolution: string;
    seed?: number | null;
  }) => {
    try {
      reset();
      setIsLoading(true);
      setStatus("Submitting job to Veo 3.1...");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setIsLoading(false);
        return;
      }
      if (data.operationName) {
        setJobId(data.operationName);
        setStatus("Generation in progress...");
        await poll(data.operationName);
        return;
      }
      throw new Error("Invalid response from server");
    } catch (err: any) {
      setIsLoading(false);
      setStatus(err?.message || "Unexpected error");
    }
  }, [poll, reset]);

  const disabled = useMemo(() => isLoading, [isLoading]);

  return (
    <div className="container">
      <div className="header">
        <div className="hstack">
          <span className="badge">Google Veo 3.1</span>
          <div className="title">AI Video Generator ? 8K Cinematic</div>
        </div>
        <a className="button secondary" href="https://agentic-48c47d06.vercel.app" target="_blank" rel="noreferrer">Open Prod</a>
      </div>

      <div className="grid">
        <div className="card">
          <PromptForm onSubmit={onSubmit} disabled={disabled} />
        </div>

        <div className="vstack" style={{ gap: 16 }}>
          <div className="card">
            <div className="hstack" style={{ justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Result</div>
                <div className="helper">{status || (videoUrl ? 'Done' : 'Awaiting prompt')}</div>
              </div>
              {isLoading && <span className="spinner" />}
            </div>
            <div style={{ height: 12 }} />
            <div className="videoWrap">
              <VideoResult videoUrl={videoUrl} />
            </div>
            <div style={{ height: 12 }} />
            <div className="hstack">
              <button className="button secondary" onClick={reset} disabled={isLoading}>Reset</button>
              {videoUrl && (
                <a className="button" href={videoUrl} download target="_blank" rel="noreferrer">Download</a>
              )}
            </div>
          </div>

          {jobId && (
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Job</div>
              <div className="helper">Operation: {jobId}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
