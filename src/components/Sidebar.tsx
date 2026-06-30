import { BarChart3, Receipt, Warehouse, Users, Settings, Plus, HelpCircle } from 'lucide-react';

type Tab = 'dashboard' | 'sales' | 'inventory' | 'customers' | 'settings';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  storeName: string;
  onOpenNewSale: () => void;
  onOpenProductRegister: () => void;
  mobileOpen: boolean;
}

const MENU: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'sales', label: 'Vendas', icon: Receipt },
  { id: 'inventory', label: 'Estoque', icon: Warehouse },
  { id: 'customers', label: 'Clientes', icon: Users },
  { id: 'settings', label: 'Configurações', icon: Settings }
];

export default function Sidebar({
  activeTab, setActiveTab, storeName, onOpenNewSale, onOpenProductRegister, mobileOpen
}: SidebarProps) {
  return (
    <aside
      id="sidebar-container"
      className={`w-64 h-screen fixed left-0 top-0 bg-white flex flex-col z-30 transition-transform duration-200 lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}
    >
      {/* Brand bar — full-bleed (no right divider) so the dark band joins the header seamlessly */}
      <div className="h-16 px-6 flex flex-col justify-center bg-brand-dark border-b border-brand-dark/30 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-extrabold tracking-tight text-white leading-none">{storeName}</h1>
          <span className="bg-white/15 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">v3.0</span>
        </div>
        <p className="text-[10px] font-semibold text-white/60 uppercase tracking-widest mt-1 leading-none">
          Gestão de Estoque & Vendas
        </p>
      </div>

      {/* White body — the right divider lives here only, not across the dark brand bar */}
      <div className="flex-1 min-h-0 flex flex-col border-r border-slate-200">

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 pt-6">
        {MENU.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-br from-brand to-brand-mid text-white shadow-sm shadow-brand/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Global actions */}
      <div className="px-4 mt-auto space-y-2">
        <button
          onClick={onOpenNewSale}
          className="w-full bg-gradient-to-br from-brand to-brand-mid hover:from-brand-dark hover:to-brand text-white py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-brand/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Venda</span>
        </button>
        <button
          onClick={onOpenProductRegister}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      {/* Footer */}
      <div className="mt-6 border-t border-slate-100 pt-4 pb-6 px-3 space-y-0.5">
        <button
          onClick={() => setActiveTab('settings')}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Configurações</span>
        </button>
        <div className="flex items-center justify-between px-4 py-2 text-[11px] text-slate-400 font-medium">
          <span>Sistema online</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Sistema online"></span>
        </div>
      </div>

      </div>
    </aside>
  );
}
