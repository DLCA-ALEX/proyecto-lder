// src/layout/AppSidebar.tsx  ← VERSIÓN FINAL, DARK MODE PERFECTO, TODO FUNCIONANDO
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { getVisibleRoutes } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { ChevronDownIcon } from "@/icons/index";
import SidebarWidget from "./SidebarWidget";
import { useState } from "react";

export default function AppSidebar() {
  const { isExpanded, isHovered, isMobileOpen, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { type, role } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const routes = getVisibleRoutes(type, role);

  // Mientras carga la sesión
  if (!type || !role) {
    return (
      <aside className="fixed inset-y-0 left-0 w-20 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <div className="p-6">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex flex-col
        bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-800
        text-gray-900 dark:text-gray-100
        transition-all duration-300 ease-in-out
        ${isExpanded || isMobileOpen ? "w-64" : isHovered ? "w-64" : "w-20"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* LOGO */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <Link href="/" className="block">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              {/* Logo claro (light mode) */}
              <Image
                src="/images/logo/Logo.svg"
                alt="Logo"
                width={140}
                height={40}
                className="hidden dark:block"
                priority
              />
              {/* Logo oscuro (dark mode) */}
              <Image
                src="/images/logo/Logo.svg"
                alt="Logo"
                width={140}
                height={40}
                className="block dark:hidden"
                priority
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
              className="mx-auto"
            />
          )}
        </Link>
      </div>

      {/* MENÚ */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {routes.map((item) => {
            const isActive = pathname === item.path;
            const hasSubItems = item.subItems && item.subItems.length > 0;

            return (
              <li key={item.name}>
                {/* Item con submenú */}
                {hasSubItems ? (
                  <button
                    onClick={() => setOpenSubmenu(openSubmenu === item.name ? null : item.name)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                      ${openSubmenu === item.name
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <>
                        <span className="flex-1 text-left font-medium">{item.name}</span>
                        <ChevronDownIcon
                          className={`w-4 h-4 transition-transform duration-200
                            ${openSubmenu === item.name ? "rotate-180" : ""}`}
                        />
                      </>
                    )}
                  </button>
                ) : (
                  /* Item simple */
                  <Link
                    href={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium
                      ${isActive
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {(isExpanded || isHovered || isMobileOpen) && <span>{item.name}</span>}
                  </Link>
                )}

                {/* SUBMENÚ */}
                {hasSubItems && openSubmenu === item.name && (isExpanded || isHovered || isMobileOpen) && (
                  <ul className="mt-2 ml-12 space-y-1">
                    {item.subItems!.map((sub) => {
                      const canSee = sub.allowedRoles.includes(role);
                      if (!canSee) return null;

                      return (
                        <li key={sub.path}>
                          <Link
                            href={sub.path}
                            className={`
                              block py-2 px-4 rounded text-sm transition-all
                              ${pathname === sub.path
                                ? "text-blue-600 dark:text-blue-400 font-medium"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                              }
                            `}
                          >
                            {sub.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Widget inferior (solo visible cuando está expandido) */}
      {(isExpanded || isHovered || isMobileOpen) && <SidebarWidget />}
    </aside>
  );
}