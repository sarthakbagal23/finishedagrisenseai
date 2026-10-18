"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, BookOpen, Bot, CloudSun, ExternalLink, Leaf, LoaderCircle, MapPin, RotateCcw, ShieldCheck, Sparkles, Sprout, Wheat } from 'lucide-react';
import { useSensors } from '@/context/SensorContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const languageNames: Record<string, string> = {
  en: 'English', hi: 'Hindi', pb: 'Punjabi', ta: 'Tamil',
  te: 'Telugu', mr: 'Marathi', kn: 'Kannada', bn: 'Bengali', gu: 'Gujarati',
};

const stages = ['Not sure yet', 'Sowing / transplanting', 'Vegetative growth', 'Flowering / fruiting', 'Harvest / storage'] as const;

const starters = [
  { icon: CloudSun, title: 'Plan around the weather', prompt: 'What should I check before planning irrigation or field work this week?' },
  { icon: Leaf, title: 'Understand a crop symptom', prompt: 'My crop has a problem. Ask me what details you need before suggesting next steps.' },
  { icon: ShieldCheck, title: 'Check before spraying', prompt: 'What should I verify before deciding whether a pesticide is needed?' },
  { icon: Wheat, title: 'Prepare for harvest', prompt: 'Help me make a practical pre-harvest checklist for this crop.' },
];

