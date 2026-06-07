import { useState } from "react";
import { motion } from "framer-motion";
import { TerminalSquare, Send, Sparkles, TrendingUp, FileText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [
  "What is the bull thesis for $NVDA in 2025?",
  "Compare $SMR vs $KTOS as long-term holds",
  "Explain cup and handle pattern for beginners",
  "What are the risks in the AI semiconductor space?",
  "How should I size a position for a high-conviction breakout?",
];

const REPORTS = [
  { title: "AI Infrastructure Deep Dive — Q2 2025", date: "Jun 1, 2025", tags: ["AI", "Semis", "NVDA", "AVGO"], type: "Macro" },
  { title: "Small Nuclear: SMR vs OKLO vs NNE", date: "May 24, 2025", tags: ["Nuclear", "SMR", "OKLO"], type: "Sector" },
  { title: "Crypto Market Structure — Bull or Fake-Out?", date: "May 18, 2025", tags: ["BTC", "ETH", "SOL", "Crypto"], type: "Macro" },
  { title: "Defense Tech Tailwinds — KTOS & RTX Analysis", date: "May 10, 2025", tags: ["Defense", "KTOS", "RTX"], type: "Sector" },
  { title: "Momentum Scanner Backtest Results — Jan–May 2025", date: "May 5, 2025", tags: ["Strategy", "Momentum"], type: "Research" },
];

type Message = { role: "user" | "ai"; content: string };

const MOCK_RESPONSES: Record<string, string> = {
  default: "Based on current market structure and technical setup, here is the analysis:\n\n**Fundamental thesis:** The company operates in a high-growth sector with strong secular tailwinds. Earnings growth trajectory remains intact with management executing well on guidance.\n\n**Technical picture:** Currently consolidating near key support levels after a healthy pullback from recent highs. Volume patterns suggest institutional accumulation.\n\n**Risk factors to monitor:** Macro rate environment, sector rotation risk, and concentration in single-name exposure.\n\n*Note: This is informational only. Not financial advice.*",
};

export default function Research() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Welcome to the AI Research Terminal. Ask me anything about stocks, crypto, trading strategies, or market analysis. I can help with fundamental analysis, technical setups, and position sizing." },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const send = (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim()) return;
    setInput("");
    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        role: "ai",
        content: MOCK_RESPONSES[msg] ?? MOCK_RESPONSES.default,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden p-6 gap-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <TerminalSquare className="w-5 h-5 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">AI Research Terminal</h1>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold ml-1">GPT-4o</span>
        </div>
        <p className="text-muted-foreground text-sm ml-8">Ask about any stock, strategy, or market condition — AI-powered analysis</p>
      </motion.div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Chat */}
        <div className="flex-1 flex flex-col glass-card overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                <div className={cn("w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold", msg.role === "ai" ? "bg-primary/20 text-primary" : "bg-muted text-foreground")}>
                  {msg.role === "ai" ? <Sparkles className="w-4 h-4" /> : "TX"}
                </div>
                <div className={cn("max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed", msg.role === "ai" ? "bg-muted/50 text-foreground" : "bg-primary text-primary-foreground")}>
                  {msg.content.split("\n").map((line, j) => {
                    if (line.startsWith("**") && line.endsWith("**")) {
                      return <p key={j} className="font-semibold mt-2 first:mt-0">{line.replace(/\*\*/g, "")}</p>;
                    }
                    if (line.startsWith("*") && line.endsWith("*")) {
                      return <p key={j} className="italic opacity-70 mt-1 text-xs">{line.replace(/\*/g, "")}</p>;
                    }
                    return line ? <p key={j} className="mt-1 first:mt-0">{line}</p> : <br key={j} />;
                  })}
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted/50 rounded-xl px-4 py-3 flex items-center gap-1">
                  {[0, 1, 2].map((j) => (
                    <span key={j} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Presets */}
          <div className="flex gap-2 px-4 py-2 border-t border-border/50 overflow-x-auto scrollbar-hide">
            {PRESETS.slice(0, 3).map((p) => (
              <button key={p} onClick={() => send(p)} className="flex-shrink-0 text-[10px] px-2 py-1 rounded bg-muted/50 text-muted-foreground border border-border/50 hover:text-foreground hover:border-primary/30 transition-colors">
                {p.slice(0, 40)}…
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border/50">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={2}
                placeholder="Ask about any stock, strategy, or market condition… (Enter to send)"
                className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none font-sans"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || isTyping}
                className="px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Reports sidebar */}
        <div className="w-72 flex-shrink-0 space-y-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-display font-semibold text-foreground">Research Reports</h3>
            </div>
            <div className="space-y-2">
              {REPORTS.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="p-3 rounded-lg bg-background/60 border border-border/40 hover:border-primary/30 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors leading-snug">{r.title}</p>
                    <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{r.type}</span>
                    <span className="text-[10px] text-muted-foreground">{r.date}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {r.tags.map((tag) => (
                      <span key={tag} className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick presets */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-display font-semibold text-foreground">Quick Analysis</h3>
            </div>
            <div className="space-y-1.5">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => send(p)}
                  className="w-full text-left text-xs p-2 rounded bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/30"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
