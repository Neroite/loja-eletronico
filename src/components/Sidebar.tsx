"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Receipt,
  Warehouse,
  Users,
  Settings,
  Plus,
} from "lucide-react";
import { useGlobalModal } from "./modal-provider";

const MENU = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/sales", label: "Vendas", icon: Receipt },
  { href: "/inventory", label: "Estoque", icon: Warehouse },
  { href: "/customers", label: "Clientes", icon: Users },
  { href: "/settings", label: "Configurações", icon: Settings },
];

interface SidebarProps {
  storeName: string;
  mobileOpen?: boolean;
}

export default function Sidebar({ storeName, mobileOpen = false }: SidebarProps) {
  const pathname = usePathname();
  const { open } = useGlobalModal();

  return (
    <aside
      className={`w-64 h-screen fixed left-0 top-0 bg-brand-dark flex flex-col z-30 transition-transform duration-200 lg:translate-x-0 ${
        mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      }`}
    >
      {/* Brand bar */}
      <div className="relative h-16 px-6 flex flex-col justify-center border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-lg font-semibold tracking-tight text-white leading-none">
            {storeName}
          </h1>
          <span className="bg-brand/25 text-brand-tint text-[9px] font-mono font-medium px-1.5 py-0.5 rounded uppercase">
            v4.0
          </span>
        </div>
        <p className="text-[10px] font-medium text-white/50 uppercase tracking-widest mt-1 leading-none">
          Gestão de Estoque & Vendas
        </p>
      </div>

      <div className="relative flex-1 min-h-0 flex flex-col">
        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 pt-6">
          {MENU.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative w-full flex items-center gap-3 pl-4 pr-4 py-3 rounded-md text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-surface-active text-white"
                    : "text-white/50 hover:bg-surface-hover hover:text-white/80"
                }`}
              >
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full transition-colors duration-150 ${
                    isActive ? "bg-brand" : "bg-transparent"
                  }`}
                  aria-hidden="true"
                />
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-brand" : "text-white/40"}`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Global actions */}
        <div className="px-4 mt-auto space-y-2">
          <button
            onClick={() => open("new-sale")}
            className="w-full bg-brand hover:bg-brand/85 text-white py-3 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Venda</span>
          </button>
          <button
            onClick={() => open("new-product")}
            className="w-full bg-surface-active hover:bg-white/10 text-white/80 py-2.5 px-4 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Produto</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-white/10 pt-4 pb-6 px-3 space-y-0.5">
          <div className="flex items-center justify-between px-4 py-2 text-[11px] text-white/55 font-mono">
            <span>Sistema online</span>
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]"
              title="Sistema online"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
