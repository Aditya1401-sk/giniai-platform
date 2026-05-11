import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ThemeToggle from "../components/ThemeToggle";
import SettingsModal from "../components/SettingsModal";
import ProfileModal from "../components/ProfileModal";
import HelpModal from "../components/HelpModal";
import { 
  IconSend, IconBot, IconUser, IconMessageSquare, IconPlus, IconLogOut, 
  IconClock, IconSettings, IconSearch, IconPaperclip, 
  IconCheckCircle2, IconZap, IconX, IconMoreHorizontal, IconPin, IconShare, IconTrash2,
  IconChevronRight, IconMenu2
} from "../components/Icons";
import { API_BASE_URL } from "../config";

const ChatInterface = ({ roleTitle }) => {
  const userEmail = sessionStorage.getItem("email") || "guest";
  const storageKey = `chat_v2_${userEmail}_${roleTitle.toLowerCase()}`;

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  useEffect(() => {
    const fetchCloudChats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/chats/?email=${userEmail}&role=${roleTitle.toLowerCase()}`);
        if (res.data.length > 0) {
          setSessions(res.data);
          setActiveSessionId(res.data[0].id);
        } else {
          const fresh = { id: Date.now(), title: "New Conversation", messages: [] };
          setSessions([fresh]);
          setActiveSessionId(fresh.id);
        }
      } catch (err) {
        console.error("Cloud fetch failed:", err);
        const fresh = { id: Date.now(), title: "New Conversation", messages: [] };
        setSessions([fresh]);
        setActiveSessionId(fresh.id);
      }
    };
    fetchCloudChats();
  }, [userEmail, roleTitle]);

  const saveSessionToCloud = async (session) => {
    if (isTemporary) return;
    try {
      await axios.post(`${API_BASE_URL}/api/chats/save`, {
        ...session,
        email: userEmail,
        role: roleTitle.toLowerCase()
      });
    } catch (error) {
      console.error("Cloud save failed:", error);
    }
  };
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isTemporary, setIsTemporary] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePos, setProfilePos] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const activeSession = sessions.find(s => s.id === activeSessionId);
    if (activeSession) setChatHistory(activeSession.messages);
  }, [activeSessionId, sessions]);

  useEffect(() => {
    // Local storage acts as a fast cache now
    if (sessions.length > 0) localStorage.setItem(storageKey, JSON.stringify(sessions));
  }, [sessions, storageKey]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    sessionStorage.removeItem("email");
    // Clear all session visited flags to ensure fresh chat on next login
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('visited_')) sessionStorage.removeItem(key);
    });
    window.location.href = "/";
  };

  const createNewSession = () => {
    const newSession = { id: Date.now(), title: "New Conversation", messages: [] };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setPendingFile(null);
    setIsTemporary(false);
    saveSessionToCloud(newSession);
  };

  const deleteSession = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/chats/${id}?email=${userEmail}`);
    } catch (err) { console.error(err); }

    const updated = sessions.filter(s => s.id !== id);
    if (updated.length === 0) {
      const fresh = { id: Date.now(), title: "New Conversation", messages: [] };
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    } else {
      setSessions(updated);
      if (activeSessionId === id) setActiveSessionId(updated[0].id);
    }
    setOpenMenuId(null);
  };

  const pinSession = (id) => {
    setSessions(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s);
      const session = updated.find(s => s.id === id);
      saveSessionToCloud(session);
      return updated;
    });
    setOpenMenuId(null);
  };

  const shareSession = (id) => {
    const session = sessions.find(s => s.id === id);
    const text = session.messages.map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`).join('\n\n');
    navigator.clipboard.writeText(text).then(() => alert(`Chat "${session.title}" copied to clipboard!`));
    setOpenMenuId(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingFile(file);
    e.target.value = "";
  };

  const removePendingFile = () => setPendingFile(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmedMsg = message.trim();
    if (!trimmedMsg && !pendingFile) return;

    const role = sessionStorage.getItem("role") || "guest";

    let userContent = trimmedMsg;
    if (pendingFile && trimmedMsg) {
      userContent = `📎 **${pendingFile.name}**\n\n${trimmedMsg}`;
    } else if (pendingFile) {
      userContent = `📎 **${pendingFile.name}**\n\nPlease read and explain this document.`;
    }

    const userMsg = { role: "user", content: userContent, timestamp: new Date().toLocaleTimeString() };
    const botPlaceholder = { role: "bot", content: "", timestamp: new Date().toLocaleTimeString() };
    const updatedHistory = [...chatHistory, userMsg];

    setChatHistory([...updatedHistory, botPlaceholder]);
    setMessage("");
    const fileToUpload = pendingFile;
    setPendingFile(null);
    setIsTyping(true);

    let docPrompt = trimmedMsg;
    if (fileToUpload) {
      try {
        const formData = new FormData();
        formData.append("file", fileToUpload);
        const uploadRes = await fetch(`${API_BASE_URL}/api/files/upload`, { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.error) {
          setChatHistory(prev => { const h = [...prev]; h[h.length - 1] = { ...h[h.length - 1], content: `❌ Upload failed: ${uploadData.error}` }; return h; });
          setIsTyping(false);
          return;
        }
        setUploadStatus({ name: fileToUpload.name });
        setTimeout(() => setUploadStatus(null), 3000);
        docPrompt = trimmedMsg
          ? `I have uploaded a document called "${fileToUpload.name}". ${trimmedMsg}`
          : `I have uploaded a document called "${fileToUpload.name}". Please read it carefully and provide a detailed explanation of its contents, key points, and main ideas.`;
      } catch (err) {
        console.error("Upload error:", err);
        setIsTyping(false);
        return;
      }
    }

    try {
      const aiResponse = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: docPrompt, role, email: userEmail, history: chatHistory })
      });
      if (!aiResponse.body) return;
      const reader = aiResponse.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";
      setIsTyping(false);
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulatedResponse += decoder.decode(value, { stream: true });
        setChatHistory(prev => { const h = [...prev]; h[h.length - 1] = { ...h[h.length - 1], content: accumulatedResponse }; return h; });
        setSessions(prev => {
          const updated = prev.map(s => s.id === activeSessionId ? {
            ...s,
            messages: [...updatedHistory, { ...botPlaceholder, content: accumulatedResponse }],
            title: s.messages.length === 0 ? userContent.substring(0, 30) + "..." : s.title
          } : s);
          // Save only when done for efficiency, but here we can save once title is generated
          if (done) {
             const session = updated.find(s => s.id === activeSessionId);
             saveSessionToCloud(session);
          }
          return updated;
        });
      }
    } catch (error) {
      console.error("Stream error:", error);
      setIsTyping(false);
    }
  };

  const sortedSessions = [...sessions]
    .filter(s => (s.messages.length > 0 || s.id === activeSessionId) && (!s.temp || s.id === activeSessionId))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const activeContextSession = sessions.find(s => s.id === openMenuId);

  return (
    <>
      <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans relative overflow-hidden">
        {/* MOBILE SIDEBAR OVERLAY */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* SIDEBAR */}
        <motion.div 
          initial={false}
          animate={{ x: isMobile ? (sidebarOpen ? 0 : -280) : 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`fixed md:relative w-[280px] h-full bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col z-40 md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:flex"}`}
        >
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--accent-primary)] text-white rounded-lg shadow-sm">
                  <IconZap size={20} />
                </div>
                <h1 className="text-xl font-bold tracking-tight">GiniAI</h1>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <IconX size={20} />
              </button>
            </div>

            <button onClick={createNewSession} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors text-sm font-medium mb-2">
              <IconPlus size={16} /> New Chat
            </button>

            {/* Temporary Chat */}
            <button
              onClick={() => {
                setIsTemporary(true);
                const tempSession = { id: Date.now(), title: "⚡ Temporary Chat", messages: [], temp: true };
                setSessions(prev => [tempSession, ...prev]);
                setActiveSessionId(tempSession.id);
                setPendingFile(null);
              }}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium mb-6 transition-colors ${
                isTemporary
                  ? "border-amber-400/40 text-amber-400 bg-amber-400/5"
                  : "border-[var(--border-color)] text-[var(--text-secondary)] hover:border-amber-400/40 hover:text-amber-400"
              }`}
            >
              <span className="text-base">⚡</span> Temporary Chat
            </button>

            <div className="space-y-1 overflow-y-auto flex-1 custom-scrollbar pr-1">
              <h2 className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-bold mb-4 ml-1">Recent Chats</h2>
              {sortedSessions.map((session) => (
                <div key={session.id} className="relative group">
                  <button
                    onClick={() => { 
                      setActiveSessionId(session.id); 
                      setOpenMenuId(null); 
                      setIsTemporary(false);
                      setSidebarOpen(false); // Close on mobile
                    }}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors pr-8 ${
                      activeSessionId === session.id
                        ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {session.pinned
                      ? <IconPin size={14} className="shrink-0 text-[var(--accent-primary)]" />
                      : <IconMessageSquare size={16} className="shrink-0" />
                    }
                    <span className="truncate text-sm flex-1">{session.title}</span>
                  </button>

                  {/* 3-dot button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (openMenuId === session.id) {
                        setOpenMenuId(null);
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuPos({ x: rect.right, y: rect.bottom + 4 });
                        setOpenMenuId(session.id);
                      }
                    }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-opacity ${
                      openMenuId === session.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <IconMoreHorizontal size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* PROFILE BUTTON at bottom */}
            <div className="border-t border-[var(--border-color)] pt-4 mt-4">
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setProfilePos({ x: rect.left, y: rect.top });
                  setProfileOpen(prev => !prev);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors group"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {userEmail[0]?.toUpperCase()}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{userEmail.split('@')[0]}</div>
                  <div className="text-xs text-[var(--text-secondary)] truncate">{userEmail}</div>
                </div>
                <IconChevronRight size={16} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col relative bg-[var(--bg-primary)] min-w-0">
          <header className="p-4 md:p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)] sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 md:hidden text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
              >
                <IconMenu2 size={24} />
              </button>
              <div>
                <h2 className="text-lg md:text-xl font-semibold truncate max-w-[150px] md:max-w-none">{roleTitle} Workspace</h2>
                {isTemporary && <span className="text-[10px] md:text-xs text-amber-400 font-medium">⚡ Temporary</span>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </header>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center mb-6">
                  <IconBot size={32} className="text-[var(--text-secondary)]" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-2">How can I help you today?</h3>
                <p className="text-[var(--text-secondary)] text-sm max-w-md">Attach a document using the paperclip, type your question, and hit send.</p>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)]'}`}>
                    {msg.role === 'user' ? <IconUser size={16} /> : <IconBot size={16} />}
                  </div>
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                    <div className={`p-4 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[var(--bg-tertiary)] border border-[var(--border-color)]' : 'bg-transparent'}`}>
                      <div className="prose prose-sm max-w-none prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                    {msg.role === 'bot' && msg.timestamp && (
                      <div className="flex items-center gap-1.5 mt-2 opacity-50">
                        <IconClock size={10} />
                        <span className="text-[10px] font-medium uppercase">{msg.timestamp}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
            {isTyping && (
              <div className="flex gap-4 max-w-4xl mx-auto">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center shrink-0 mt-1">
                  <IconBot size={16} className="text-[var(--text-secondary)]" />
                </div>
                <div className="p-4 flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="p-4 md:p-6 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
              <AnimatePresence>
                {pendingFile && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    className="mb-2 flex items-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--accent-primary)]/30 rounded-lg w-fit">
                    <IconPaperclip size={14} className="text-[var(--accent-primary)]" />
                    <span className="text-sm font-medium truncate max-w-[200px]">{pendingFile.name}</span>
                    <button type="button" onClick={removePendingFile} className="ml-1 text-[var(--text-secondary)] hover:text-[var(--accent-danger)] transition-colors">
                      <IconX size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="relative">
                <button type="button" onClick={() => fileInputRef.current.click()}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors" title="Attach file">
                  <IconPaperclip size={20} className={pendingFile ? "text-[var(--accent-primary)]" : ""} />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <input
                  type="text"
                  placeholder={pendingFile ? `Ask something about ${pendingFile.name}...` : "Message GiniAI..."}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl py-4 pl-14 pr-16 text-[var(--text-primary)] focus:border-[var(--accent-primary)] transition-colors text-sm"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button type="submit" disabled={(!message.trim() && !pendingFile) || isTyping}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-colors">
                  <IconSend size={18} />
                </button>
              </div>
            </form>

            <AnimatePresence>
              {uploadStatus && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-center mt-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-xs font-medium rounded-md border border-emerald-500/20">
                    <IconCheckCircle2 size={14} /> Indexed: {uploadStatus.name}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-center mt-3">
              <p className="text-[11px] text-[var(--text-secondary)]">GiniAI can make mistakes. Consider verifying important information.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FIXED CONTEXT MENU — rendered outside scroll container to avoid clipping */}
      <AnimatePresence>
        {openMenuId && activeContextSession && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              style={{ position: 'fixed', left: menuPos.x, top: menuPos.y, transform: 'translateX(-100%)' }}
              className="z-50 w-44 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-2xl overflow-hidden"
            >
              <button onClick={() => shareSession(activeContextSession.id)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                <IconShare size={14} /> Share
              </button>
              <button onClick={() => pinSession(activeContextSession.id)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                <IconPin size={14} /> {activeContextSession.pinned ? "Unpin" : "Pin"}
              </button>
              <div className="h-px bg-[var(--border-color)] mx-2" />
              <button onClick={() => deleteSession(activeContextSession.id)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                <IconTrash2 size={14} /> Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PROFILE DROPDOWN */}
      <AnimatePresence>
        {profileOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              style={{ position: 'fixed', left: profilePos.x, bottom: `calc(100vh - ${profilePos.y}px + 8px)`, minWidth: 260 }}
              className="z-50 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden"
            >
              {/* User info header */}
              <div className="flex items-center gap-3 p-4 border-b border-[var(--border-color)]">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {userEmail[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{userEmail.split('@')[0]}</div>
                  <div className="text-xs text-[var(--text-secondary)] truncate">{userEmail}</div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button 
                  onClick={() => { setShowSettings(true); setProfileOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <div className="flex items-center gap-3"><IconSettings size={16} /> Settings</div>
                </button>
                <button 
                  onClick={() => { setShowProfile(true); setProfileOpen(false); }}
                  className="w-full flex items-center px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors gap-3"
                >
                  <IconUser size={16} /> Profile
                </button>
                <div className="h-px bg-[var(--border-color)] my-1 mx-3" />
                <button 
                  onClick={() => { setShowHelp(true); setProfileOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Help
                  </div>
                  <IconChevronRight size={14} />
                </button>
                <div className="h-px bg-[var(--border-color)] my-1 mx-3" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <IconLogOut size={16} /> Log out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsModal 
            onClose={() => setShowSettings(false)} 
            handleLogout={handleLogout} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfile && (
          <ProfileModal 
            onClose={() => setShowProfile(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && (
          <HelpModal 
            onClose={() => setShowHelp(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatInterface;
