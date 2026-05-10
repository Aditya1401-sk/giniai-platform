import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconX, IconSettings, IconUser, IconShield, IconGlobe } from "./Icons";

const NAV_ITEMS = [
  { id: "general", label: "General", icon: IconSettings },
  { id: "personalization", label: "Personalization", icon: IconGlobe },
  { id: "profile", label: "Profile", icon: IconUser },
  { id: "security", label: "Security", icon: IconShield },
  { id: "data", label: "Data controls", icon: null },
  { id: "account", label: "Account", icon: null },
];

const Toggle = ({ value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-input)] border border-[var(--border-color)]"}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
  </button>
);

const Select = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-lg px-3 py-1.5 focus:border-[var(--accent-primary)] transition-colors cursor-pointer"
  >
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const Row = ({ label, sub, children }) => (
  <div className="flex items-center justify-between py-4 border-b border-[var(--border-color)] last:border-0">
    <div>
      <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
      {sub && <div className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-xs">{sub}</div>}
    </div>
    {children}
  </div>
);

const GeneralTab = () => {
  const [appearance, setAppearance] = useState("System");
  const [language, setLanguage] = useState("Auto-detect");
  const [dictation, setDictation] = useState(true);

  const applyTheme = (val) => {
    setAppearance(val);
    const root = document.documentElement;
    if (val === "Dark") root.setAttribute("data-theme", "dark");
    else if (val === "Light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
  };

  return (
    <div>
      <Row label="Appearance"><Select value={appearance} onChange={applyTheme} options={["System", "Light", "Dark"]} /></Row>
      <Row label="Language"><Select value={language} onChange={setLanguage} options={["Auto-detect", "English", "Hindi", "Spanish"]} /></Row>
      <Row label="Enable Dictation" sub="Use dictation in the chat composer."><Toggle value={dictation} onChange={setDictation} /></Row>
    </div>
  );
};

const PersonalizationTab = () => {
  const [memory, setMemory] = useState(true);
  const [suggestions, setSuggestions] = useState(true);
  return (
    <div>
      <Row label="Memory" sub="GiniAI will remember things about you across conversations."><Toggle value={memory} onChange={setMemory} /></Row>
      <Row label="Chat suggestions" sub="Show follow-up suggestions after each response."><Toggle value={suggestions} onChange={setSuggestions} /></Row>
    </div>
  );
};

const SecurityTab = () => (
  <div>
    <Row label="Two-factor authentication" sub="Add an extra layer of security to your account.">
      <button className="text-xs px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Enable</button>
    </Row>
    <Row label="Active sessions" sub="View and manage devices where you're logged in.">
      <button className="text-xs px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Manage</button>
    </Row>
  </div>
);

const DataTab = () => {
  const [training, setTraining] = useState(false);
  return (
    <div>
      <Row label="Improve the model for everyone" sub="Your conversations may be used to train GiniAI when enabled."><Toggle value={training} onChange={setTraining} /></Row>
      <Row label="Export data" sub="Download a copy of all your conversations and data.">
        <button className="text-xs px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Export</button>
      </Row>
      <Row label="Delete all conversations" sub="Permanently delete all your conversation history.">
        <button className="text-xs px-3 py-1.5 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">Delete all</button>
      </Row>
    </div>
  );
};

const AccountTab = ({ onClose, handleLogout }) => (
  <div>
    <Row label="Email address" sub="The email associated with your account.">
      <span className="text-sm text-[var(--text-secondary)]">{localStorage.getItem("email") || "—"}</span>
    </Row>
    <Row label="Role" sub="Your platform access level.">
      <span className="text-xs px-2.5 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-full font-medium capitalize">{localStorage.getItem("role") || "—"}</span>
    </Row>
    <Row label="Log out" sub="Sign out from all devices.">
      <button onClick={handleLogout} className="text-xs px-3 py-1.5 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">Log out</button>
    </Row>
  </div>
);

export default function SettingsModal({ onClose, handleLogout }) {
  const [activeTab, setActiveTab] = useState("general");

  const TABS = {
    general: <GeneralTab />,
    personalization: <PersonalizationTab />,
    profile: <div className="text-[var(--text-secondary)] text-sm py-8 text-center">Open "Profile" from the profile dropdown to edit your name.</div>,
    security: <SecurityTab />,
    data: <DataTab />,
    account: <AccountTab handleLogout={handleLogout} />,
  };

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
        className="relative z-10 w-full max-w-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex"
        style={{ minHeight: 420 }}
      >
        {/* Left nav */}
        <div className="w-52 border-r border-[var(--border-color)] p-3 shrink-0">
          <div className="flex items-center justify-between mb-4 px-2 pt-1">
            <span className="text-base font-semibold text-[var(--text-primary)]">Settings</span>
            <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              <IconX size={16} />
            </button>
          </div>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  activeTab === item.id
                    ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.icon && <item.icon size={15} />}
                {!item.icon && <span className="w-4" />}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 capitalize">
            {NAV_ITEMS.find(n => n.id === activeTab)?.label}
          </h2>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.12 }}
            >
              {TABS[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
