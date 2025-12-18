// src/app/admin/alertas/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Loader2, Bell, CheckCircle, XCircle, AlertTriangle, Info, Filter } from 'lucide-react';

interface Alert {
  id: string;
  alert_type: string;
  message: string;
  created_at: string;
  acknowledged: boolean;
  username: string | null;
  email: string | null;
  domain: string | null;
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('q', search);
    if (typeFilter !== 'all') params.append('type', typeFilter);

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alerts/admin?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setAlerts(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      alert('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  }, [offset, search, typeFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    setOffset(0);
  }, [search, typeFilter]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment_received': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'suspension': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      payment_received: 'Pago recibido',
      suspension: 'Suspensión',
      warning: 'Advertencia',
      info: 'Información',
    };
    return labels[type] || type;
  };

  const totalPages = Math.ceil(total / limit);
  const from = offset + 1;
  const to = Math.min(offset + limit, total);

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="w-9 h-9" />
              Alertas del Sistema
            </h1>
            <p className="text-sm opacity-70 mt-1">
              {total > 0 ? `Mostrando ${from}–${to} de ${total.toLocaleString()} alertas` : 'No hay alertas'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 opacity-60" />
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-white/20 bg-white/10 outline-none">
                <option value="all">Todos los tipos</option>
                <option value="payment_received">Pago recibido</option>
                <option value="suspension">Suspensión</option>
                <option value="warning">Advertencia</option>
                <option value="info">Información</option>
              </select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar mensaje, usuario o dominio..."
                className="pl-10 pr-4 py-2 rounded-lg border border-white/20 bg-white/10 outline-none focus:border-white/40 w-80" />
            </div>

            <button onClick={fetchAlerts}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/20 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <div className="grid gap-4 p-6">
            {loading ? (
              <div className="col-span-full text-center py-16">
                <Loader2 className="w-10 h-10 animate-spin mx-auto" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="col-span-full text-center py-16 opacity-75">
                No hay alertas
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getIcon(alert.alert_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-sm">
                          {getTypeLabel(alert.alert_type)}
                        </span>
                        <span className="text-xs opacity-70">
                          {new Date(alert.created_at).toLocaleString('es-MX')}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{alert.message}</p>
                      <div className="flex items-center gap-4 text-xs opacity-70">
                        {alert.username && <span>Usuario: {alert.username}</span>}
                        {alert.domain && <span>Dominio: {alert.domain}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-white/10">
            <button onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50">
              Anterior
            </button>
            <span>Página {Math.floor(offset / limit) + 1} de {totalPages}</span>
            <button onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50">
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}