export default function AIAdvisor() {
  const { settings } = useSensors();
  const [cropStage, setCropStage] = useState<(typeof stages)[number]>(stages[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedQuestion, setFailedQuestion] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const language = languageNames[settings.language] ?? 'English';

  useEffect(() => {
    setOnline(navigator.onLine);
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  async function sendQuestion(question: string, retry = false) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const conversation = retry ? messages : [...messages, { role: 'user' as const, content: trimmed }];
    if (!retry) setMessages(conversation);
    setDraft('');
    setError(null);
    setFailedQuestion(null);

    if (!navigator.onLine) {
      setError('You are offline. Your question is still here; reconnect and retry when you are ready.');
      setFailedQuestion(trimmed);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversation.slice(-8),
          crop: settings.cropType,
          location: settings.location,
          cropStage,
          language,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error?.message || 'The advisor could not answer right now.');
      }
      if (typeof payload?.answer !== 'string' || !payload.answer.trim()) {
        throw new Error('The advisor returned an empty reply. Try again.');
      }
      setMessages(previous => [...previous, { role: 'assistant', content: payload.answer }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The advisor could not be reached. Try again.');
      setFailedQuestion(trimmed);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(draft);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendQuestion(draft);
    }
  }

  return (
    <div className="space-y-7 md:space-y-9">
      <header className="border-b border-border pb-6 md:pb-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-model-ink">
            <Sparkles className="h-3.5 w-3.5" /> Groq-powered farm advisor
          </div>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            A clearer next step for your field.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Ask a practical question. The advisor uses your crop profile and growth stage, then asks for missing details instead of guessing.
          </p>
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
        <section aria-label="Farm advisor chat" className="overflow-hidden rounded-md border border-border bg-card ">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center text-model-ink">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Field conversation</h3>
                <p className="text-xs text-muted-foreground">Replies in {language} · {online ? 'Connected' : 'Offline'}</p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" className="min-h-10 gap-2" onClick={() => { setMessages([]); setError(null); setFailedQuestion(null); }}>
                <RotateCcw className="h-4 w-4" /> New chat
              </Button>
            )}
          </div>

          <div className="max-h-[min(58vh,620px)] min-h-[340px] overflow-y-auto px-4 py-5 md:px-6" aria-live="polite" aria-relevant="additions text">
            {messages.length === 0 ? (
              <div className="flex min-h-[300px] flex-col justify-center">
                <div className="mb-5 flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center text-model-ink"><Bot className="h-4 w-4" /></div>
                  <div className="max-w-xl rounded-md rounded-tl-sm border border-border bg-background px-4 py-3 text-sm leading-6 text-foreground">
                    Tell me what you are trying to decide. If timing or treatment depends on local conditions, I will ask before recommending a step.
                  </div>
                </div>
                <p className="mb-3 ml-11 text-xs font-medium text-muted-foreground">A few useful starting points</p>
                <div className="grid gap-2 sm:grid-cols-2 sm:pl-11">
                  {starters.map(({ icon: Icon, title, prompt }) => (
                    <button key={title} type="button" onClick={() => void sendQuestion(prompt)} disabled={loading}
                      className="group flex min-h-[72px] items-center gap-3 rounded-xl border border-border bg-background px-3.5 py-3 text-left transition-colors hover:border-model/40 hover:bg-model/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Icon className="h-4 w-4 shrink-0 text-model transition-transform group-hover:scale-110" />
                      <span className="text-sm font-medium text-foreground">{title}</span>
                      <ArrowUp className="ml-auto h-3.5 w-3.5 -rotate-45 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((message, index) => (
                  <div key={`${index}-${message.role}`} className={cn('flex gap-3', message.role === 'user' && 'flex-row-reverse')}>
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', message.role === 'user' ? 'bg-primary text-primary-foreground' : 'text-model-ink')}>
                      {message.role === 'user' ? <Sprout className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={cn('max-w-[88%] rounded-md px-4 py-3 text-sm leading-6', message.role === 'user' ? 'rounded-tr-sm bg-primary text-primary-foreground' : 'rounded-tl-sm border border-border bg-background text-foreground')}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status">
                    <span className="flex h-8 w-8 items-center justify-center text-model-ink"><LoaderCircle className="h-4 w-4 animate-spin" /></span>
                    Thinking through the field context…
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {error && (
            <div className="mx-4 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 md:mx-6" role="alert">
              <p className="text-sm text-foreground">{error}</p>
              {failedQuestion && <Button size="sm" variant="outline" className="min-h-10" onClick={() => void sendQuestion(failedQuestion, true)}>Retry</Button>}
            </div>
          )}

          <form onSubmit={submit} className="border-t border-border bg-background/70 p-3 md:p-4">
            <label htmlFor="advisor-question" className="sr-only">Ask the farm advisor</label>
            <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-2  transition-shadow focus-within:ring-2 focus-within:ring-ring/50">
              <Textarea id="advisor-question" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={handleComposerKeyDown}
                maxLength={1_500} rows={2} placeholder="Ask about an observation or a decision…" disabled={loading}
                className="max-h-32 min-h-11 resize-y border-0 bg-transparent shadow-none focus-visible:ring-0" />
              <Button type="submit" size="icon" className="mb-0.5 h-10 w-10 shrink-0 rounded-lg" disabled={loading || !draft.trim()} aria-label="Send question">
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 px-1 pt-2 text-[11px] text-muted-foreground">
              <span>Enter to send · Shift + Enter for a new line</span>
              <span>{draft.length}/1,500</span>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <section className="rounded-md border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your field brief</p>
                <h3 className="mt-1 font-display text-xl font-semibold text-foreground">Make advice more relevant</h3>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/50 text-foreground"><Sprout className="h-4 w-4" /></div>
            </div>
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Wheat className="h-4 w-4" /></span>
                <div className="min-w-0"><p className="text-[11px] text-muted-foreground">Crop</p><p className="truncate text-sm font-medium text-foreground">{settings.cropType}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><MapPin className="h-4 w-4" /></span>
                <div className="min-w-0"><p className="text-[11px] text-muted-foreground">Farm area</p><p className="truncate text-sm font-medium text-foreground">{settings.location}</p></div>
              </div>
              <div>
                <label htmlFor="crop-stage" className="mb-1.5 block text-[11px] text-muted-foreground">Growth stage</label>
                <select id="crop-stage" value={cropStage} onChange={event => setCropStage(event.target.value as (typeof stages)[number])}
                  className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {stages.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                </select>
              </div>
            </div>
            <Link href="/settings" className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-model underline-offset-4 hover:underline">Edit farm profile <ArrowDown className="h-3.5 w-3.5 -rotate-45" /></Link>
          </section>

          <section className="rounded-md border border-border bg-card p-5">
            <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-model" /><h3 className="font-semibold text-foreground">Trusted field references</h3></div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Check local bulletins when timing or treatment depends on current conditions.</p>
            <div className="mt-3 divide-y divide-border">
              <a className="flex min-h-12 items-center justify-between gap-3 py-2 text-sm font-medium hover:text-model" href="https://mausam.imd.gov.in/imd_latest/contents/agromet/advisory/englishstate_current.php" target="_blank" rel="noreferrer">
                IMD agromet advisories <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
              <a className="flex min-h-12 items-center justify-between gap-3 py-2 text-sm font-medium hover:text-model" href="https://www.icar.org.in/en/integrated-pest-management-sustainable-approach-responsible-pest-management" target="_blank" rel="noreferrer">
                ICAR integrated pest management <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
              <a className="flex min-h-12 items-center justify-between gap-3 py-2 text-sm font-medium hover:text-model" href="https://agmarknet.gov.in/" target="_blank" rel="noreferrer">
                Agmarknet mandi prices <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </div>
          </section>

          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs leading-5 text-muted-foreground">
              Your question, crop, location and stage are sent to Groq to generate a reply. Simulated sensor readings are not used. Avoid entering personal, financial or identity details.
            </p>
            <p className="mt-2 text-xs font-medium text-foreground">AI guidance can be wrong. Confirm high-impact decisions with your local KVK or extension officer.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
