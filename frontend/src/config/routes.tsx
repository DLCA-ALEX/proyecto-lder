// src/config/routes.ts
import {
    BoxCubeIcon,
    CalenderIcon,
    ChevronDownIcon,
    GridIcon,
    HorizontaLDots,
    ListIcon,
    PageIcon,
    PieChartIcon,
    PlugInIcon,
    TableIcon,
    UserCircleIcon,
  } from "../icons/index";
  
  export type AppRoute = {
    name: string;
    path: string;
    icon: React.ReactNode;
    allowedRoles: string[]; // roles que pueden ver esta opción
    allowedTypes?: ("admin" | "portal")[]; // opcional: solo para separar admin vs portal
    subItems?: { name: string; path: string; allowedRoles: string[] }[];
  };
  
  // RUTAS VISIBLES PARA TODOS
  export const commonRoutes: AppRoute[] = [
    {
      name: "Inicio",
      path: "/",
      icon: <UserCircleIcon />,
      allowedRoles: ["admin", "billing", "monitor", "reader", "end_user"],
      allowedTypes: ["admin", "portal"],
    },
  ];
  
  // RUTAS SOLO PARA ADMIN INTERNO
  export const adminRoutes: AppRoute[] = [
    {
      name: "Panel Admin",
      path: "/",
      icon: <UserCircleIcon />,
      allowedRoles: ["admin"],
      allowedTypes: ["admin"],
    },
    {
      name: "Usuarios Portal",
      path: "/usuarios",
      icon: <UserCircleIcon />,
      allowedRoles: ["admin", "billing"],
      allowedTypes: ["admin"],
    },
    {
      name: "Servidores",
      path: "/servidores",
      icon: <UserCircleIcon />,
      allowedRoles: ["admin", "monitor"],
      allowedTypes: ["admin"],
    },
    {
      name: "Facturas",
      path: "/facturas",
      icon: <UserCircleIcon />,
      allowedRoles: ["admin", "billing"],
      allowedTypes: ["admin"],
    },
    {
      name: "Alertas",
      path: "/alertas",
      icon: <UserCircleIcon />,
      allowedRoles: ["admin", "monitor", "billing"],
      allowedTypes: ["admin"],
    },
    {
      name: "PAgos",
      path: "/pagos",
      icon: <UserCircleIcon />,
      allowedRoles: ["admin", "monitor", "billing"],
      allowedTypes: ["admin"],
    },
  ];
  
  // RUTAS SOLO PARA USUARIOS DEL PORTAL
  export const portalRoutes: AppRoute[] = [
    {
      name: "Mi Servidor",
      path: "/portal/servidor",
      icon: <UserCircleIcon />,
      allowedRoles: ["end_user", "admin"],
      allowedTypes: ["portal"],
    },
    {
      name: "Mis Facturas",
      path: "/portal/facturas",
      icon: <UserCircleIcon />,
      allowedRoles: ["end_user"],
      allowedTypes: ["portal"],
    },
    {
      name: "Soporte",
      path: "/portal/soporte",
      icon: <UserCircleIcon />,
      allowedRoles: ["end_user", "admin"],
      allowedTypes: ["portal"],
    },
  ];
  
  // Combinamos según el tipo de usuario
  export const getVisibleRoutes = (userType: "admin" | "portal" | null, role: string | null) => {
    if (!role || !userType) return [];
  
    const allRoutes = [...commonRoutes];
  
    if (userType === "admin") {
      allRoutes.push(...adminRoutes);
    } else if (userType === "portal") {
      allRoutes.push(...portalRoutes);
    }
  
    return allRoutes.filter(route =>
      route.allowedRoles.includes(role) &&
      (!route.allowedTypes || route.allowedTypes.includes(userType))
    );
  };