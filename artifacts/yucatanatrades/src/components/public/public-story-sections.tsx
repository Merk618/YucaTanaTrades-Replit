import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronRight,
  CircleGauge,
  Eye,
  Layers3,
  LineChart,
  ListTree,
  Radar,
  Scale,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import {
  PublicReveal,
  PublicSectionIntro,
  PublicStateDot,
  PublicTruthBadge,
} from "./public-primitives";

const morningSignals = [
  {
    label: "Market regime",
    value: "Context organized",
    truth: "Demo" as const,
    tone: "green" as const,
  },
  {
    label: "Technical posture",
    value: "Structure in view",
    truth: "Historical" as const,
    tone: "blue" as const,
  },
  {
    label: "Portfolio risk",
    value: "Scenario only",
    truth: "Estimated" as const,
    tone: "gold" as const,
  },
  {
    label: "Events",
    value: "Connection required",
    truth: "Provider unavailable" as const,
    tone: "red" as const,
  },
];

export function MorningIntelligenceSection() {
  return (
    <section
      id="platform"
      tabIndex={-1}
      className="yt24-section yt24-morning-section"
      aria-labelledby="yt24-morning-title"
      data-recording="morning-intelligence"
    >
      <div className="yt24-shell">
        <PublicReveal>
          <PublicSectionIntro
            index="01"
            eyebrow="MORNING INTELLIGENCE"
            title={
              <span id="yt24-morning-title">
                Begin with the whole decision field—not another feed.
              </span>
            }
            body="Morning Intelligence is designed to bring market structure, technical context, research priorities, and portfolio awareness into one ordered briefing. Every displayed state keeps its provenance attached."
          />
        </PublicReveal>

        <PublicReveal className="yt24-morning-stage" delay={0.08}>
          <div className="yt24-morning-primary">
            <div className="yt24-preview-topline">
              <span>
                <Radar aria-hidden="true" />
                MERIDIAN MORNING BRIEF
              </span>
              <PublicTruthBadge label="Demo" />
            </div>

            <div className="yt24-morning-headline">
              <div>
                <span className="yt24-mini-label">DECISION ORIENTATION</span>
                <h3>See what changed, what matters, and what needs review.</h3>
                <p>
                  A composed briefing sequence keeps market context beside the
                  risk and evidence that qualify it. This preview is a deterministic
                  interface fixture, not a current market observation.
                </p>
              </div>
              <div className="yt24-brief-orbit" aria-hidden="true">
                <span />
                <span />
                <i />
              </div>
            </div>

            <div className="yt24-morning-signal-grid">
              {morningSignals.map((signal) => (
                <article key={signal.label}>
                  <div>
                    <PublicStateDot tone={signal.tone} />
                    <span>{signal.label}</span>
                  </div>
                  <strong>{signal.value}</strong>
                  <PublicTruthBadge label={signal.truth} />
                </article>
              ))}
            </div>

            <div className="yt24-brief-footer">
              <span><Check aria-hidden="true" /> State labels remain visible</span>
              <span><Check aria-hidden="true" /> No provider request is made</span>
              <span><Check aria-hidden="true" /> No account data is implied</span>
            </div>
          </div>

          <aside className="yt24-morning-aside" aria-label="Morning review sequence">
            <div className="yt24-aside-heading">
              <span>REVIEW SEQUENCE</span>
              <em>06 steps</em>
            </div>
            {[
              ["01", "Regime", "Frame the environment"],
              ["02", "Structure", "Review the technical map"],
              ["03", "Exposure", "Surface concentration"],
              ["04", "Catalysts", "Check the evidence trail"],
              ["05", "Risk", "Define what would change the view"],
              ["06", "Decision", "Move only with context"],
            ].map(([index, label, description]) => (
              <div className="yt24-review-step" key={label}>
                <span>{index}</span>
                <div>
                  <strong>{label}</strong>
                  <p>{description}</p>
                </div>
                <ChevronRight aria-hidden="true" />
              </div>
            ))}
          </aside>
        </PublicReveal>
      </div>
    </section>
  );
}

