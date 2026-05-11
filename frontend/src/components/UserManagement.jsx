import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { IconPlus, IconEdit, IconTrash2, IconX, IconUser, IconShield, IconMail, IconBadgeCheck, IconFingerprint, IconHash } from "../components/Icons";
import { API_BASE_URL } from "../config";

const UserManagement = ({ onUserUpdate }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });

  const roles = ["admin", "management", "sales", "developer"];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/users`);
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  const getPreviewId = () => {
    if (editingUser) return editingUser.custom_id;
    
    const prefixMap = { admin: "E", management: "M", sales: "S", developer: "D" };
    const prefix = prefixMap[formData.role] || "X";
    const count = users.filter(u => u.role === formData.role).length;
    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/auth/users`, formData);
      setShowModal(false);
      resetForm();
      fetchUsers();
      if (onUserUpdate) onUserUpdate();
    } catch (error) {
      alert(error.response?.data?.detail || "Error adding user");
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/auth/users/${editingUser.email}`, {
        name: formData.name,
        email: formData.email,
        password: formData.password || undefined,
        role: formData.role,
      });
      setShowModal(false);
      resetForm();
      fetchUsers();
      if (onUserUpdate) onUserUpdate();
    } catch (error) {
      alert(error.response?.data?.detail || "Error updating user");
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", role: "admin" });
  };

  const handleDeleteUser = async (email) => {
    if (window.confirm(`Are you sure you want to delete ${email}?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/auth/users/${email}`);
        fetchUsers();
        if (onUserUpdate) onUserUpdate();
      } catch (error) {
        alert(error.response?.data?.detail || "Error deleting user");
      }
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name || "", 
      email: user.email, 
      password: "", 
      role: user.role 
    });
    setShowModal(true);
  };

  return (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <IconFingerprint size={24} className="text-[var(--accent-primary)]" /> User Management
          </h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Manage system access and roles</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg font-medium hover:bg-[var(--accent-hover)] transition-colors"
        >
          <IconPlus size={18} /> Add New User
        </button>
      </div>

      <div className="solid-card overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
              <th className="p-4 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">ID</th>
              <th className="p-4 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Name / Email</th>
              <th className="p-4 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Role</th>
              <th className="p-4 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {users.map((user, index) => (
                <motion.tr
                  key={user.email}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <td className="p-4">
                    <span className="font-mono text-[var(--accent-primary)] font-semibold text-sm bg-[var(--accent-primary)]/10 px-2 py-1 rounded">
                      {user.custom_id || "NEW"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                        <IconUser size={18} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-[var(--text-primary)] truncate">{user.name || "Unnamed"}</span>
                        <span className="text-sm text-[var(--text-secondary)] truncate">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full border border-[var(--border-color)] text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--bg-tertiary)]">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                        title="Edit User"
                      >
                        <IconEdit size={18} />
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user.email)}
                          className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-danger)] transition-colors"
                          title="Delete User"
                        >
                          <IconTrash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {users.length === 0 && !loading && (
          <div className="p-12 text-center text-[var(--text-secondary)] text-sm">No users found. Start by adding one.</div>
        )}
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/60" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md solid-card p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <IconBadgeCheck className="text-[var(--accent-primary)]" size={20} /> {editingUser ? "Update Employee" : "New Onboarding"}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><IconX size={20} /></button>
              </div>

              <form onSubmit={editingUser ? handleEditUser : handleAddUser} className="space-y-4">
                {/* ID FIELD (AUTO-GENERATED PREVIEW) */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Assigned ID</label>
                  <div className="relative">
                    <IconHash className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent-primary)]" size={16} />
                    <input
                      type="text"
                      disabled
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--accent-primary)]/20 rounded-lg py-2.5 pl-10 pr-4 text-[var(--accent-primary)] font-mono font-bold focus:outline-none text-sm"
                      value={getPreviewId()}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Full Name</label>
                  <div className="relative">
                    <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      required
                      className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg py-2.5 pl-10 pr-4 text-[var(--text-primary)] focus:border-[var(--accent-primary)] text-sm transition-colors"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Work Email</label>
                  <div className="relative">
                    <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                    <input
                      type="email"
                      placeholder="email@company.com"
                      required
                      className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg py-2.5 pl-10 pr-4 text-[var(--text-primary)] focus:border-[var(--accent-primary)] text-sm transition-colors disabled:opacity-50"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Department / Role</label>
                  <div className="relative">
                    <IconShield className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                    <select
                      className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg py-2.5 pl-10 pr-4 text-[var(--text-primary)] focus:border-[var(--accent-primary)] text-sm transition-colors appearance-none cursor-pointer"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>{role.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    {editingUser ? "New Password (Optional)" : "Security Password"}
                  </label>
                  <div className="relative">
                    <IconFingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      required={!editingUser}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg py-2.5 pl-10 pr-4 text-[var(--text-primary)] focus:border-[var(--accent-primary)] text-sm transition-colors"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[var(--accent-primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--accent-hover)] transition-colors mt-6"
                >
                  {editingUser ? "Confirm Changes" : "Activate Employee"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
