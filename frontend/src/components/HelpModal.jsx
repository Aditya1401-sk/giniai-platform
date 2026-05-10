import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconX } from "./Icons";

const SHORTCUTS = [
  { key: "⌘ + /", label: "Open Keyboard Shortcuts" },
  { key: "⌘ + K", label: "Search chats" },
  { key: "⌘ + [", label: "Toggle sidebar" },
  { key: "⌘ + Shift + O", label: "New chat" },
  { key: "⌘ + Shift + L", label: "Log out" },
  { key: "Esc", label: "Close modal" }
];

const FAQS = [
  { q: "How do I upload multiple files?", a: "Currently, we support one file per prompt. Select a new file to replace the current one before sending." },
  { q: "What file types are supported?", a: "We support PDF, Word (.docx), PowerPoint (.pptx), and common image formats." },
  { q: "Is my data secure?", a: "Yes, all documents are encrypted and processed in a secure isolated environment." }
];

export default function HelpModal({ onClose }) {
  const [view, setView] = React.useState("main");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.18 }}
        className="relative z-10 w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {view !== "main" && (
                <button onClick={() => setView("main")} className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
              )}
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {view === "main" ? "Help & Support" : view === "shortcuts" ? "Keyboard Shortcuts" : "Help Center"}
              </h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              <IconX size={20} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {view === "main" ? (
              <motion.div key="main" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="grid grid-cols-1 gap-3">
                <button onClick={() => setView("shortcuts")} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)]/40 transition-all text-left group">
                  <div className="text-2xl">⌨️</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">Keyboard Shortcuts</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">Learn how to use GiniAI faster with shortcuts.</div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)] group-hover:translate-x-1 transition-transform"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <button onClick={() => setView("faqs")} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)]/40 transition-all text-left group">
                  <div className="text-2xl">📚</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">Help Center</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">Browse our articles and guides for help.</div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)] group-hover:translate-x-1 transition-transform"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <button className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)]/40 transition-all text-left group opacity-60 cursor-not-allowed">
                  <div className="text-2xl">💬</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">Contact Support</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">Get in touch with our team for assistance.</div>
                  </div>
                </button>
              </motion.div>
            ) : view === "shortcuts" ? (
              <motion.div key="shortcuts" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-2">
                {SHORTCUTS.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)]">
                    <span className="text-sm text-[var(--text-primary)]">{s.label}</span>
                    <kbd className="px-2 py-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded text-[10px] font-mono text-[var(--text-secondary)]">{s.key}</kbd>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div key="faqs" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                {FAQS.map((f, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{f.q}</div>
                    <div className="text-xs text-[var(--text-secondary)] leading-relaxed">{f.a}</div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center">
            <p className="text-xs text-[var(--text-secondary)] opacity-50">
              GiniAI Platform Version 2.4.0<br/>
              © 2026 GiniLytics AI. All rights reserved.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