function TechnicalChart() {
  const candles = [
    [38, 144, 26, 18],
    [70, 130, 32, 22],
    [102, 138, 25, 16],
    [134, 112, 35, 24],
    [166, 101, 31, 19],
    [198, 118, 24, 16],
    [230, 92, 42, 28],
    [262, 77, 38, 22],
    [294, 91, 31, 18],
    [326, 62, 45, 27],
    [358, 48, 39, 22],
    [390, 66, 32, 19],
    [422, 42, 36, 21],
    [454, 53, 30, 17],
    [486, 31, 43, 26],
    [518, 47, 35, 21],
    [550, 38, 31, 18],
    [582, 58, 41, 25],
  ];

  return (
    <div
      className="yt24-technical-chart"
      role="img"
      aria-label="Historical demo chart structure with review and invalidation zones."
    >
      <div className="yt24-chart-toolbar">
        <div>
          <LineChart aria-hidden="true" />
          <span>
            <strong>Primary benchmark</strong>
            <small>Fixed analytical fixture</small>
          </span>
        </div>
        <div className="yt24-chart-ranges" aria-hidden="true">
          <span className="is-active">1D</span>
          <span>1W</span>
          <span>1M</span>
          <span>3M</span>
          <span>YTD</span>
        </div>
      </div>

      <svg viewBox="0 0 640 260" aria-hidden="true">
        <defs>
          <linearGradient id="yt24-zone-entry" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(89,173,154,.03)" />
            <stop offset="100%" stopColor="rgba(89,173,154,.16)" />
          </linearGradient>
          <linearGradient id="yt24-zone-risk" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(218,99,77,.02)" />
            <stop offset="100%" stopColor="rgba(218,99,77,.12)" />
          </linearGradient>
        </defs>
        {[44, 92, 140, 188, 236].map((y) => (
          <line key={y} x1="20" x2="620" y1={y} y2={y} stroke="rgba(133,170,176,.08)" />
        ))}
        {[120, 220, 320, 420, 520].map((x) => (
          <line key={x} x1={x} x2={x} y1="18" y2="238" stroke="rgba(133,170,176,.05)" />
        ))}
        <rect x="20" y="74" width="600" height="44" fill="url(#yt24-zone-entry)" />
        <rect x="20" y="196" width="600" height="32" fill="url(#yt24-zone-risk)" />
        <text x="32" y="90" className="yt24-svg-label">REVIEW ZONE · DEMO</text>
        <text x="32" y="215" className="yt24-svg-label yt24-svg-label-risk">INVALIDATION CONTEXT</text>

        <path
          d="M20 176 C80 156 112 163 165 137 S258 135 312 105 S398 103 452 71 S543 71 620 45"
          fill="none"
          stroke="rgba(229,195,113,.72)"
          strokeWidth="2"
        />
        <path
          d="M20 191 C90 176 130 180 191 159 S290 156 345 130 S444 125 503 91 S573 88 620 79"
          fill="none"
          stroke="rgba(96,177,153,.55)"
          strokeWidth="1.5"
        />

        {candles.map(([x, y, height, body], index) => {
          const positive = index % 4 !== 2;
          const color = positive ? "#72b37a" : "#df6b56";
          return (
            <g key={`${x}-${y}`}>
              <line x1={x} x2={x} y1={y - 10} y2={y + height + 10} stroke={color} opacity=".7" />
              <rect
                x={x - 5}
                y={positive ? y + height - body : y}
                width="10"
                height={body}
                rx="1"
                fill={color}
              />
            </g>
          );
        })}
      </svg>

      <div className="yt24-chart-legend">
        <span><i className="is-gold" /> Context line</span>
        <span><i className="is-green" /> Structure line</span>
        <PublicTruthBadge label="Historical" />
      </div>
    </div>
  );
}

