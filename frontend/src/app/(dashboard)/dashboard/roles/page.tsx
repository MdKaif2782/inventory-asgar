'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Role, Permission } from '@/lib/types';
import PermissionGate from '@/components/PermissionGate';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', permissionIds: [] as string[] });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([api.get('/roles'), api.get('/roles/permissions')]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
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
        await api.patch(`/roles/${editingId}`, form);
      } else {
        await api.post('/roles', form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', permissionIds: [] });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const startEdit = (role: Role) => {
    setForm({ name: role.name, permissionIds: role.permissions?.map((p) => p.id) || [] });
    setEditingId(role.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this role?')) return;
    try {
      await api.delete(`/roles/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const togglePermission = (permId: string) => {
    setForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter((id) => id !== permId)
        : [...prev.permissionIds, permId],
    }));
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const category = perm.name.split('.')[0];
    if (!acc[category]) acc[category] = [];
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) return <div className="text-gray-500">Loading roles...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
        <PermissionGate permission="roles.create">
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', permissionIds: [] }); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            + Add Role
          </button>
        </PermissionGate>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Role' : 'Create Role'}</h2>
          {error && <div className="bg-red-50 text-red-700 px-4 py-2 rounded mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit}>
            <input placeholder="Role Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border rounded-lg w-full mb-4" />
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-800 capitalize mb-2">{category}</h4>
                  {perms.map((perm) => (
                    <label key={perm.id} className="flex items-center gap-2 mb-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.permissionIds.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-600">{perm.name}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">{editingId ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
              <div className="space-x-2">
                <PermissionGate permission="roles.update">
                  <button onClick={() => startEdit(role)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                </PermissionGate>
                <PermissionGate permission="roles.delete">
                  <button onClick={() => handleDelete(role.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </PermissionGate>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {role.permissions?.map((p) => (
                <span key={p.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{p.name}</span>
              ))}
              {(!role.permissions || role.permissions.length === 0) && (
                <span className="text-sm text-gray-400">No permissions assigned</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
