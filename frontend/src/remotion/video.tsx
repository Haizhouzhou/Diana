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

const tickerItems = [
  "consent first",
  "participant choice",
  "aggregate only",
  "governed access",
  "feasibility before files",
  "reproducible evidence",
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
      <Audio src={staticFile("assets/diana-video-elevenlabs.wav")} volume={1} />
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
  const drift = interpolate(frame, [0, durationInFrames], [-120, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ticker = interpolate(frame % 210, [0, 210], [0, -720]);

  return (
    <AbsoluteFill className="animated-backdrop">
      <div className="blob blob-purple" style={{ transform: `translate(${drift}px, ${drift * 0.24}px) scale(${1 + Math.sin(frame / 34) * 0.035})` }} />
      <div className="blob blob-green" style={{ transform: `translate(${-drift * 0.72}px, ${drift * 0.2}px) scale(${1 + Math.cos(frame / 38) * 0.04})` }} />
      <div className="ticker ticker-top" style={{ transform: `translateX(${ticker}px)` }}>
        {[...tickerItems, ...tickerItems, ...tickerItems].map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
      </div>
      <div className="ticker ticker-bottom" style={{ transform: `translateX(${-ticker - 720}px)` }}>
        {[...tickerItems].reverse().concat(tickerItems).map((item, index) => <span key={`${item}-bottom-${index}`}>{item}</span>)}
      </div>
      <div className="grid-overlay" />
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
  const style: React.CSSProperties = {
    opacity: intro * outro,
    transform: `translateY(${(1 - intro) * 34}px) scale(${0.985 + intro * 0.015})`,
  };

  return (
    <AbsoluteFill className={`scene scene-${tone}`} style={style}>
      <section className="scene-frame">
        <header className="scene-header">
          <span className="scene-kicker">{kicker}</span>
          <h1 style={{ opacity: titleIntro, transform: `translateX(${(1 - titleIntro) * -42}px)` }}>{title}</h1>
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
  const orbit = frame * 2.1;

  return (
    <SceneShell durationInFrames={durationInFrames} kicker="DIANA in 60 seconds" title="Consent-based data infrastructure for responsible research" tone="purple">
      <CelebrationAccents delay={96} pieces={12} />
      <div className="opening-layout">
        <div className="hero-copy" style={{ opacity: logo, transform: `translateY(${(1 - logo) * 34}px) rotate(${(1 - logo) * -2}deg)` }}>
          <Img className="hero-logo" src={staticFile("assets/diana-logo-transparent.svg")} alt="DIANA" />
          <p>Participants choose what to share. Researchers get governed, aggregate feasibility before approved access.</p>
          <ComedyCaption delay={58}>Consent remains explicit, reviewable, and revocable.</ComedyCaption>
        </div>
        <div className="orbit-stage">
          <div className="orbit-ring" style={{ transform: `rotate(${orbit}deg)` }}>
            <span style={{ transform: `rotate(${-orbit}deg)` }}>cycle</span>
            <span style={{ transform: `rotate(${-orbit}deg)` }}>sleep</span>
            <span style={{ transform: `rotate(${-orbit}deg)` }}>symptoms</span>
            <span style={{ transform: `rotate(${-orbit}deg)` }}>hormones</span>
          </div>
          <SignalCard delay={38} icon={UserRoundCheck} title="Participant control" text="Pick categories, project scope, and future permissions." />
          <SignalCard delay={56} icon={ShieldCheck} title="Consent first" text="No contribution is recorded without explicit permission." />
          <SignalCard delay={74} icon={FlaskConical} title="Research readiness" text="Aggregate feasibility, then governance. Not the other way around." />
        </div>
      </div>
      <FooterNote>Prototype only. No diagnosis, treatment, clinical claims, or identifiable participant data.</FooterNote>
    </SceneShell>
  );
}

function MissionScene({ durationInFrames }: { durationInFrames: number }) {
  const frame = useCurrentFrame();

  return (
    <SceneShell durationInFrames={durationInFrames} kicker="The reusable layer" title="DIANA converts research chaos into governed infrastructure" tone="neutral">
      <div className="mission-stage">
        <div className="chaos-stack">
          <FloatingNote delay={12} text="Fragmented source files" tone="purple" />
          <FloatingNote delay={30} text="Unclear access boundaries" tone="green" />
          <FloatingNote delay={48} text="Ethics approval: pending" tone="neutral" />
          <FloatingNote delay={66} text="Inconsistent variable definitions" tone="purple" />
        </div>
        <div className="processor-card" style={{ transform: `scale(${0.98 + Math.sin(frame / 18) * 0.012})` }}>
          <Sparkles aria-hidden="true" />
          <strong>DIANA governance engine</strong>
          <span>Consent checks, de-identification, variable availability, follow-up coverage.</span>
        </div>
        <div className="mission-grid mission-grid-tight">
          <AnimatedIconCard delay={48} icon={Database} title="Availability" text="Categories, completeness, follow-up, population fit." />
          <AnimatedIconCard delay={66} icon={ShieldCheck} title="Boundaries" text="Participant scope stays attached to every project." />
          <AnimatedIconCard delay={84} icon={FileCheck2} title="Output" text="Structured, approved, de-identified datasets." />
        </div>
      </div>
      <div className="mission-strip mission-strip-fast">
        <span>discover</span>
        <ArrowRight aria-hidden="true" />
        <span>consent</span>
        <ArrowRight aria-hidden="true" />
        <span>assess</span>
        <ArrowRight aria-hidden="true" />
        <span>govern</span>
      </div>
    </SceneShell>
  );
}

function ParticipantScene({ durationInFrames }: { durationInFrames: number }) {
  const frame = useCurrentFrame();
  const steps = ["Pick data", "Choose scope", "Sign consent", "Withdraw later"];

  // The active consent step advances through the scene to demonstrate the participant journey.
  const activeStep = Math.min(steps.length - 1, Math.floor(frame / 58));

  return (
    <SceneShell durationInFrames={durationInFrames} kicker="Participant journey" title="Selective contribution with clear, reversible permissions" tone="green">
      <div className="participant-layout">
        <div className="phone-frame phone-frame-animated" style={{ transform: `rotate(${Math.sin(frame / 30) * 0.55}deg)` }}>
          <div className="phone-top">Participant consent flow</div>
          <div className="phone-steps">
            {steps.map((step, index) => (
              <ConsentStep key={step} active={index <= activeStep} done={index < activeStep} index={index} label={step} />
            ))}
          </div>
          <div className="scope-card scope-card-pop">
            <span>Permission scope</span>
            <strong>{activeStep > 1 ? "Active consent recorded" : "Project-specific or eligible approved projects"}</strong>
          </div>
        </div>
        <div className="category-panel">
          <p className="panel-label">Selectable categories</p>
          <div className="category-cloud category-cloud-animated">
            {categories.map((category, index) => <AnimatedPill key={category.id} delay={index * 7}>{category.shortTitle}</AnimatedPill>)}
          </div>
          <div className="rejection-board">
            <RejectionTag delay={34}>real names</RejectionTag>
            <RejectionTag delay={54}>raw signatures</RejectionTag>
            <RejectionTag delay={74}>medical advice</RejectionTag>
          </div>
          <div className="participant-proof">
            <MiniStat value="0" label="identifiable rows shown" />
            <MiniStat value="100%" label="synthetic demo values" />
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
    <SceneShell durationInFrames={durationInFrames} kicker="Researcher dashboard" title="Aggregate feasibility before governed data access" tone="purple">
      <div className="researcher-layout">
        <section className="dashboard-card dashboard-card-kinetic">
          <div className="dashboard-title-row">
            <div>
              <span>Prototype estimate</span>
              <h2>{projectTitle}</h2>
            </div>
            <StatusBadge>Aggregate only</StatusBadge>
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
          <MetricCard tone="green" value={formatNumber(animatedParticipants)} label="matching participants" />
          <MetricCard tone="purple" value={formatNumber(animatedDataPoints)} label="synthetic data points" />
          <div className="download-card download-card-shake" style={{ transform: `translateX(${frame > 118 && frame < 150 ? Math.sin(frame * 1.4) * 6 : 0}px)` }}>
            <LockKeyhole aria-hidden="true" />
            <strong>Dataset access remains locked until governance approval.</strong>
          </div>
        </aside>
      </div>
    </SceneShell>
  );
}

function GovernanceScene({ durationInFrames }: { durationInFrames: number }) {
  return (
    <SceneShell durationInFrames={durationInFrames} kicker="Governance model" title="Privacy and permission remain attached to every request" tone="green">
      <div className="governance-flow governance-flow-animated">
        <FlowNode delay={10} icon={UserRoundCheck} title="Contribution" text="Participant-selected categories" />
        <FlowArrow delay={28} />
        <FlowNode delay={42} icon={ShieldCheck} title="Consent ledger" text="Scope and options checked" />
        <FlowArrow delay={60} />
        <FlowNode delay={74} icon={LockKeyhole} title="De-identify" text="No names, emails, or signatures" />
        <FlowArrow delay={92} />
        <FlowNode delay={106} icon={Database} title="Dataset" text="Structured, approved access" />
      </div>
      <div className="governance-notice governance-notice-pop">
        <Sparkles aria-hidden="true" />
        <p>Scientist views expose aggregate availability and governance status. Re-identification is prohibited by design and policy.</p>
      </div>
    </SceneShell>
  );
}

function BenchmarkScene({ durationInFrames }: { durationInFrames: number }) {
  return (
    <SceneShell durationInFrames={durationInFrames} kicker="Reproducible benchmark layer" title="Hormonbench: evaluation with explicit, auditable constraints" tone="neutral">
      <div className="benchmark-layout">
        <div className="task-diagram task-diagram-kinetic">
          <p className="panel-label">Frozen forecasting task</p>
          <div className="timeline-row timeline-row-fast">
            {Array.from({ length: 14 }, (_, index) => <TimelineToken key={`t-minus-${13 - index}`} delay={index * 3}>t-{13 - index}</TimelineToken>)}
            <ArrowRight aria-hidden="true" />
            <strong>t+1</strong>
          </div>
          <p>Fourteen approved historical days forecast genuinely observed next-day urinary LH, E3G, and PdG. Future observations remain unavailable to the model.</p>
          <ComedyCaption delay={122}>Leakage controls are part of the benchmark contract.</ComedyCaption>
        </div>
        <div className="benchmark-cards">
          <AnimatedIconCard delay={38} icon={UsersRound} title="Participant-independent folds" text="Every eligible participant is tested once, preventing train-test leakage across people." />
          <AnimatedIconCard delay={58} icon={FlaskConical} title="Budget tracks" text="Cold start and K=0, 3, 7 isolate the value and burden of personal tests." />
          <AnimatedIconCard delay={78} icon={FileCheck2} title="Public evidence" text="Only aggregate results are public. Private truth, rows, predictions, and IDs stay private." />
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
    <SceneShell durationInFrames={durationInFrames} kicker="Project close" title="Governance is part of the product" tone="purple">
      <CelebrationAccents delay={18} pieces={18} />
      <div className="closing-layout">
        <Img className="closing-logo" src={staticFile("assets/diana-logo-transparent.svg")} alt="DIANA" style={{ opacity: mark, transform: `scale(${0.9 + mark * 0.1}) rotate(${(1 - mark) * -3}deg)` }} />
        <p>Participant choice, researcher feasibility, de-identification, governance, and reproducible benchmark contracts in one portable project.</p>
        <div className="closing-tags">
          {[
            "open",
            "reproducible",
            "privacy-conscious",
            "nonclinical",
          ].map((tag, index) => <AnimatedPill key={tag} delay={68 + index * 8}>{tag}</AnimatedPill>)}
        </div>
      </div>
      <FooterNote>Reusable application-infrastructure layer. Synthetic prototype values only.</FooterNote>
    </SceneShell>
  );
}

function SignalCard({ delay, icon: Icon, text, title }: { delay: number; icon: LucideIcon; text: string; title: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, delay);

  return (
    <article className="signal-card signal-card-pop" style={{ opacity: intro, transform: `translateY(${(1 - intro) * 28}px) rotate(${(1 - intro) * 4}deg)` }}>
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
    <article className="icon-card icon-card-animated" style={{ opacity: intro, transform: `translateY(${(1 - intro) * 34}px) scale(${0.92 + intro * 0.08})` }}>
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
  const wobble = Math.sin((frame + delay) / 14) * 5;

  return <span className={`floating-note floating-note-${tone}`} style={{ opacity: intro, transform: `translate(${(1 - intro) * -90}px, ${wobble}px) rotate(${(1 - intro) * -7 + wobble * 0.18}deg)` }}>{text}</span>;
}

function ConsentStep({ active, done, index, label }: { active: boolean; done: boolean; index: number; label: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, index * 10);

  return (
    <div className={`phone-step ${active ? "phone-step-active" : ""}`} style={{ opacity: intro, transform: `translateX(${(1 - intro) * -32}px)` }}>
      <span>{done ? <CheckCircle2 aria-hidden="true" /> : index + 1}</span>
      <strong>{label}</strong>
    </div>
  );
}

function AnimatedPill({ children, delay }: { children: React.ReactNode; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, delay);

  return <span className="data-pill data-pill-animated" style={{ opacity: intro, transform: `translateY(${(1 - intro) * 30}px) rotate(${(1 - intro) * -5}deg)` }}>{children}</span>;
}

function RejectionTag({ children, delay }: { children: React.ReactNode; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, delay);

  return <span className="rejection-tag" style={{ opacity: intro, transform: `translateX(${(1 - intro) * 44}px) rotate(${(1 - intro) * 4}deg)` }}>Nope: {children}</span>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 10) * 0.012;

  return (
    <div className="mini-stat" style={{ transform: `scale(${pulse})` }}>
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
    <div className="availability-row" style={{ opacity: intro, transform: `translateX(${(1 - intro) * -26}px)` }}>
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
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 13) * 0.014;

  return (
    <div className={`metric-card metric-${tone}`} style={{ transform: `scale(${pulse})` }}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  const frame = useCurrentFrame();
  const tick = frame % 34 < 17 ? 0 : 1;

  return <span className="status-badge" style={{ transform: `translateY(${tick}px)` }}>{children}</span>;
}

function FlowNode({ delay, icon: Icon, text, title }: { delay: number; icon: LucideIcon; text: string; title: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, delay);

  return (
    <article className="flow-node" style={{ opacity: intro, transform: `translateY(${(1 - intro) * 38}px) scale(${0.9 + intro * 0.1})` }}>
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

  return <ArrowRight className="flow-arrow" aria-hidden="true" style={{ opacity: intro, transform: `translateX(${(1 - intro) * -20}px)` }} />;
}

function TimelineToken({ children, delay }: { children: React.ReactNode; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, delay);

  return <span style={{ opacity: intro, transform: `translateY(${(1 - intro) * -18}px)` }}>{children}</span>;
}

function ComedyCaption({ children, delay }: { children: React.ReactNode; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = springIn(frame, fps, delay);

  return <div className="comedy-caption" style={{ opacity: intro, transform: `translateY(${(1 - intro) * 24}px) rotate(${(1 - intro) * -2}deg)` }}>{children}</div>;
}

function CelebrationAccents({ delay, pieces = 14 }: { delay: number; pieces?: number }) {
  const frame = useCurrentFrame();
  const particles = Array.from({ length: pieces }, (_, index) => index);

  return (
    <div className="celebration-layer" aria-hidden="true">
      {particles.map((particle) => {
        const corner = particle % 4;
        const group = Math.floor(particle / 4);
        const start = delay + group * 3;
        const duration = 54 + (particle % 4) * 6;
        const end = start + duration;
        const progress = interpolate(frame, [start, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const opacity = interpolate(frame, [start, start + 6, end - 16, end], [0, 0.72, 0.38, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const fromLeft = corner === 0 || corner === 2;
        const fromTop = corner < 2;
        const xDistance = 92 + (group % 3) * 22;
        const yDistance = 72 + (particle % 3) * 18;
        const x = (fromLeft ? 26 : 1742) + (fromLeft ? 1 : -1) * progress * xDistance;
        const y = (fromTop ? 92 : 848) + (fromTop ? 1 : -1) * progress * yDistance;
        const rotate = (fromLeft ? 1 : -1) * progress * (72 + (particle % 5) * 18);
        const scale = interpolate(progress, [0, 0.18, 1], [0.7, 1, 0.84]);
        return <span key={particle} className={`celebration-particle celebration-particle-${particle % 3}`} style={{ opacity, transform: `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})` }} />;
      })}
    </div>
  );
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
