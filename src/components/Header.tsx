"use client";

import { Search, Bell, UserRound, Menu } from "lucide-react";
import { AVATAR_URL } from "../initialData";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  title: string;
  showSearch: boolean;
  notificationsCount: number;
  onBellClick: () => void;
  onMenuClick: () => void;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  title,
  showSearch,
  notificationsCount,
  onBellClick,
  onMenuClick,
}: HeaderProps) {
  return (
    <header className="h-16 fixed top-0 right-0 left-0 lg:left-64 z-10 bg-brand-dark border-b border-brand-dark/30 shadow-sm flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 sm:gap-6">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-white/80 hover:text-white p-1.5 -ml-1 rounded-lg hover:bg-white/10 transition-colors"
          title="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-6">
        {showSearch && (
          <div className="relative group w-64 md:w-80 transition-all duration-300">
            <span className="absolute inset-y-0 left-3 flex items-center text-white/70">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar"
              className="w-full bg-white/10 border border-white/25 rounded-full pl-10 pr-4 py-1.5 text-xs text-white outline-none focus:bg-white/20 focus:ring-2 focus:ring-white/40 focus:border-transparent transition-all placeholder-white/60"
              placeholder="Buscar por ID, item ou cliente..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        )}

        <button
          onClick={onBellClick}
          className="relative text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
          title="Itens para reposição"
        >
          <Bell className="w-4 h-4" />
          {notificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-brand">
              {notificationsCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-white/20">
          <div className="text-right hidden xl:block">
            <p className="text-xs font-bold text-white leading-none">
              Marcos Silva
            </p>
            <p className="text-[9px] font-bold text-white/60 uppercase tracking-wide mt-0.5">
              Gerente de Vendas
            </p>
          </div>
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/50 shadow-sm bg-white/10 flex items-center justify-center">
            {AVATAR_URL ? (
              <img
                src={AVATAR_URL}
                className="w-full h-full object-cover"
                alt="Marcos Silva"
                referrerPolicy="no-referrer"
              />
            ) : (
              <UserRound className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
