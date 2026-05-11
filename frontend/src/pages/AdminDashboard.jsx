import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import UserManagement from "../components/UserManagement";
import ThemeToggle from "../components/ThemeToggle";
import { API_BASE_URL } from "../config";
import { 
  IconLogOut, 
  IconMessageSquare, 
  IconActivity, 
  IconShieldCheck, 
  IconSend, 
  IconBot, 
  IconChevronDown, 
  IconChevronUp, 
  IconZap, 
  IconGlobe, 
  IconCpu,
  IconTrash2,
  IconUser,
  IconHistory
} from "../components/Icons";

function AdminDashboard() {
  const [stats, setStats] = useState({
    aiRequests: 0,
    status: "Active",
    name: "Admin"
  });

  const [logs, setLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "bot", content: "Hello Admin! I am the GiniLytics AI. How can I assist you with platform monitoring today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics"); // analytics, users, profile, history
  const chatEndRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchStatsAndLogs();
    const interval = setInterval(fetchStatsAndLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  const fetchStatsAndLogs = async () => {
    try {
      const [statsRes, logsRes, usersRes, allLogsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/stats/stats`),
        axios.get(`${API_BASE_URL}/api/stats/logs`),
        axios.get(`${API_BASE_URL}/auth/users`),
        axios.get(`${API_BASE_URL}/api/stats/logs/all`)
      ]);
      const email = sessionStorage.getItem("email");
      const currentUser = usersRes.data.find(u => u.email === email);
      setStats({ ...statsRes.data, name: currentUser?.name || email?.split('@')[0] || "Admin" });
      setLogs(logsRes.data);
      setAllLogs(allLogsRes.data);
    } catch (error) {
      console.error("Error fetching live data:", error);
    }
  };

  const handleClearLogs = async () => {
    if (window.confirm("⚠️ This will permanently delete all activity history. This action cannot be undone. Are you sure?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/stats/logs/clear`);
        fetchStatsAndLogs();
      } catch (error) {
        alert("Error clearing logs");
      }
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/stats/logs/${id}`);
      fetchStatsAndLogs();
    } catch (error) {
      alert("Error deleting log entry");
    }
  };

  const handleLogout = async () => {
    try {
      const email = sessionStorage.getItem("email");
      if (email) await axios.post(`${API_BASE_URL}/auth/offline`, { email });
    } catch (e) {}
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    sessionStorage.removeItem("email");
    window.location.href = "/";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userEmail = sessionStorage.getItem("email") || "admin";
    const userMsg = { role: "user", content: message };
    const botPlaceholder = { role: "bot", content: "" };
    setChatHistory(prev => [...prev, userMsg, botPlaceholder]);
    setMessage("");
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, role: "admin", email: userEmail })
      });

      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";

      setIsTyping(false);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;

        setChatHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1] = { ...newHistory[newHistory.length - 1], content: accumulatedResponse };
          return newHistory;
        });
      }
      fetchStatsAndLogs();
    } catch (error) {
      console.error("Stream error:", error);
      setIsTyping(false);
    }
  };

  const handleDeleteUser = async (email) => {
    if (window.confirm(`Are you sure you want to remove ${email} from the platform?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/auth/users/${email}`);
        fetchStatsAndLogs();
      } catch (error) {
        alert(error.response?.data?.detail || "Error deleting user");
      }
    }
  };

  const statCards = [
    { title: "Live Presence", value: stats.liveUsers || 0, icon: IconGlobe, colorClass: "text-blue-500", bgClass: "bg-blue-500/10" },
    { title: "Total Users", value: stats.totalUsers || 0, icon: IconShieldCheck, colorClass: "text-[var(--accent-primary)]", bgClass: "bg-[var(--accent-primary)]/10" },
    { title: "Neural Compute", value: stats.aiRequests || 0, icon: IconCpu, colorClass: "text-cyan-500", bgClass: "bg-cyan-500/10" },
  ];

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 md:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[var(--accent-primary)] text-white rounded-lg shadow-sm">
              <IconShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Workspace</h1>
              <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium">Enterprise Command Center</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg font-medium text-sm hover:text-[var(--accent-danger)] hover:border-[var(--accent-danger)] transition-colors"
            >
              <IconLogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-1 mb-8 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)] w-fit">
          <button 
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
          >
            <IconActivity size={16} /> Analytics
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
          >
            <IconShieldCheck size={16} /> User Management
          </button>
          <button 
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
          >
            <IconUser size={16} /> Profile
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
          >
            <IconHistory size={16} /> History
          </button>
        </div>

        {activeTab === "analytics" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {statCards.map((card) => (
                <div key={card.title} className="solid-card p-6 flex flex-col justify-between h-[160px]">
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-lg ${card.bgClass} ${card.colorClass}`}>
                      <card.icon size={24} />
                    </div>
                    {card.title === "System Core" && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider mb-1">{card.title}</h2>
                    <div className="text-4xl font-bold tracking-tight tabular-nums">{card.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* LOGS AREA */}
            <div className="solid-card p-6 min-h-[400px] flex flex-col">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-6 flex items-center gap-2 border-b border-[var(--border-color)] pb-4">
                <IconActivity size={18} className="text-[var(--accent-primary)]" /> System Logs
              </h2>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {logs.length === 0 ? (
                  <div className="text-center py-10 text-[var(--text-secondary)] text-sm">No activity recorded yet.</div>
                ) : (
                  logs.map((log) => (
                    <div key={log._id} className="flex gap-3 group/log">
                      <div className="flex flex-col items-center pt-1.5">
                        <div className={`w-2 h-2 rounded-full ${log.type === 'ai' ? 'bg-cyan-500' : log.type === 'auth' ? 'bg-[var(--accent-primary)]' : 'bg-gray-500'}`} />
                        <div className="w-[1px] h-full bg-[var(--border-color)] mt-1.5" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-[var(--text-primary)] font-medium leading-tight mb-1">{log.event}</p>
                            {log.user_email && log.user_email !== "unknown" && (
                              <p className="text-[10px] text-[var(--accent-primary)] font-mono mb-1">{log.user_email}</p>
                            )}
                          </div>
                          {log.user_email && log.user_email !== "unknown" && log.type === "ai" && (
                            <button 
                              onClick={() => handleDeleteUser(log.user_email)}
                              className="p-1.5 text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover/log:opacity-100 transition-opacity"
                              title="Remove this user"
                            >
                              <IconTrash2 size={14} />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                           <span>{log.time}</span>
                           <span className="opacity-50">•</span>
                           <span className="uppercase tracking-wider font-semibold text-[10px]">{log.type}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <UserManagement onUserUpdate={fetchStatsAndLogs} />
          </motion.div>
        )}

        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="solid-card p-10 max-w-2xl mx-auto">
             <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-xl">
                  {stats.name?.[0]?.toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold mb-2">{stats.name}</h2>
                <p className="text-[var(--text-secondary)] mb-6">{sessionStorage.getItem("email")}</p>
                <div className="px-4 py-1.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-full text-xs font-bold uppercase tracking-widest border border-[var(--accent-primary)]/20">
                   Role: Administrator
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4 mt-12 border-t border-[var(--border-color)] pt-8">
                <div className="p-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                   <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">Account Type</p>
                   <p className="text-sm font-semibold">Corporate Admin</p>
                </div>
                <div className="p-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                   <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">Security Level</p>
                   <p className="text-sm font-semibold text-emerald-500">Tier 1 (Root)</p>
                </div>
             </div>
          </motion.div>
        )}
        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h2 className="text-xl font-bold">System Audit Logs</h2>
                  <p className="text-sm text-[var(--text-secondary)]">Complete history of platform activity</p>
               </div>
               <button 
                 onClick={handleClearLogs}
                 className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
               >
                 <IconTrash2 size={14} /> Reset All Logs
               </button>
            </div>

            <div className="solid-card overflow-hidden">
               <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                     <thead className="sticky top-0 bg-[var(--bg-secondary)] z-10">
                        <tr className="border-b border-[var(--border-color)]">
                           <th className="p-4 text-[10px] uppercase font-bold text-[var(--text-secondary)]">Time</th>
                           <th className="p-4 text-[10px] uppercase font-bold text-[var(--text-secondary)]">Type</th>
                           <th className="p-4 text-[10px] uppercase font-bold text-[var(--text-secondary)]">User</th>
                           <th className="p-4 text-[10px] uppercase font-bold text-[var(--text-secondary)]">Event</th>
                           <th className="p-4 text-[10px] uppercase font-bold text-[var(--text-secondary)] text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[var(--border-color)]">
                        {allLogs.length === 0 ? (
                           <tr>
                              <td colSpan="5" className="p-10 text-center text-[var(--text-secondary)]">No logs available.</td>
                           </tr>
                        ) : (
                           allLogs.map((log) => (
                              <tr key={log._id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                                 <td className="p-4 text-xs font-mono text-[var(--text-secondary)] whitespace-nowrap">{log.time}</td>
                                 <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.type === 'ai' ? 'bg-cyan-500/10 text-cyan-500' : log.type === 'auth' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'bg-gray-500/10 text-gray-500'}`}>
                                       {log.type}
                                    </span>
                                 </td>
                                 <td className="p-4 text-xs font-semibold whitespace-nowrap">{log.user_email}</td>
                                 <td className="p-4 text-xs text-[var(--text-primary)] leading-relaxed min-w-[300px] break-words">{log.event}</td>
                                 <td className="p-4 text-right">
                                    <button 
                                      onClick={() => handleDeleteLog(log._id)}
                                      className="p-1.5 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                                      title="Delete specific entry"
                                    >
                                      <IconTrash2 size={14} />
                                    </button>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* FLOATING AI CHAT */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
        <AnimatePresence>
          {chatOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.95 }} 
              transition={{ duration: 0.2 }}
              className="mb-4 w-[400px] solid-card flex flex-col overflow-hidden h-[500px] shadow-2xl"
            >
              <div className="p-4 bg-[var(--bg-tertiary)] border-b border-[var(--border-color)] flex justify-between items-center">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <div className="p-1.5 bg-[var(--accent-primary)] text-white rounded-md"><IconBot size={16} /></div> 
                  Admin Assistant
                </div>
                <button onClick={() => setChatOpen(false)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors">
                  <IconChevronDown size={18}/>
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-[var(--bg-primary)]">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[var(--accent-primary)] text-white rounded-tr-sm' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-tl-sm border border-[var(--border-color)] prose prose-sm prose-invert max-w-none'}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-xl rounded-tl-sm border border-[var(--border-color)] flex gap-1.5 items-center">
                      <div className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-pulse" />
                      <div className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-pulse delay-75" />
                      <div className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-pulse delay-150" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-[var(--bg-tertiary)] border-t border-[var(--border-color)] flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ask assistant..." 
                  className="flex-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm focus:border-[var(--accent-primary)] transition-colors" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                />
                <button 
                  type="submit" 
                  disabled={!message.trim() || isTyping} 
                  className="p-2.5 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
                >
                  <IconSend size={18} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setChatOpen(!chatOpen)} 
          className="w-14 h-14 bg-[var(--accent-primary)] rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[var(--accent-hover)] transition-colors relative"
        >
          {chatOpen ? <IconChevronDown size={24} /> : <IconMessageSquare size={24} />}
          {!chatOpen && <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[var(--bg-primary)]"></span>}
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;