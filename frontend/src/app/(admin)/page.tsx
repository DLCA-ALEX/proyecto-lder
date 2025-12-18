'use client';

import { useState, useEffect } from 'react';

// Función para obtener los datos de cada API
const fetchData = async (url: string) => {
  const token = localStorage.getItem('admin_token');  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,  // Autenticación con el token JWT
    },
  });
  if (!response.ok) {
    throw new Error(`Error al obtener los datos de ${url}`);
  }
  return await response.json();
};

export default function Dashboard() {
  const [usersData, setUsersData] = useState<any>(null);
  const [serversData, setServersData] = useState<any>(null);
  const [alertsData, setAlertsData] = useState<any>(null);
  
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isServersLoading, setIsServersLoading] = useState(true);
  const [isAlertsLoading, setIsAlertsLoading] = useState(true);
  
  const [usersError, setUsersError] = useState<string | null>(null);
  const [serversError, setServersError] = useState<string | null>(null);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data for users
    const fetchUsers = async () => {
      try {
        const data = await fetchData(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`);
        console.log('Users Data:', data); // Log data for debugging
        setUsersData(data);
      } catch (error: any) {
        setUsersError(error.message);
      } finally {
        setIsUsersLoading(false);
      }
    };

    // Fetch data for servers
    const fetchServers = async () => {
      try {
        const data = await fetchData(`${process.env.NEXT_PUBLIC_API_URL}/admin/servers`);
        console.log('Servers Data:', data); // Log data for debugging
        setServersData(data);
      } catch (error: any) {
        setServersError(error.message);
      } finally {
        setIsServersLoading(false);
      }
    };

    // Fetch data for alerts
    const fetchAlerts = async () => {
      try {
        const data = await fetchData(`${process.env.NEXT_PUBLIC_API_URL}/alerts`);
        console.log('Alerts Data:', data); // Log data for debugging
        setAlertsData(data);
      } catch (error: any) {
        setAlertsError(error.message);
      } finally {
        setIsAlertsLoading(false);
      }
    };

    fetchUsers();
    fetchServers();
    fetchAlerts();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Resumen</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {/* Card de Usuarios */}
        <div className="p-6 rounded-xl border border-white/20 bg-white/10 shadow-md" onClick={() => { console.log(usersData, serversData, alertsData) }}>
          <div className="text-sm opacity-80">Usuarios</div>
          <div className="text-3xl font-bold">
            {isUsersLoading ? 'Cargando...' : usersData?.total ?? usersData?.items?.length ?? 0}
          </div>
          {usersError && <p className="text-red-500 text-sm">{usersError}</p>}
        </div>

        {/* Card de Servidores */}
        <div className="p-6 rounded-xl border border-white/20 bg-white/10 shadow-md">
          <div className="text-sm opacity-80">Servidores</div>
          <div className="text-3xl font-bold">
            {isServersLoading ? 'Cargando...' : serversData?.total ?? serversData?.items?.length ?? 0}
          </div>
          {serversError && <p className="text-red-500 text-sm">{serversError}</p>}
        </div>

        {/* Card de Alertas */}
        <div className="p-6 rounded-xl border border-white/20 bg-white/10 shadow-md">
          <div className="text-sm opacity-80">Alertas</div>
          <div className="text-3xl font-bold">
            {isAlertsLoading ? 'Cargando...' : alertsData?.total ?? alertsData?.items?.length ?? 0}
          </div>
          {alertsError && <p className="text-red-500 text-sm">{alertsError}</p>}
        </div>
      </div>
    </div>
  );
}
