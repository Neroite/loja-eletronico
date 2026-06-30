import { useState, useEffect, type FormEvent } from 'react';
import { X, UserRound, FileText, Mail, Phone, Building2 } from 'lucide-react';
import { Client } from '../types';
import { makeId } from '../lib/id';

interface ClientModalProps {
  clientToEdit?: Client;
  existingIds: string[]; // IDs already in use — for collision-free new client IDs.
  onClose: () => void;
  onSaveClient: (client: Client, isEdit: boolean) => void;
}

export default function ClientModal({ clientToEdit, existingIds, onClose, onSaveClient }: ClientModalProps) {
  const isEdit = !!clientToEdit;
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [doc, setDoc] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setContactName(clientToEdit.contactName || '');
      setDoc(clientToEdit.doc || '');
      setEmail(clientToEdit.email || '');
      setPhone(clientToEdit.phone || '');
    }
  }, [clientToEdit]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveClient(
      {
        id: clientToEdit?.id ?? makeId('#CLI-', existingIds, 3),
        name: name.trim(),
        contactName: contactName.trim() || undefined,
        doc: doc.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        createdAt: clientToEdit?.createdAt ?? new Date().toISOString()
      },
      isEdit
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <UserRound className="w-5 h-5 text-brand" />
            <h2 className="text-sm font-extrabold text-brand-dark uppercase">
              {clientToEdit ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Cliente / Empresa</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
                placeholder="Ex. Oficina TechMec"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <UserRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Contato Responsável</span>
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
                placeholder="Ex. Roberto Mendes"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>CPF / CNPJ</span>
            </label>
            <input
              type="text"
              value={doc}
              onChange={(e) => setDoc(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
              placeholder="Ex. CPF: 102.302.222-10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>E-mail</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
                placeholder="cliente@email.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Telefone</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-gradient-to-br from-brand to-brand-mid hover:from-brand-dark hover:to-brand text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md shadow-brand/20 active:scale-95 transition-all"
            >
              Confirmar e Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
