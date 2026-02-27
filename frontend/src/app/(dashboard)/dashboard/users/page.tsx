'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { User, Role } from '@/lib/types';
import PermissionGate from '@/components/PermissionGate';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', roleId: '' });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([api.get('/users'), api.get('/roles')]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        const payload: Record<string, string> = { name: form.name, email: form.email, roleId: form.roleId };
        if (form.password) payload.password = form.password;
        await api.patch(`/users/${editingId}`, payload);
      } else {
        await api.post('/users', form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', email: '', password: '', roleId: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const startEdit = (user: User) => {
    setForm({ name: user.name, email: user.email, password: '', roleId: user.roleId });
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <div className="text-gray-500">Loading users...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <PermissionGate permission="users.create">
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', email: '', password: '', roleId: '' }); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            + Add User
          </button>
        </PermissionGate>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit User' : 'Create User'}</h2>
          {error && <div className="bg-red-50 text-red-700 px-4 py-2 rounded mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input type="password" placeholder={editingId ? 'New Password (leave blank to keep)' : 'Password'} required={!editingId} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <select required value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">Select Role</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">{editingId ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">{u.role?.name}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <PermissionGate permission="users.update">
                    <button onClick={() => startEdit(u)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  </PermissionGate>
                  <PermissionGate permission="users.delete">
                    <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                  </PermissionGate>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