export function TechnicalIntelligenceSection() {
  return (
    <section
      id="intelligence"
      tabIndex={-1}
      className="yt24-section yt24-technical-section"
      aria-labelledby="yt24-technical-title"
      data-recording="technical-intelligence"
    >
      <div className="yt24-shell yt24-editorial-grid">
        <PublicReveal className="yt24-editorial-copy">
          <PublicSectionIntro
            index="02"
            eyebrow="TECHNICAL INTELLIGENCE"
            title={
              <span id="yt24-technical-title">
                Structure that explains the setup—not decoration around it.
              </span>
            }
            body="Charts in Meridian OS are being shaped as analytical workspaces: timeframe, indicators, review zones, invalidation context, and provenance remain part of the same visual sentence."
          />

          <div className="yt24-editorial-points">
            {[
              [CircleGauge, "Regime before entry", "Frame the broader environment before a pattern is considered."],
              [Layers3, "Context before conviction", "Keep timeframe, structure, and scenario boundaries visible."],
              [ShieldAlert, "Invalidation before action", "Make the conditions that would challenge a view explicit."],
            ].map(([Icon, title, body]) => (
              <article key={String(title)}>
                <Icon aria-hidden="true" />
                <div>
                  <h3>{String(title)}</h3>
                  <p>{String(body)}</p>
                </div>
              </article>
            ))}
          </div>
        </PublicReveal>

        <PublicReveal className="yt24-editorial-visual" delay={0.1}>
          <TechnicalChart />
          <div className="yt24-technical-state-row">
            <article>
              <span>Structure</span>
              <strong>Fixed fixture</strong>
              <PublicTruthBadge label="Historical" />
            </article>
            <article>
              <span>Scenario zones</span>
              <strong>Illustrative only</strong>
              <PublicTruthBadge label="Demo" />
            </article>
            <article>
              <span>Streaming source</span>
              <strong>Not connected</strong>
              <PublicTruthBadge label="Provider unavailable" />
            </article>
          </div>
        </PublicReveal>
      </div>
    </section>
  );
}

export function PortfolioRiskSection() {
  return (
    <section
      id="risk"
      tabIndex={-1}
      className="yt24-section yt24-risk-section"
      aria-labelledby="yt24-risk-title"
      data-recording="portfolio-risk"
    >
      <div className="yt24-shell">
        <PublicReveal>
          <PublicSectionIntro
            index="03"
            eyebrow="PORTFOLIO + RISK"
            title={
              <span id="yt24-risk-title">
                Risk becomes useful when it is connected to the decision.
              </span>
            }
            body="The portfolio layer is designed to organize exposure, concentration, and scenario context without pretending a brokerage account is connected. This public preview uses no holdings or membership state."
          />
        </PublicReveal>

        <PublicReveal className="yt24-risk-composition" delay={0.08}>
          <div className="yt24-risk-orbit-panel">
            <div className="yt24-preview-topline">
              <span><Scale aria-hidden="true" /> EXPOSURE MAP</span>
              <PublicTruthBadge label="Demo" />
            </div>
            <div className="yt24-risk-orbit" aria-hidden="true">
              <span className="yt24-risk-ring yt24-risk-ring-one" />
              <span className="yt24-risk-ring yt24-risk-ring-two" />
              <span className="yt24-risk-ring yt24-risk-ring-three" />
              <div>
                <strong>NO ACCOUNT</strong>
                <small>Interface fixture</small>
              </div>
              <i className="yt24-risk-node yt24-risk-node-a" />
              <i className="yt24-risk-node yt24-risk-node-b" />
              <i className="yt24-risk-node yt24-risk-node-c" />
            </div>
            <div className="yt24-risk-disclaimer">
              <ShieldAlert aria-hidden="true" />
              Brokerage, custody, balances, and positions are not connected.
            </div>
          </div>

          <div className="yt24-risk-ledger">
            <div className="yt24-risk-ledger-heading">
              <span>RISK REVIEW</span>
              <strong>Illustrative scenario</strong>
            </div>
            {[
              ["Concentration", "Requires review", "Estimated", 74],
              ["Liquidity", "Context reserved", "Demo", 46],
              ["Correlation", "Scenario surface", "Estimated", 62],
              ["Catalyst exposure", "Evidence required", "Provider unavailable", 28],
            ].map(([label, value, truth, width]) => (
              <article key={String(label)}>
                <div>
                  <span>{String(label)}</span>
                  <strong>{String(value)}</strong>
                </div>
                <div className="yt24-risk-meter" aria-hidden="true">
                  <span style={{ width: `${Number(width)}%` }} />
                </div>
                <PublicTruthBadge label={truth as "Estimated" | "Demo" | "Provider unavailable"} />
              </article>
            ))}
          </div>

          <aside className="yt24-risk-note">
            <Eye aria-hidden="true" />
            <span>DECISION PRINCIPLE</span>
            <h3>Exposure should change the question before it changes the answer.</h3>
            <p>
              Meridian OS keeps risk context alongside the thesis, rather than
              treating it as a score detached from the evidence.
            </p>
          </aside>
        </PublicReveal>
      </div>
    </section>
  );
}

