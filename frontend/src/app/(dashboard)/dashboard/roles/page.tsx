'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Role, Permission } from '@/lib/types';
import PermissionGate from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Shield, Check } from 'lucide-react';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({ name: '', permissionIds: [] });
    setEditingId(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.patch(`/roles/${editingId}`, form);
      } else {
        await api.post('/roles', form);
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  const startEdit = (role: Role) => {
    setForm({ name: role.name, permissionIds: role.permissions?.map((p) => p.id) || [] });
    setEditingId(role.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this role?')) return;
    try {
      await api.delete(`/roles/${id}`);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Delete failed');
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

  if (loading) {
    return <div className="text-muted-foreground">Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roles</h1>
          <p className="text-sm text-muted-foreground">Manage roles and permissions</p>
        </div>
        <PermissionGate permission="roles.create">
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Role' : 'Create Role'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name *</Label>
                  <Input
                    id="name"
                    placeholder="Manager"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                      <Card key={category} className="bg-muted/30">
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm capitalize flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            {category}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4 space-y-1">
                          {perms.map((perm) => (
                            <label key={perm.id} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-background/50 rounded px-1">
                              <div
                                onClick={() => togglePermission(perm.id)}
                                className={`h-4 w-4 rounded border flex items-center justify-center ${
                                  form.permissionIds.includes(perm.id)
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-muted-foreground'
                                }`}
                              >
                                {form.permissionIds.includes(perm.id) && <Check className="h-3 w-3" />}
                              </div>
                              <span className="text-sm text-muted-foreground">{perm.name.split('.')[1]}</span>
                            </label>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </PermissionGate>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {role.name}
                </CardTitle>
                <div className="flex gap-1">
                  <PermissionGate permission="roles.update">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(role)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </PermissionGate>
                  <PermissionGate permission="roles.delete">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(role.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </PermissionGate>
                </div>
              </div>
              <CardDescription>
                {role.permissions?.length || 0} permissions assigned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions?.map((p) => (
                  <Badge key={p.id} variant="secondary" className="text-xs">
                    {p.name}
                  </Badge>
                ))}
                {(!role.permissions || role.permissions.length === 0) && (
                  <span className="text-sm text-muted-foreground">No permissions assigned</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {roles.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No roles found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
