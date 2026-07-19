import { ArrowRight, CheckCircle2, Database, FileCheck2, FlaskConical, LockKeyhole, ShieldCheck, Sparkles, UserRoundCheck, UsersRound } from "lucide-react";
import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

import { categories, categoryById, projects } from "../data/catalog";
import { formatNumber } from "../lib/utils";
import type { Availability } from "../lib/types";

export const dianaVideoFps = 30;
export const dianaVideoDurationInFrames = 1800;

const scenes = [
  { id: "opening", from: 0, duration: 180, node: React.createElement(OpeningScene, { durationInFrames: 180 }) },
  { id: "mission", from: 180, duration: 240, node: React.createElement(MissionScene, { durationInFrames: 240 }) },
  { id: "participant", from: 420, duration: 300, node: React.createElement(ParticipantScene, { durationInFrames: 300 }) },
  { id: "researcher", from: 720, duration: 300, node: React.createElement(ResearcherScene, { durationInFrames: 300 }) },
  { id: "governance", from: 1020, duration: 240, node: React.createElement(GovernanceScene, { durationInFrames: 240 }) },
  { id: "benchmark", from: 1260, duration: 300, node: React.createElement(BenchmarkScene, { durationInFrames: 300 }) },
  { id: "closing", from: 1560, duration: 240, node: React.createElement(ClosingScene, { durationInFrames: 240 }) },
];

const featuredProject = projects.find((project) => project.id === "mcphases");
const fallbackAvailability: Availability[] = [
  { categoryId: "cycle", participants: 1248, percent: 86, state: "Strong coverage" },
  { categoryId: "sleep", participants: 1103, percent: 79, state: "Strong coverage" },
  { categoryId: "symptoms", participants: 924, percent: 64, state: "Partial coverage" },
  { categoryId: "hormones", participants: 376, percent: 27, state: "Limited coverage" },
];

export function DianaProjectVideo() {
  return (
    <AbsoluteFill className="diana-video">
      <AnimatedBackdrop />
      <Audio src={staticFile("assets/diana-video-master.wav")} volume={1} />
      {scenes.map((scene) => (
        <Sequence key={scene.id} from={scene.from} durationInFrames={scene.duration}>
          {scene.node}
        </Sequence>
      ))}
      <ProgressRail />
    </AbsoluteFill>
  );
}

function AnimatedBackdrop() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = interpolate(frame, [0, durationInFrames], [-160, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line = interpolate(frame, [0, durationInFrames], [8, 92], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chapter = scenes.findIndex((scene) => frame < scene.from + scene.duration) + 1;

  return (
    <AbsoluteFill className="cinematic-backdrop">
      <div className="backdrop-word" style={{ transform: `translateX(${drift}px)` }}>DIANA</div>
      <div className="backdrop-rule backdrop-rule-vertical" />
      <div className="backdrop-rule backdrop-rule-horizontal" style={{ width: `${line}%` }} />
      <div className="backdrop-index">{String(chapter).padStart(2, "0")} / 07</div>
      <div className="letterbox letterbox-top" />
      <div className="letterbox letterbox-bottom" />
    </AbsoluteFill>
  );
}

function ProgressRail() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const width = interpolate(frame, [0, durationInFrames - 1], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div className="progress-rail" aria-hidden="true">
      <div className="progress-bar" style={{ width: `${width}%` }} />
    </div>
  );
}

function SceneShell({ children, durationInFrames, kicker, title, tone = "neutral" }: { children: React.ReactNode; durationInFrames: number; kicker: string; title: string; tone?: "neutral" | "purple" | "green" }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, 0);
  const titleIntro = springIn(frame, fps, 7);
  const outro = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const style: React.CSSProperties = { opacity: intro * outro, clipPath: `inset(0 ${(1 - intro) * 12}% 0 0)` };

  return (
    <AbsoluteFill className={`scene scene-${tone}`} style={style}>
      <section className="scene-frame">
        <span className="scene-marker">{kicker}</span>
        <header className="scene-header">
          <h1 style={{ opacity: titleIntro, clipPath: `inset(0 ${(1 - titleIntro) * 18}% 0 0)` }}>{title}</h1>
        </header>
        {children}
      </section>
    </AbsoluteFill>
  );
}

