'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Godown } from '@/lib/types';
import PermissionGate from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Warehouse, MapPin } from 'lucide-react';

export default function GodownsPage() {
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const resetForm = () => {
    setForm({ name: '', location: '' });
    setEditingId(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.patch(`/godowns/${editingId}`, form);
      } else {
        await api.post('/godowns', form);
      }
      setDialogOpen(false);
      resetForm();
      fetchGodowns();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (godown: Godown) => {
    setForm({ name: godown.name, location: godown.location || '' });
    setEditingId(godown.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this godown?')) return;
    try {
      await api.delete(`/godowns/${id}`);
      fetchGodowns();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading godowns...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Godowns</h1>
          <p className="text-sm text-muted-foreground">Manage warehouse locations</p>
        </div>
        <PermissionGate permission="godowns.create">
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Godown
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit' : 'Add'} Godown</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Godown Name *</Label>
                  <Input
                    id="name"
                    placeholder="Main Warehouse"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Dhaka, Bangladesh"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            All Godowns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-center">Products in Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {godowns.map((godown) => (
                <TableRow key={godown.id}>
                  <TableCell className="font-medium">{godown.name}</TableCell>
                  <TableCell>
                    {godown.location ? (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {godown.location}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {godown.stocks?.length ?? 0} items
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <PermissionGate permission="godowns.update">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(godown)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="godowns.delete">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(godown.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </PermissionGate>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {godowns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No godowns found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
