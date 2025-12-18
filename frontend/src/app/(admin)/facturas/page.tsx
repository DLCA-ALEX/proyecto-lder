'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Download,
  FileText,
  Calendar,
  DollarSign,
  Loader2,
  Upload,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  ChevronDown,
} from 'lucide-react';

interface Factura {
  id: number;
  folio: string;
  fecha: string;
  vencimiento: string;
  importe_cents: number;
  saldo: number;
  estatus: string;
  pdf_url: string;
  xml_url: string | null;
  domain: string;
}

interface Domain {
  domain: string;
}

interface GroupStats {
  count: number;
  totalImporte: number;
  totalSaldo: number;
  countPendiente: number;
  countVencida: number;
}

function formatMXN(cents: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX');
}

export default function AdminFacturasGlobalPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('');
  const [domainSuggestions, setDomainSuggestions] = useState<string[]>([]);

  // Formulario subir factura
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [formData, setFormData] = useState({
    folio: '',
    cfdi_uuid: '',
    fecha: '',
    importe: '',
    pdfFile: null as File | null,
    xmlFile: null as File | null,
  });

  const fetchFacturas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/billing/admin/all-invoices`, {
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
          orderBy: 'vencimiento',
          order: 'ASC',
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setFacturas(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      alert('Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  }, [page, search, estatusFilter]);

  const fetchDomains = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/billing/admin/domains`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDomains(data);
        setDomainSuggestions(data.map((d: Domain) => d.domain));
      }
    } catch (err) {
      console.error('Error cargando dominios');
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, [fetchFacturas]);

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchFacturas();
  };

  const subirFactura = async () => {
    if (!selectedDomain || !formData.folio || !formData.fecha || !formData.importe || !formData.pdfFile) {
      alert('Completa todos los campos obligatorios');
      return;
    }

    setUploading(true);
    const readFile = (file: File) => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    try {
      const pdf_base64 = await readFile(formData.pdfFile!);
      const xml_base64 = formData.xmlFile ? await readFile(formData.xmlFile) : undefined;

      const payload = {
        server_domain: selectedDomain,
        folio: formData.folio.trim(),
        cfdi_uuid: formData.cfdi_uuid.trim() || undefined,
        fecha: formData.fecha,
        importe_cents: Math.round(parseFloat(formData.importe) * 100),
        pdf_base64,
        xml_base64,
        admin_id: 'admin-id-placeholder', // Cambia según tu sistema
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/billing/create-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('Factura subida exitosamente');
        setShowUploadForm(false);
        setFormData({ folio: '', cfdi_uuid: '', fecha: '', importe: '', pdfFile: null, xmlFile: null });
        fetchFacturas();
      } else {
        const err = await res.json();
        alert(err.message || 'Error al subir factura');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  // Agrupar facturas por dominio
  const groupedFacturas = facturas.reduce((acc: Record<string, Factura[]>, f) => {
    if (!acc[f.domain]) acc[f.domain] = [];
    acc[f.domain].push(f);
    return acc;
  }, {});

  const sortedDomains = Object.keys(groupedFacturas).sort();

  // Calcular estadísticas por grupo
  const groupStats = Object.fromEntries(
    sortedDomains.map((domain) => {
      const fs = groupedFacturas[domain];
      const count = fs.length;
      const totalImporte = fs.reduce((s, f) => s + f.importe_cents, 0);
      const totalSaldo = fs.reduce((s, f) => s + f.saldo, 0);
      const countPendiente = fs.filter((f) => f.estatus !== 'Pagada').length;
      const countVencida = fs.filter(
        (f) => new Date(f.vencimiento) < new Date() && f.estatus !== 'Pagada'
      ).length;
      return [
        domain,
        { count, totalImporte, totalSaldo, countPendiente, countVencida },
      ];
    })
  ) as Record<string, GroupStats>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Gestión Global de Facturas</h1>
            <p className="opacity-70 mt-2">Todas las facturas del sistema • {total.toLocaleString()} totales</p>
          </div>
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-medium"
          >
            <Plus className="w-6 h-6" />
            Subir Factura
          </button>
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
                placeholder="Buscar por folio o dominio..."
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
              <option value="Sin Pago">Sin Pago</option>
              <option value="Parcial">Parcial</option>
              <option value="Pagada">Pagada</option>
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
          <div className="text-center py-20"><Loader2 className="w-12 h-12 animate-spin mx-auto" /></div>
        ) : facturas.length === 0 ? (
          <div className="text-center py-20 opacity-60 text-xl">No se encontraron facturas</div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {sortedDomains.map((domain) => {
                const stats = groupStats[domain];
                return (
                  <details key={domain} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <summary className="p-5 font-bold cursor-pointer flex justify-between items-center">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-lg text-blue-400">{domain}</span>
                        <span className="px-3 py-1 bg-gray-800/50 rounded-full text-sm">
                          {stats.count} facturas
                        </span>
                        <span className="px-3 py-1 bg-orange-600/30 text-orange-300 rounded-full text-sm flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Saldo: {formatMXN(stats.totalSaldo)}
                        </span>
                        <span className="px-3 py-1 bg-red-600/30 text-red-300 rounded-full text-sm flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {stats.countVencida} vencidas
                        </span>
                        <span className="px-3 py-1 bg-yellow-600/30 text-yellow-300 rounded-full text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {stats.countPendiente} pendientes
                        </span>
                      </div>
                      <ChevronDown className="w-5 h-5 opacity-70 transition-transform" />
                    </summary>
                    <div className="border-t border-white/10">
                      <table className="w-full">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="text-left p-5">Folio</th>
                            <th className="text-left p-5">Fecha / Vence</th>
                            <th className="text-left p-5">Importe</th>
                            <th className="text-left p-5">Saldo</th>
                            <th className="text-left p-5">Estatus</th>
                            <th className="text-center p-5">Archivos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedFacturas[domain].map((f) => {
                            const isPagada = f.estatus === 'Pagada';
                            const isVencida = new Date(f.vencimiento) < new Date() && !isPagada;

                            return (
                              <tr key={f.id} className="border-t border-white/10 hover:bg-white/5 transition">
                                <td className="p-5 font-bold">{f.folio}</td>
                                <td className="p-5 text-sm">
                                  <div>{formatDate(f.fecha)}</div>
                                  <div className={isVencida ? 'text-red-400' : ''}>{formatDate(f.vencimiento)}</div>
                                </td>
                                <td className="p-5">{formatMXN(f.importe_cents)}</td>
                                <td className="p-5 font-bold text-orange-400">{formatMXN(f.saldo)}</td>
                                <td className="p-5">
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    isPagada ? 'bg-green-600/30 text-green-300' :
                                    isVencida ? 'bg-red-600/30 text-red-300' :
                                    'bg-yellow-600/30 text-yellow-300'
                                  }`}>
                                    {f.estatus}
                                  </span>
                                </td>
                                <td className="p-5 text-center">
                                  <div className="flex justify-center gap-3">
                                    <button onClick={() => downloadFile(f.pdf_url, `${f.folio}.pdf`)} className="p-2 hover:bg-white/10 rounded">
                                      <Download className="w-5 h-5 text-blue-400" />
                                    </button>
                                    {f.xml_url && (
                                      <button onClick={() => downloadFile(f.xml_url, `${f.folio}.xml`)} className="p-2 hover:bg-white/10 rounded">
                                        <FileText className="w-5 h-5 text-emerald-400" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
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
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * limit >= total}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  Siguiente
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Modal subir factura */}
        {showUploadForm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-gray-900 rounded-2xl border border-white/20 w-full max-w-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Subir Nueva Factura</h3>
                <button onClick={() => setShowUploadForm(false)} className="p-2 hover:bg-white/10 rounded">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">Dominio</label>
                  <input
                    list="domains-list"
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    placeholder="Escribe o selecciona dominio"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg outline-none"
                  />
                  <datalist id="domains-list">
                    {domainSuggestions.map(d => <option key={d} value={d} />)}
                  </datalist>
                </div>

                <input placeholder="Folio fiscal *" value={formData.folio} onChange={e => setFormData(p => ({...p, folio: e.target.value}))} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg" />
                <input placeholder="UUID CFDI (opcional)" value={formData.cfdi_uuid} onChange={e => setFormData(p => ({...p, cfdi_uuid: e.target.value}))} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg" />
                <input type="date" value={formData.fecha} onChange={e => setFormData(p => ({...p, fecha: e.target.value}))} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg" />
                <input type="number" step="0.01" placeholder="Importe total *" value={formData.importe} onChange={e => setFormData(p => ({...p, importe: e.target.value}))} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg" />

                <div>
                  <label className="block text-sm font-medium mb-2">PDF *</label>
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed rounded-xl p-6 text-center">{formData.pdfFile?.name || 'Seleccionar PDF'}</div>
                    <input type="file" accept="application/pdf" onChange={e => setFormData(p => ({...p, pdfFile: e.target.files?.[0] || null}))} className="hidden" />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">XML (opcional)</label>
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed rounded-xl p-6 text-center">{formData.xmlFile?.name || 'Seleccionar XML'}</div>
                    <input type="file" accept=".xml" onChange={e => setFormData(p => ({...p, xmlFile: e.target.files?.[0] || null}))} className="hidden" />
                  </label>
                </div>

                <div className="flex gap-4 pt-6">
                  <button onClick={subirFactura} disabled={uploading} className="flex-1 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50">
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                    {uploading ? 'Subiendo...' : 'Crear Factura'}
                  </button>
                  <button onClick={() => setShowUploadForm(false)} className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl">Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}