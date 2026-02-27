'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Godown } from '@/lib/types';
import PermissionGate from '@/components/PermissionGate';

export default function GodownsPage() {
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', location: '' });
  const [error, setError] = useState('');

  const fetchGodowns = async () => {
    try {
      const { data } = await api.get('/godowns');
      setGodowns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGodowns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.patch(`/godowns/${editingId}`, form);
      } else {
        await api.post('/godowns', form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', location: '' });
      fetchGodowns();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (godown: Godown) => {
    setForm({ name: godown.name, location: godown.location || '' });
    setEditingId(godown.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this godown?')) return;
    try {
      await api.delete(`/godowns/${id}`);
      fetchGodowns();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <div className="text-gray-500">Loading godowns...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Godowns</h1>
        <PermissionGate permission="godowns.create">
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', location: '' }); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + Add Godown
          </button>
        </PermissionGate>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit' : 'Add'} Godown</h2>
          {error && <div className="bg-red-50 text-red-700 px-4 py-2 rounded mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Godown Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              placeholder="Location (optional)"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products in Stock</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {godowns.map((godown) => (
              <tr key={godown.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{godown.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{godown.location || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{godown.stocks?.length ?? 0}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <PermissionGate permission="godowns.update">
                    <button onClick={() => handleEdit(godown)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  </PermissionGate>
                  <PermissionGate permission="godowns.delete">
                    <button onClick={() => handleDelete(godown.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                  </PermissionGate>
                </td>
              </tr>
            ))}
            {godowns.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No godowns found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
