// src/app/admin/servidores/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Download, ChevronLeft, ChevronRight, Loader2, Server, Globe, Calendar } from 'lucide-react';

interface Server {
  id: string;
  name: string;
  host: string;
  metadata: Record<string, any>;
  created_at: string;
}

const LIMIT_OPTIONS = [25, 50, 100, 500];

export default function ServidoresPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'host'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);

  const fetchServers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: limit.toString(),
        order_by: sortBy,
        order_dir: sortDir,
      });
      if (search.trim()) params.append('q', search.trim());

      const token = localStorage.getItem('admin_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/servers?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) throw new Error('Error al cargar servidores');

      const data = await res.json();
      // Tu backend probablemente devuelve { data: [...], total: 121 }
      setServers(data.data || data.items || []);
      setTotal(data.total || data.data?.length || 0);
    } catch (err) {
      alert('Error al cargar servidores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [offset, limit, search, sortBy, sortDir]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const exportCSV = () => {
    const headers = ['Nombre', 'Host', 'Creado', 'Metadata'];
    const rows = servers.map(s => [
      s.name,
      s.host,
      new Date(s.created_at).toLocaleDateString('es-MX'),
      JSON.stringify(s.metadata),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `servidores_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const goToPage = (page: number) => {
    setOffset((page - 1) * limit);
  };

  const SortHeader = ({ field, children }: { field: typeof sortBy; children: React.ReactNode }) => (
    <th
      onClick={() => {
        if (sortBy === field) {
          setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
          setSortBy(field);
          setSortDir('desc');
        }
        setOffset(0);
      }}
      className="text-left p-4 font-medium cursor-pointer hover:bg-white/10 transition select-none"
    >
      <div className="flex items-center gap-1">
        {children}
        {sortBy === field && (sortDir === 'desc' ? '↓' : '↑')}
      </div>
    </th>
  );

  return (
    <div className="p-6">
      {/* Header con estadísticas rápidas */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Server className="w-8 h-8" />
              Servidores
            </h1>
            <p className="text-sm opacity-70 mt-1">
              {total > 0 ? `Mostrando ${from}–${to} de ${total.toLocaleString()} servidores activos` : 'No hay servidores registrados'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setOffset(0);
                }}
                placeholder="Buscar por nombre o host..."
                className="pl-10 pr-4 py-2 rounded-lg border border-white/20 bg-white/10 outline-none focus:border-white/40 transition w-72"
              />
            </div>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setOffset(0);
              }}
              className="px-3 py-2 rounded-lg border border-white/20 bg-white/10 outline-none"
            >
              {LIMIT_OPTIONS.map(n => (
                <option key={n} value={n}>{n === 500 ? 'Todos' : n}</option>
              ))}
            </select>

            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>

            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition">
              <Plus className="w-4 h-4" />
              Nuevo servidor
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-white/20 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/10">
              <tr>
                <SortHeader field="name">
                  <Globe className="w-4 h-4 mr-1" />
                  Nombre
                </SortHeader>
                <SortHeader field="host">Host</SortHeader>
                <th className="text-left p-4 font-medium">Metadata</th>
                <SortHeader field="created_at">
                  <Calendar className="w-4 h-4 mr-1" />
                  Fecha creación
                </SortHeader>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-16 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto opacity-60" />
                  </td>
                </tr>
              ) : servers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-16 text-center opacity-75">
                    No se encontraron servidores
                  </td>
                </tr>
              ) : (
                servers.map((server) => (
                  <tr key={server.id} className="border-t border-white/10 hover:bg-white/5 transition">
                    <td className="p-4 font-medium text-blue-400">{server.name}</td>
                    <td className="p-4 font-mono text-xs opacity-90">{server.host}</td>
                    <td className="p-4 text-xs">
                      {Object.keys(server.metadata || {}).length > 0 ? (
                        <details className="cursor-pointer">
                          <summary className="text-blue-400 hover:underline">
                            Ver metadata ({Object.keys(server.metadata).length} campos)
                          </summary>
                          <pre className="mt-2 text-xs bg-black/20 p-2 rounded overflow-x-auto">
                            {JSON.stringify(server.metadata, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="opacity-50">Sin metadata</span>
                      )}
                    </td>
                    <td className="p-4 text-xs opacity-70">
                      {new Date(server.created_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/5">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 7) page = i + 1;
                else if (currentPage <= 4) page = i + 1;
                else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                else page = currentPage - 3 + i;

                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-10 h-10 rounded-lg transition font-medium ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              {totalPages > 7 && currentPage < totalPages - 3 && (
                <>
                  <span className="px-2">...</span>
                  <button
                    onClick={() => goToPage(totalPages)}
                    className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition font-medium"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}