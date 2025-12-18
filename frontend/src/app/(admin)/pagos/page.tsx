'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Download,
  Calendar,
  DollarSign,
  Loader2,
  Filter,
  ChevronDown,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

interface Pago {
  id: number;
  fecha: string;
  importe_cents: number;
  forma_pago: string;
  banco: string | null;
  estatus: 'Pendiente' | 'Validado' | 'Aplicado';
  comprobante_url: string;
  factura_ids: Array<Record<string, number>>; // ej: [{ "45": 300000 }]
  domain: string;
}

interface GroupStats {
  count: number;
  totalImporte: number;
  countPendiente: number;
  countValidado: number;
  countAplicado: number;
}

function formatMXN(cents: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX');
}

export default function AdminPagosGlobalPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('');

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/billing/admin/all-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({
          page,
          limit,
          search: search.trim(),
          estatus: estatusFilter || undefined,
          orderBy: 'fecha',
          order: 'DESC',
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setPagos(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      alert('Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  }, [page, search, estatusFilter]);

  useEffect(() => {
    fetchPagos();
  }, [fetchPagos]);

  const handleSearch = () => {
    setPage(1);
    fetchPagos();
  };

  const downloadComprobante = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  // Agrupar pagos por dominio
  const groupedPagos = pagos.reduce((acc: Record<string, Pago[]>, p) => {
    if (!acc[p.domain]) acc[p.domain] = [];
    acc[p.domain].push(p);
    return acc;
  }, {});

  const sortedDomains = Object.keys(groupedPagos).sort();

  // Estadísticas por grupo
  const groupStats = Object.fromEntries(
    sortedDomains.map((domain) => {
      const ps = groupedPagos[domain];
      const count = ps.length;
      const totalImporte = ps.reduce((s, p) => s + p.importe_cents, 0);
      const countPendiente = ps.filter((p) => p.estatus === 'Pendiente').length;
      const countValidado = ps.filter((p) => p.estatus === 'Validado').length;
      const countAplicado = ps.filter((p) => p.estatus === 'Aplicado').length;
      return [domain, { count, totalImporte, countPendiente, countValidado, countAplicado }];
    })
  ) as Record<string, GroupStats>;

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case 'Pendiente':
        return 'bg-yellow-600/30 text-yellow-300';
      case 'Validado':
        return 'bg-blue-600/30 text-blue-300';
      case 'Aplicado':
        return 'bg-green-600/30 text-green-300';
      default:
        return 'bg-gray-600/30 text-gray-300';
    }
  };

  const getEstatusIcon = (estatus: string) => {
    switch (estatus) {
      case 'Pendiente':
        return <Clock className="w-4 h-4" />;
      case 'Validado':
        return <CheckCircle className="w-4 h-4" />;
      case 'Aplicado':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Gestión Global de Pagos</h1>
          <p className="opacity-70 mt-2">Todos los pagos recibidos • {total.toLocaleString()} totales</p>
        </div>

        {/* Filtros */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar por dominio, banco o forma de pago..."
                className="w-full pl-12 pr-6 py-4 rounded-xl bg-white/10 border border-white/20 outline-none"
              />
            </div>
            <select
              value={estatusFilter}
              onChange={(e) => {
                setEstatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-6 py-4 rounded-xl bg-white/10 border border-white/20 outline-none"
            >
              <option value="">Todos los estatus</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Validado">Validado</option>
              <option value="Aplicado">Aplicado</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium flex items-center justify-center gap-3"
            >
              <Filter className="w-5 h-5" />
              Aplicar filtros
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin mx-auto" />
          </div>
        ) : pagos.length === 0 ? (
          <div className="text-center py-20 opacity-60 text-xl">No se encontraron pagos</div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {sortedDomains.map((domain) => {
                const stats = groupStats[domain];
                return (
                  <details key={domain} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <summary className="p-5 font-bold cursor-pointer flex justify-between items-center hover:bg-white/5 transition">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-lg text-blue-400">{domain}</span>
                        <span className="px-3 py-1 bg-gray-800/50 rounded-full text-sm">
                          {stats.count} pagos
                        </span>
                        <span className="px-3 py-1 bg-green-600/30 text-green-300 rounded-full text-sm flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Total: {formatMXN(stats.totalImporte)}
                        </span>
                        {stats.countPendiente > 0 && (
                          <span className="px-3 py-1 bg-yellow-600/30 text-yellow-300 rounded-full text-sm flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {stats.countPendiente} pendientes
                          </span>
                        )}
                        {stats.countValidado > 0 && (
                          <span className="px-3 py-1 bg-blue-600/30 text-blue-300 rounded-full text-sm">
                            {stats.countValidado} validados
                          </span>
                        )}
                        {stats.countAplicado > 0 && (
                          <span className="px-3 py-1 bg-green-600/30 text-green-300 rounded-full text-sm">
                            {stats.countAplicado} aplicados
                          </span>
                        )}
                      </div>
                      <ChevronDown className="w-5 h-5 opacity-70 transition-transform" />
                    </summary>

                    <div className="border-t border-white/10">
                      <table className="w-full">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="text-left p-5">Fecha</th>
                            <th className="text-left p-5">Importe</th>
                            <th className="text-left p-5">Forma de Pago</th>
                            <th className="text-left p-5">Banco</th>
                            <th className="text-left p-5">Estatus</th>
                            <th className="text-center p-5">Comprobante</th>
                            <th className="text-left p-5">Facturas Aplicadas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedPagos[domain].map((p) => (
                            <tr key={p.id} className="border-t border-white/10 hover:bg-white/5 transition">
                              <td className="p-5">{formatDate(p.fecha)}</td>
                              <td className="p-5 font-bold text-green-400">{formatMXN(p.importe_cents)}</td>
                              <td className="p-5">{p.forma_pago}</td>
                              <td className="p-5">{p.banco || '-'}</td>
                              <td className="p-5">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getEstatusColor(p.estatus)}`}>
                                  {getEstatusIcon(p.estatus)}
                                  {p.estatus}
                                </span>
                              </td>
                              <td className="p-5 text-center">
                                <button
                                  onClick={() => downloadComprobante(p.comprobante_url, `comprobante_pago_${p.id}`)}
                                  className="p-2 hover:bg-white/10 rounded"
                                >
                                  <Download className="w-5 h-5 text-blue-400" />
                                </button>
                              </td>
                              <td className="p-5 text-sm">
                                {Object.entries(p.factura_ids[0] || {})
                                  .map(([id, monto]) => `Factura ${id}: ${formatMXN(monto)}`)
                                  .join(', ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                );
              })}
            </div>

            {/* Paginación */}
            <div className="flex justify-between items-center mt-8">
              <p className="opacity-70">
                Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * limit >= total}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}