function OpeningScene({ durationInFrames }: { durationInFrames: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = springIn(frame, fps, 5);

  return (
    <SceneShell durationInFrames={durationInFrames} kicker="System boundary" title="A synthetic consent prototype and an implemented private-truth benchmark" tone="purple">
      <div className="opening-layout">
        <div className="hero-copy" style={{ opacity: logo }}>
          <Img className="hero-logo" src={staticFile("assets/diana-logo-transparent.svg")} alt="DIANA" />
          <p>Two technical surfaces demonstrate how permission metadata, preliminary feasibility, and reproducible evaluation can remain separated by clear controls.</p>
          <Statement delay={58}>The prototype and benchmark are intentionally non-integrated.</Statement>
        </div>
        <div className="signal-stage" style={{ opacity: springIn(frame, fps, 20) }}>
          <div className="signal-axis" style={{ height: `${interpolate(frame, [22, 118], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%` }} />
          <SignalCard delay={38} icon={UserRoundCheck} title="Browser prototype" text="Consent metadata, project setup, and synthetic feasibility." />
          <SignalCard delay={56} icon={ShieldCheck} title="Client-side controls" text="Scope matching, withdrawal state, and download gating." />
          <SignalCard delay={74} icon={FlaskConical} title="Implemented benchmark" text="Private truth, frozen folds, budget tracks, and aggregate release." />
        </div>
      </div>
      <FooterNote>Synthetic browser prototype plus a separately implemented research benchmark. No diagnosis or clinical claims.</FooterNote>
    </SceneShell>
  );
}

function MissionScene({ durationInFrames }: { durationInFrames: number }) {
  return (
    <SceneShell durationInFrames={durationInFrames} kicker="Browser architecture" title="Permissions and project requirements live in explicit client-side state" tone="neutral">
      <div className="mission-stage">
        <div className="chaos-stack">
          <FloatingNote delay={12} text="categoryIds: string[]" tone="purple" />
          <FloatingNote delay={30} text="projectId: string | null" tone="green" />
          <FloatingNote delay={48} text="scope: project | approved-projects" tone="neutral" />
          <FloatingNote delay={66} text="status: active | withdrawn" tone="purple" />
        </div>
        <div className="processor-card">
          <Sparkles aria-hidden="true" />
          <strong>Client-side state model</strong>
          <span>React state and localStorage. No health-record ingestion or server-side consent service.</span>
        </div>
        <div className="mission-grid mission-grid-tight">
          <AnimatedIconCard delay={48} icon={Database} title="Match rules" text="Status, scope, timing, and optional similar-project permission." />
          <AnimatedIconCard delay={66} icon={ShieldCheck} title="Feasibility heuristic" text="Fixture coverage adjusted by follow-up and collection timing." />
          <AnimatedIconCard delay={84} icon={FileCheck2} title="Output boundary" text="Preliminary synthetic aggregates, never participant rows." />
        </div>
      </div>
      <div className="mission-strip mission-strip-fast">
        <span>select</span>
        <ArrowRight aria-hidden="true" />
        <span>consent</span>
        <ArrowRight aria-hidden="true" />
        <span>match</span>
        <ArrowRight aria-hidden="true" />
        <span>estimate</span>
      </div>
    </SceneShell>
  );
}

function ParticipantScene({ durationInFrames }: { durationInFrames: number }) {
  const frame = useCurrentFrame();
  const steps = ["Select category IDs", "Set scope and timing", "Simulate signature", "Withdraw future use"];

  // The active consent step advances through the scene to demonstrate the participant journey.
  const activeStep = Math.min(steps.length - 1, Math.floor(frame / 58));

  return (
    <SceneShell durationInFrames={durationInFrames} kicker="Consent record" title="Consent is structured metadata with an explicit state transition" tone="green">
      <div className="participant-layout">
        <div className="phone-frame">
          <div className="phone-top">Prototype consent state</div>
          <div className="phone-steps">
            {steps.map((step, index) => (
              <ConsentStep key={step} active={index <= activeStep} done={index < activeStep} index={index} label={step} />
            ))}
          </div>
          <div className="scope-card">
            <span>Persisted state</span>
            <strong>{activeStep > 1 ? "status: active" : "scope: project | approved-projects"}</strong>
          </div>
        </div>
        <div className="category-panel">
          <p className="panel-label">categoryIds</p>
          <div className="category-cloud category-cloud-animated">
            {categories.map((category, index) => <AnimatedPill key={category.id} delay={index * 7}>{category.shortTitle}</AnimatedPill>)}
          </div>
          <div className="rejection-board">
            <RejectionTag delay={34}>health payloads</RejectionTag>
            <RejectionTag delay={54}>signature documents</RejectionTag>
            <RejectionTag delay={74}>server upload</RejectionTag>
          </div>
          <div className="participant-proof">
            <MiniStat value="0" label="health records uploaded" />
            <MiniStat value="local" label="prototype persistence boundary" />
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

function ResearcherScene({ durationInFrames }: { durationInFrames: number }) {
  const frame = useCurrentFrame();
  const rows = featuredProject?.availability.slice(0, 5) ?? fallbackAvailability;
  const projectTitle = featuredProject?.title ?? "mcPHASES Multimodal Cycle Study";
  const participants = featuredProject?.matchingParticipants ?? 1284;
  const dataPoints = featuredProject?.dataPoints ?? 284392;
  const animatedParticipants = Math.round(interpolate(frame, [24, 120], [0, participants], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const animatedDataPoints = Math.round(interpolate(frame, [42, 138], [0, dataPoints], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  return (
    <SceneShell durationInFrames={durationInFrames} kicker="Feasibility estimator" title="A documented heuristic, not a participant-level cohort query" tone="purple">
      <div className="researcher-layout">
        <section className="dashboard-card">
          <div className="dashboard-title-row">
            <div>
              <span>Preliminary synthetic estimate</span>
              <h2>{projectTitle}</h2>
            </div>
            <StatusBadge>Synthetic aggregate</StatusBadge>
          </div>
          <div className="availability-list">
            {rows.map((item, index) => (
              <AvailabilityRow
                key={item.categoryId}
                delay={index * 13}
                label={categoryById(item.categoryId)?.shortTitle ?? item.categoryId}
                percent={item.percent}
                participants={item.participants}
                state={item.state}
              />
            ))}
          </div>
        </section>
        <aside className="researcher-stats">
          <MetricCard tone="green" value={formatNumber(animatedParticipants)} label="synthetic matching estimate" />
          <MetricCard tone="purple" value={formatNumber(animatedDataPoints)} label="estimated aggregate data points" />
          <div className="download-card">
            <LockKeyhole aria-hidden="true" />
            <strong>The client gate exports category-level synthetic CSV only.</strong>
          </div>
        </aside>
      </div>
    </SceneShell>
  );
}

function GovernanceScene({ durationInFrames }: { durationInFrames: number }) {
  return (
    <SceneShell durationInFrames={durationInFrames} kicker="Prototype gate" title="Preliminary estimates remain separate from downloadable aggregates" tone="green">
      <div className="governance-flow">
        <FlowNode delay={10} icon={UserRoundCheck} title="Consent metadata" text="Scope, timing, options, and status" />
        <FlowArrow delay={28} />
        <FlowNode delay={42} icon={ShieldCheck} title="Match function" text="Active and compatible permission" />
        <FlowArrow delay={60} />
        <FlowNode delay={74} icon={LockKeyhole} title="Client gate" text="Project downloadReady flag" />
        <FlowArrow delay={92} />
        <FlowNode delay={106} icon={Database} title="CSV export" text="Category-level synthetic aggregates" />
      </div>
      <div className="governance-notice">
        <Sparkles aria-hidden="true" />
        <p>Production authorization, institutional verification, health-data ingestion, and de-identification remain represented requirements rather than implemented services.</p>
      </div>
    </SceneShell>
  );
}

function BenchmarkScene({ durationInFrames }: { durationInFrames: number }) {
  return (
    <SceneShell durationInFrames={durationInFrames} kicker="Implemented benchmark" title="A frozen causal task isolates model evaluation from private truth" tone="neutral">
      <div className="benchmark-layout">
        <div className="task-diagram">
          <p className="panel-label">hormonbench_mcphases_interval2_nextday_v1</p>
          <div className="timeline-row">
            {Array.from({ length: 14 }, (_, index) => <TimelineToken key={`t-minus-${13 - index}`} delay={index * 3}>t-{13 - index}</TimelineToken>)}
            <ArrowRight aria-hidden="true" />
            <strong>t+1</strong>
          </div>
          <p>Exactly fourteen causal wearable days forecast participant-entered next-day urinary LH, E3G, and PdG. Future observations remain unavailable to the model.</p>
          <Statement delay={122}>Five deterministic folds test every eligible participant exactly once.</Statement>
        </div>
        <div className="benchmark-cards">
          <AnimatedIconCard delay={38} icon={UsersRound} title="Private evaluator" text="Held-out truth is joined only inside the evaluator." />
          <AnimatedIconCard delay={58} icon={FlaskConical} title="Budget tracks" text="Cold start and K=0, 3, 7 authorized personal readings." />
          <AnimatedIconCard delay={78} icon={FileCheck2} title="Release boundary" text="IDs, truth, folds, predictions, and participant metrics remain private." />
        </div>
      </div>
    </SceneShell>
  );
}

function ClosingScene({ durationInFrames }: { durationInFrames: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mark = springIn(frame, fps, 12);

  return (
    <SceneShell durationInFrames={durationInFrames} kicker="Technical close" title="Prototype boundaries are explicit. Benchmark boundaries are enforced." tone="purple">
      <div className="closing-layout">
        <div className="closing-rule" style={{ width: `${mark * 100}%` }} />
        <Img className="closing-logo" src={staticFile("assets/diana-logo-transparent.svg")} alt="DIANA" style={{ opacity: mark }} />
        <p>Browser consent metadata demonstrates the governed experience. Hormonbench supplies reproducible private-truth evaluation. Integration is the next infrastructure boundary.</p>
        <div className="closing-tags">
          {[
            "synthetic prototype",
            "local consent state",
            "private evaluator",
            "aggregate release",
          ].map((tag, index) => <AnimatedPill key={tag} delay={68 + index * 8}>{tag}</AnimatedPill>)}
        </div>
      </div>
      <FooterNote>Open, reproducible, nonclinical infrastructure with documented prototype and benchmark boundaries.</FooterNote>
    </SceneShell>
  );
}

function SignalCard({ delay, icon: Icon, text, title }: { delay: number; icon: LucideIcon; text: string; title: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, delay);

  return (
    <article className="signal-card signal-card-pop" style={{ opacity: intro, clipPath: `inset(0 0 ${(1 - intro) * 100}% 0)` }}>
      <Icon aria-hidden="true" />
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  );
}

function AnimatedIconCard({ delay, icon: Icon, text, title }: { delay: number; icon: LucideIcon; text: string; title: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, delay);

  return (
    <article className="icon-card icon-card-animated" style={{ opacity: intro, clipPath: `inset(0 0 ${(1 - intro) * 100}% 0)` }}>
      <Icon aria-hidden="true" />
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  );
}

function FloatingNote({ delay, text, tone }: { delay: number; text: string; tone: "neutral" | "purple" | "green" }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, delay);
  return <span className={`floating-note floating-note-${tone}`} style={{ opacity: intro, clipPath: `inset(0 ${(1 - intro) * 100}% 0 0)` }}>{text}</span>;
}

function ConsentStep({ active, done, index, label }: { active: boolean; done: boolean; index: number; label: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, index * 10);

  return (
    <div className={`phone-step ${active ? "phone-step-active" : ""}`} style={{ opacity: intro, clipPath: `inset(0 ${(1 - intro) * 100}% 0 0)` }}>
      <span>{done ? <CheckCircle2 aria-hidden="true" /> : index + 1}</span>
      <strong>{label}</strong>
    </div>
  );
}

function AnimatedPill({ children, delay }: { children: React.ReactNode; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, delay);

  return <span className="data-pill data-pill-animated" style={{ opacity: intro }}>{children}</span>;
}

function RejectionTag({ children, delay }: { children: React.ReactNode; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, delay);

  return <span className="rejection-tag" style={{ opacity: intro, clipPath: `inset(0 0 0 ${(1 - intro) * 100}%)` }}>Excluded: {children}</span>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mini-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function AvailabilityRow({ delay, label, participants, percent, state }: { delay: number; label: string; participants: number; percent: number; state: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, delay);
  const width = interpolate(frame, [delay + 20, delay + 88], [0, percent], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div className="availability-row" style={{ opacity: intro, clipPath: `inset(0 ${(1 - intro) * 100}% 0 0)` }}>
      <div>
        <strong>{label}</strong>
        <span>{state}</span>
      </div>
      <div className="availability-track">
        <div className="availability-fill" style={{ width: `${width}%` }} />
      </div>
      <span>{percent}% · {formatNumber(participants)}</span>
    </div>
  );
}

function MetricCard({ label, tone, value }: { label: string; tone: "green" | "purple"; value: string }) {
  return (
    <div className={`metric-card metric-${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return <span className="status-badge">{children}</span>;
}

function FlowNode({ delay, icon: Icon, text, title }: { delay: number; icon: LucideIcon; text: string; title: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, delay);

  return (
    <article className="flow-node" style={{ opacity: intro, clipPath: `inset(${(1 - intro) * 100}% 0 0 0)` }}>
      <Icon aria-hidden="true" />
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  );
}

function FlowArrow({ delay }: { delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, delay);

  return <ArrowRight className="flow-arrow" aria-hidden="true" style={{ opacity: intro }} />;
}

function TimelineToken({ children, delay }: { children: React.ReactNode; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, delay);

  return <span style={{ opacity: intro }}>{children}</span>;
}

function Statement({ children, delay }: { children: React.ReactNode; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, delay);

  return <div className="statement" style={{ opacity: intro, clipPath: `inset(0 ${(1 - intro) * 100}% 0 0)` }}>{children}</div>;
}

function FooterNote({ children }: { children: React.ReactNode }) {
  return <p className="footer-note">{children}</p>;
}

function springIn(frame: number, fps: number, delay: number): number {
  return spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {
      damping: 20,
      mass: 0.82,
      stiffness: 150,
    },
  });
}
