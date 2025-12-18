'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, ChevronDown, Loader2, X, Save, Trash2, Calendar, Server, AlertTriangle, Clock, Plus, Edit3, Bell, Users } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  company: string | null;
  role_title: string | null;
  domain: string | null;
  created_at: string;
}

interface Announcement {
  id?: string;
  type: 'due_warning' | 'suspension';
  title: string;
  body: string;
  starts_at: string;
  ends_at: string;
  domain: string;
  created_at?: string;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [limit] = useState(10000); // Mantener alto para cargar todos
  const [announcementsByDomain, setAnnouncementsByDomain] = useState<Record<string, Announcement[]>>({});
  const [loadingAnnouncements, setLoadingAnnouncements] = useState<Record<string, boolean>>({});
  const [openDomains, setOpenDomains] = useState<string[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users?${params}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      alert('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchAnnouncements = useCallback(async (domain: string) => {
    if (announcementsByDomain[domain] || loadingAnnouncements[domain]) return;
    setLoadingAnnouncements(prev => ({ ...prev, [domain]: true }));
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/announcements?domain=${domain}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [data].filter(Boolean);
        setAnnouncementsByDomain(prev => ({ ...prev, [domain]: list }));
      }
    } catch (err) {
      console.error(`Error cargando anuncios para ${domain}`);
    } finally {
      setLoadingAnnouncements(prev => ({ ...prev, [domain]: false }));
    }
  }, [announcementsByDomain, loadingAnnouncements]);

  const saveAnnouncement = async () => {
    if (!editingAnnouncement) return;
    setSaving(true);
    try {
      const payload = {
        type: editingAnnouncement.type,
        title: editingAnnouncement.title,
        body: editingAnnouncement.body,
        starts_at: new Date(editingAnnouncement.starts_at).toISOString(),
        ends_at: new Date(editingAnnouncement.ends_at).toISOString(),
        domain: editingAnnouncement.domain,
      };

      const method = editingAnnouncement.id ? 'PUT' : 'POST';
      const url = editingAnnouncement.id
        ? `${process.env.NEXT_PUBLIC_API_URL}/announcements/${editingAnnouncement.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/announcements`;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('Anuncio guardado correctamente');
        const updated = await res.json();
        setAnnouncementsByDomain(prev => {
          const domain = editingAnnouncement.domain;
          const filtered = (prev[domain] || []).filter(a => a.id !== updated.id);
          return { ...prev, [domain]: [...filtered, updated] };
        });
        setEditingAnnouncement(null);
      } else {
        const error = await res.json();
        alert(error.message?.join('\n') || 'Error al guardar');
      }
    } catch (err) {
      alert('Error de red');
    } finally {
      setSaving(false);
    }
  };

  const deleteAnnouncement = async (id: string, domain: string) => {
    if (!confirm('¿Eliminar este anuncio permanentemente?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      if (res.ok) {
        setAnnouncementsByDomain(prev => ({
          ...prev,
          [domain]: (prev[domain] || []).filter(a => a.id !== id),
        }));
        alert('Anuncio eliminado');
      }
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const toggleDomain = (domain: string) => {
    setOpenDomains(prev => {
      const isOpen = prev.includes(domain);
      if (isOpen) {
        return prev.filter(d => d !== domain);
      } else {
        fetchAnnouncements(domain);
        return [...prev, domain];
      }
    });
  };

  // Filtrado client-side
  const filteredUsers = useMemo(() => {
    const lowerSearch = search.toLowerCase().trim();
    if (!lowerSearch) return users;
    return users.filter(user => 
      (user.name?.toLowerCase().includes(lowerSearch) ?? false) ||
      (user.email.toLowerCase().includes(lowerSearch)) ||
      (user.domain?.toLowerCase().includes(lowerSearch) ?? false) ||
      (user.company?.toLowerCase().includes(lowerSearch) ?? false) ||
      (user.role_title?.toLowerCase().includes(lowerSearch) ?? false)
    );
  }, [users, search]);

  // Agrupar usuarios filtrados por dominio (ignorando null)
  const groupedUsers = useMemo(() => {
    return filteredUsers.reduce((acc, user) => {
      if (user.domain) {
        if (!acc[user.domain]) acc[user.domain] = [];
        acc[user.domain].push(user);
      }
      return acc;
    }, {} as Record<string, User[]>);
  }, [filteredUsers]);

  const domainList = useMemo(() => Object.keys(groupedUsers).sort(), [groupedUsers]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Usuarios Portal</h1>
          <p className="text-sm opacity-70">
            {filteredUsers.length > 0 ? `Mostrando ${filteredUsers.length.toLocaleString()} usuarios en ${domainList.length} dominios` : 'No hay usuarios'}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email, dominio, compañía o rol..."
            className="pl-12 pr-6 py-3 rounded-xl border border-white/20 bg-white/10 outline-none focus:border-white/40 w-96 text-lg"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center p-20"><Loader2 className="w-12 h-12 animate-spin mx-auto" /></div>
      ) : domainList.length === 0 ? (
        <div className="text-center p-20 opacity-75 text-xl">No se encontraron usuarios</div>
      ) : (
        <div className="space-y-4">
          {domainList.map(domain => {
            const domainUsers = groupedUsers[domain];
            const domainAnns = announcementsByDomain[domain] || [];
            const isOpen = openDomains.includes(domain);
            const isLoadingAnns = loadingAnnouncements[domain] ?? false;

            return (
              <div key={domain} className="rounded-xl border border-white/20 overflow-hidden">
                <button
                  onClick={() => toggleDomain(domain)}
                  className="w-full flex justify-between items-center p-5 bg-white/10 hover:bg-white/20 transition text-left"
                >
                  <div className="flex items-center gap-4">
                    <Server className="w-6 h-6 text-blue-400" />
                    <span className="text-lg font-bold">{domain}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2 opacity-80">
                      <Users className="w-5 h-5" /> {domainUsers.length}
                    </span>
                    <span className="flex items-center gap-2 opacity-80">
                      <Bell className="w-5 h-5" /> {domainAnns.length}
                    </span>
                    <ChevronDown className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {isOpen && (
                  <div className="p-6 bg-gray-900">
                    {/* Sección de usuarios */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Usuarios ({domainUsers.length})</h3>
                      </div>
                      <div className="rounded-xl border border-white/20 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-white/10">
                            <tr>
                              <th className="text-left p-4">Nombre</th>
                              <th className="text-left p-4">Email</th>
                              <th className="text-left p-4">Compañía</th>
                              <th className="text-left p-4">Rol</th>
                              <th className="text-left p-4">Creado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {domainUsers.map(user => (
                              <tr key={user.id} className="border-t border-white/10 hover:bg-white/5 transition">
                                <td className="p-4 font-medium">{user.name || '—'}</td>
                                <td className="p-4 text-sm opacity-90">{user.email}</td>
                                <td className="p-4 text-sm">{user.company || '—'}</td>
                                <td className="p-4 text-sm">{user.role_title || '—'}</td>
                                <td className="p-4 text-sm opacity-70">{new Date(user.created_at).toLocaleDateString('es-MX')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Sección de anuncios */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Anuncios ({domainAnns.length})</h3>
                        <button
                          onClick={() => {
                            setEditingAnnouncement({
                              type: 'due_warning',
                              title: '',
                              body: '',
                              starts_at: new Date().toISOString(),
                              ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                              domain,
                            });
                          }}
                          className="flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-5 h-5" />
                          Nuevo anuncio
                        </button>
                      </div>
                      {isLoadingAnns ? (
                        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
                      ) : domainAnns.length === 0 ? (
                        <div className="text-center py-12 opacity-60">
                          <Bell className="w-16 h-16 mx-auto mb-4" />
                          <p className="text-lg">Este dominio no tiene anuncios</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {domainAnns
                            .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
                            .map(ann => {
                              const isActive = new Date(ann.ends_at) > new Date();
                              return (
                                <div
                                  key={ann.id}
                                  className={`rounded-xl p-5 border ${isActive ? 'border-yellow-500/50 bg-yellow-600/10' : 'border-white/10 bg-white/5'}`}
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                      {isActive ? (
                                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                                      ) : (
                                        <div className="w-3 h-3 bg-gray-600 rounded-full" />
                                      )}
                                      <div>
                                        <h4 className="text-lg font-bold">{ann.title || 'Sin título'}</h4>
                                        <p className="text-sm opacity-70">
                                          {ann.type === 'due_warning' ? 'Aviso de corte' : 'Suspensión'} • 
                                          {new Date(ann.starts_at).toLocaleDateString('es-MX')} → {new Date(ann.ends_at).toLocaleDateString('es-MX')}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setEditingAnnouncement(ann)}
                                        className="p-2 hover:bg-white/10 rounded"
                                      >
                                        <Edit3 className="w-5 h-5" />
                                      </button>
                                      <button
                                        onClick={() => ann.id && deleteAnnouncement(ann.id, domain)}
                                        className="p-2 hover:bg-red-500/20 rounded"
                                      >
                                        <Trash2 className="w-5 h-5 text-red-400" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-base whitespace-pre-wrap opacity-90">{ann.body}</p>
                                  {isActive && (
                                    <div className="mt-3 text-sm font-medium text-yellow-300 flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4" /> Anuncio activo
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de edición/creación */}
      {editingAnnouncement && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8" onClick={() => setEditingAnnouncement(null)}>
          <div className="bg-gray-900 rounded-2xl border border-white/20 w-full max-w-2xl p-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-6">
              {editingAnnouncement.id ? 'Editar anuncio' : 'Crear nuevo anuncio'}
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <select
                  value={editingAnnouncement.type}
                  onChange={e => setEditingAnnouncement(prev => ({ ...prev!, type: e.target.value as any }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 outline-none focus:border-white/40"
                >
                  <option value="due_warning">Aviso de corte próximo</option>
                  <option value="suspension">Suspensión</option>
                </select>
              </div>
              <input
                value={editingAnnouncement.title}
                onChange={e => setEditingAnnouncement(prev => ({ ...prev!, title: e.target.value }))}
                placeholder="Título del anuncio"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 outline-none focus:border-white/40"
              />
              <textarea
                value={editingAnnouncement.body}
                onChange={e => setEditingAnnouncement(prev => ({ ...prev!, body: e.target.value }))}
                rows={6}
                placeholder="Mensaje completo..."
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 outline-none focus:border-white/40 resize-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha de inicio</label>
                  <input 
                    type="datetime-local" 
                    value={new Date(editingAnnouncement.starts_at).toISOString().slice(0,16)} 
                    onChange={e => setEditingAnnouncement(prev => ({ ...prev!, starts_at: e.target.value + ':00Z' }))} 
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha de fin</label>
                  <input 
                    type="datetime-local" 
                    value={new Date(editingAnnouncement.ends_at).toISOString().slice(0,16)} 
                    onChange={e => setEditingAnnouncement(prev => ({ ...prev!, ends_at: e.target.value + ':00Z' }))} 
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20" 
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={saveAnnouncement} disabled={saving} className="flex-1 px-6 py-4 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-lg font-medium">
                  {saving ? 'Guardando...' : 'Guardar anuncio'}
                </button>
                <button onClick={() => setEditingAnnouncement(null)} className="px-6 py-4 rounded-lg bg-white/10 hover:bg-white/20">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}