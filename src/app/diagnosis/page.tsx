"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Camera, Check, ImagePlus, LoaderCircle, RotateCcw, ShieldCheck, Sparkles, Upload, X } from "lucide-react";
import { useSensors } from "@/context/SensorContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CropAssessment = {
  likelyIssue: string;
  alternatives: string[];
  visibleSigns: string;
  nextStep: string;
  confidence: "low" | "moderate" | "high";
};

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function CropDiagnosis() {
  const { settings } = useSensors();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<CropAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clear = () => {
    setPreview(null); setFile(null); setAssessment(null); setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const selectFile = (candidate?: File) => {
    if (!candidate) return;
    if (!ACCEPTED_TYPES.includes(candidate.type)) return setError("Choose a JPEG, PNG, or WebP image.");
    if (candidate.size > MAX_BYTES) return setError("Image must be 5 MB or smaller.");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return setError("Could not read that image. Try another photo.");
      setPreview(reader.result); setFile(candidate); setAssessment(null); setError(null);
    };
    reader.onerror = () => setError("Could not read that image. Try another photo.");
    reader.readAsDataURL(candidate);
  };

  const analyze = async () => {
    if (!preview || !file) return;
    if (!navigator.onLine) return setError("You’re offline. Reconnect to screen this image; no sample result will be shown.");
    setLoading(true); setError(null); setAssessment(null);
    try {
      const response = await fetch("/api/diagnose", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoDataUri: preview, cropType: settings.cropType }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "Screening is temporarily unavailable.");
      setAssessment(payload as CropAssessment);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Screening failed. Please try again.");
    } finally { setLoading(false); }
  };

  return <div className="space-y-8 pb-8">
    <header className="max-w-3xl">
      <div className="flex flex-wrap items-center gap-2 mb-3"><Badge variant="outline" className="rounded-md"><Sparkles className="w-3 h-3 mr-1.5" />Groq vision screening</Badge><Badge variant="outline" className="rounded-md">{settings.cropType} · visual check</Badge></div>
      <h2 className="font-display text-3xl md:text-5xl font-bold text-balance">Check a crop photo</h2>
      <p className="mt-3 text-lg text-muted-foreground">Get a cautious first look at visible symptoms, plus useful next observations to take to a local agriculture expert.</p>
    </header>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
      <Card className="rounded-md border-border/70 overflow-hidden"><CardContent className="p-4 md:p-6">
        {!preview ? <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); selectFile(e.dataTransfer.files[0]); }}
          className={cn("w-full min-h-[310px] rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-4 px-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30")}>
          <span className="w-14 h-14 rounded-md grid place-items-center text-foreground">{dragging ? <Upload /> : <ImagePlus />}</span>
          <span><strong className="block font-display text-xl">Drop a clear leaf photo</strong><span className="text-sm text-muted-foreground">or browse your device · JPEG, PNG, WebP · up to 5 MB</span></span>
          <span className="text-xs text-muted-foreground">Good light · close focus · include the whole affected area</span>
        </button> : <div className="space-y-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted"><Image src={preview} alt="Selected crop for visual screening" fill unoptimized className="object-contain" />
            <button type="button" onClick={clear} aria-label="Remove selected image" className="absolute top-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-background/90 border border-border shadow-sm"><X className="w-4 h-4" /></button>
            {loading && <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm"><div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm"><LoaderCircle className="w-4 h-4 animate-spin" />Checking visible signs…</div></div>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground truncate max-w-[70%]">{file?.name}</p><Button type="button" variant="outline" className="min-h-11" onClick={() => inputRef.current?.click()}><Camera className="w-4 h-4 mr-2" />Choose another</Button></div>
          <Button onClick={analyze} disabled={loading} className="w-full min-h-12 rounded-md"><Sparkles className="w-4 h-4 mr-2" />{loading ? "Screening image…" : "Screen this photo"}</Button>
        </div>}
        <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} className="sr-only" onChange={(e) => selectFile(e.target.files?.[0])} aria-label="Choose a crop image" />
      </CardContent></Card>

      <section aria-live="polite" aria-busy={loading} className="rounded-md border border-border/70 bg-card p-5 md:p-6 min-h-[300px]">
        {error ? <div className="space-y-4"><div className="flex gap-3 text-destructive"><AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" /><div><h3 className="font-semibold">Couldn’t screen this photo</h3><p className="mt-1 text-sm">{error}</p></div></div><Button variant="outline" onClick={() => setError(null)}><RotateCcw className="w-4 h-4 mr-2" />Try again</Button></div>
          : assessment ? <div className="space-y-5"><div className="flex items-start gap-3"><span className="grid place-items-center w-10 h-10 rounded-md text-foreground"><ShieldCheck className="w-5 h-5" /></span><div><p className="text-sm text-muted-foreground font-medium">Possible finding · {assessment.confidence} confidence</p><h3 className="font-display text-xl font-bold mt-1">{assessment.likelyIssue}</h3></div></div><div><h4 className="text-sm font-medium text-muted-foreground mb-1">Visible signs</h4><p className="text-sm leading-relaxed">{assessment.visibleSigns}</p></div>{assessment.alternatives.length > 0 && <div><h4 className="text-sm font-medium text-muted-foreground mb-1">Other possibilities</h4><p className="text-sm">{assessment.alternatives.join(" · ")}</p></div>}<div className="rounded-md bg-muted/60 p-4"><h4 className="text-sm font-medium text-muted-foreground mb-1">Useful next step</h4><p className="text-sm leading-relaxed">{assessment.nextStep}</p></div><p className="text-xs text-muted-foreground border-t border-border pt-4">AI visual screening can be wrong. Compare several plants and confirm with your local extension service before taking action.</p></div>
          : <div className="h-full flex flex-col justify-center"><div className="grid place-items-center w-12 h-12 rounded-md bg-muted mb-5"><ImagePlus className="w-5 h-5 text-muted-foreground" /></div><p className="text-sm text-muted-foreground font-medium">Your assessment</p><h3 className="font-display text-2xl font-bold mt-1">Evidence first.</h3><p className="text-sm text-muted-foreground mt-2 leading-relaxed">Upload a photo to screen for visible signs. If the image is ambiguous, the tool will say so instead of inventing a diagnosis.</p><div className="mt-6 space-y-3 text-sm text-muted-foreground"><p className="flex gap-2"><Check className="w-4 h-4 text-primary shrink-0" />Alternative explanations</p><p className="flex gap-2"><Check className="w-4 h-4 text-primary shrink-0" />Safe observation steps</p><p className="flex gap-2"><Check className="w-4 h-4 text-primary shrink-0" />No chemical rates or prescriptions</p></div></div>}
      </section>
    </div>
    <p className="text-xs text-muted-foreground max-w-3xl">Your selected image and crop label are sent to Groq to generate this screening. Avoid including people or identifying details. For local, timely recommendations, consult an <a className="underline underline-offset-2" href="https://www.icar.org.in/en/integrated-pest-management-sustainable-approach-responsible-pest-management" target="_blank" rel="noreferrer">ICAR extension resource</a>.</p>
  </div>;
}