const researchSteps = [
  ["01", "Question", "Define the claim worth investigating."],
  ["02", "Thesis", "State the working view and its boundaries."],
  ["03", "Evidence", "Attach source, freshness, and relevance."],
  ["04", "Catalyst", "Record what could change the timing."],
  ["05", "Risk", "Name the conditions that would challenge the view."],
  ["06", "Decision context", "Carry the full trail into the next action."],
];

export function ResearchIntelligenceSection() {
  return (
    <section
      id="research"
      tabIndex={-1}
      className="yt24-section yt24-research-section"
      aria-labelledby="yt24-research-title"
      data-recording="research-workflow"
    >
      <div className="yt24-shell">
        <PublicReveal className="yt24-research-heading">
          <PublicSectionIntro
            index="04"
            eyebrow="RESEARCH WORKFLOW"
            title={
              <span id="yt24-research-title">
                Build the evidence trail before the conclusion.
              </span>
            }
            body="Research Command is designed as a repeatable path from question to decision context. Current surfaces are deterministic Demo foundations; filings, licensed research, and production AI are not connected."
          />
        </PublicReveal>

        <PublicReveal className="yt24-research-timeline" delay={0.08}>
          {researchSteps.map(([index, label, body], itemIndex) => (
            <article key={label}>
              <span className="yt24-timeline-index">{index}</span>
              <div className="yt24-timeline-node" aria-hidden="true">
                <i />
                {itemIndex < researchSteps.length - 1 ? <b /> : null}
              </div>
              <div>
                <h3>{label}</h3>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </PublicReveal>

        <PublicReveal className="yt24-research-dossier" delay={0.14}>
          <div className="yt24-dossier-topbar">
            <div>
              <BookOpenCheck aria-hidden="true" />
              <span>
                <strong>RESEARCH DOSSIER</strong>
                <small>Controlled product preview</small>
              </span>
            </div>
            <PublicTruthBadge label="Demo" />
          </div>
          <div className="yt24-dossier-grid">
            <div className="yt24-dossier-thesis">
              <span>WORKING THESIS · FIXED UI COPY</span>
              <h3>
                Can durable demand offset valuation and concentration risk?
              </h3>
              <p>
                A deliberately neutral prompt demonstrates structure without
                presenting an analyst recommendation.
              </p>
              <div>
                <span><Check aria-hidden="true" /> Bull case</span>
                <span><Check aria-hidden="true" /> Bear case</span>
                <span><Check aria-hidden="true" /> Disconfirming evidence</span>
              </div>
            </div>
            <div className="yt24-dossier-evidence">
              <span>EVIDENCE QUALITY</span>
              {[
                ["Company filings", "Not connected"],
                ["Licensed research", "Not connected"],
                ["Market observations", "Historical fixture"],
                ["User notes", "Local foundation"],
              ].map(([label, value], index) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <PublicStateDot tone={index < 2 ? "red" : index === 2 ? "blue" : "gold"} />
                </div>
              ))}
            </div>
          </div>
        </PublicReveal>
      </div>
    </section>
  );
}

export function AiIntelligenceSection() {
  return (
    <section
      id="ai-intelligence"
      className="yt24-section yt24-ai-section"
      aria-labelledby="yt24-ai-title"
      data-recording="ai-intelligence"
    >
      <div className="yt24-shell yt24-ai-grid">
        <PublicReveal className="yt24-ai-copy">
          <PublicSectionIntro
            index="05"
            eyebrow="AI INTELLIGENCE"
            title={
              <span id="yt24-ai-title">
                A synthesis layer that keeps its limits visible.
              </span>
            }
            body="Meridian AI is designed to organize evidence, identify tensions, and make the next research question clearer. Production model access is not active in this phase."
          />
          <div className="yt24-ai-boundaries">
            {[
              [ListTree, "Organize", "Structure evidence and competing interpretations."],
              [Sparkles, "Synthesize", "Surface themes with citations and confidence context."],
              [ShieldAlert, "Bound", "Keep provider state and model limitations visible."],
            ].map(([Icon, title, body]) => (
              <article key={String(title)}>
                <Icon aria-hidden="true" />
                <div>
                  <strong>{String(title)}</strong>
                  <p>{String(body)}</p>
                </div>
              </article>
            ))}
          </div>
        </PublicReveal>

        <PublicReveal className="yt24-ai-preview" delay={0.12}>
          <div className="yt24-ai-preview-glow" aria-hidden="true" />
          <div className="yt24-preview-topline">
            <span><BrainCircuit aria-hidden="true" /> MERIDIAN SYNTHESIS</span>
            <PublicTruthBadge label="AI-generated Demo" />
          </div>
          <div className="yt24-ai-question">
            <span>RESEARCH QUESTION</span>
            <p>What evidence would most materially change this thesis?</p>
          </div>
          <div className="yt24-ai-answer">
            <span>STATIC SAMPLE · NO MODEL CALL</span>
            <h3>Prioritize disconfirming evidence before adding confidence.</h3>
            <p>
              This fixed copy demonstrates the intended hierarchy. A future
              provider response would require citations, model identity, and
              confidence context.
            </p>
          </div>
          <div className="yt24-ai-source-row">
            <span><i /> Citations required</span>
            <span><i /> Confidence visible</span>
            <span><i /> Provider identity visible</span>
          </div>
          <div className="yt24-ai-provider-state">
            <span>Production model provider</span>
            <PublicTruthBadge label="Provider unavailable" />
          </div>
        </PublicReveal>
      </div>
    </section>
  );
}

export function TrustAndConversionSections() {
  const truthStates = [
    ["Demo", "Deterministic product fixtures that demonstrate interface behavior—not an account."],
    ["Historical", "Time-stamped past observations used for analytical structure and review."],
    ["Estimated", "Derived context presented with its assumptions and non-observed status visible."],
    ["AI-generated Demo", "Static model-style copy used only to demonstrate provenance hierarchy."],
    ["Provider unavailable", "An honest boundary when a required source is not approved or connected."],
  ] as const;

  return (
    <>
      <section
        id="trust"
        className="yt24-section yt24-trust-section"
        aria-labelledby="yt24-trust-title"
        data-recording="trust-provenance"
      >
        <div className="yt24-shell">
          <PublicReveal className="yt24-trust-heading">
            <PublicSectionIntro
              index="07"
              eyebrow="TRUST + PROVENANCE"
              title={
                <span id="yt24-trust-title">
                  The state of the information is part of the information.
                </span>
              }
              body="Meridian OS is being built around a visible provenance language. Polished presentation never turns an unavailable source, deterministic fixture, or model sample into an implied live signal."
            />
          </PublicReveal>

          <PublicReveal className="yt24-truth-ledger" delay={0.08}>
            {truthStates.map(([label, body], index) => (
              <article key={label}>
                <span className="yt24-truth-index">0{index + 1}</span>
                <PublicTruthBadge label={label} />
                <p>{body}</p>
              </article>
            ))}
          </PublicReveal>

          <PublicReveal className="yt24-trust-principles" delay={0.12}>
            <div>
              <ShieldAlert aria-hidden="true" />
              <strong>Session security</strong>
              <p>Opaque server-side sessions, HttpOnly cookies, CSRF protection, rotation, expiration, and revocation remain the foundation.</p>
            </div>
            <div>
              <Eye aria-hidden="true" />
              <strong>Visible boundaries</strong>
              <p>No brokerage, provider, account tier, membership, portfolio, production AI, or live-market state is implied here.</p>
            </div>
            <div>
              <CalendarDays aria-hidden="true" />
              <strong>Freshness in context</strong>
              <p>Current capability, timestamps, delay, estimation, and unavailable states are designed to travel with the output.</p>
            </div>
          </PublicReveal>
        </div>
      </section>

      <section className="yt24-final-section" aria-labelledby="yt24-final-title">
        <div className="yt24-final-atmosphere" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <PublicReveal className="yt24-shell yt24-final-content">
          <span className="yt24-kicker">THE NEXT DECISION STARTS HERE</span>
          <h2 id="yt24-final-title">
            Enter the market with more context—and fewer assumptions.
          </h2>
          <p>
            Open Meridian OS to review the authenticated product environment.
            Current data and intelligence states remain clearly labeled.
          </p>
          <Link className="yt24-button yt24-button-primary" href="/sign-in">
            Enter Meridian OS
            <ArrowRight aria-hidden="true" />
          </Link>
        </PublicReveal>
      </section>
    </>
  );
}
