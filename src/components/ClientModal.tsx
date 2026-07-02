"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, UserRound, FileText, Mail, Phone, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveClient } from "@/app/(auth)/customers/_actions/save-client";
import { clientSchema, type ClientFormValues } from "@/lib/schemas";
import type { Client } from "@/types";

interface ClientModalProps {
  client?: Client;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClientModal({ client: clientToEdit, onClose, onSuccess }: ClientModalProps) {
  const isEdit = !!clientToEdit;
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: clientToEdit?.name ?? "",
      contactName: clientToEdit?.contactName ?? "",
      doc: clientToEdit?.doc ?? "",
      email: clientToEdit?.email ?? "",
      phone: clientToEdit?.phone ?? "",
    },
  });

  const onValid = (data: ClientFormValues) => {
    startTransition(async () => {
      try {
        await saveClient(
          {
            id: clientToEdit?.id,
            name: data.name.trim(),
            contactName: data.contactName?.trim() || undefined,
            doc: data.doc?.trim() || undefined,
            email: data.email?.trim() || undefined,
            phone: data.phone?.trim() || undefined,
            createdAt: clientToEdit?.createdAt,
          },
          isEdit
        );
        toast.success(isEdit ? "Cliente atualizado com sucesso." : "Cliente cadastrado com sucesso.");
        onSuccess();
      } catch {
        toast.error("Erro ao salvar o cliente. Tente novamente.");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <UserRound className="w-5 h-5 text-brand" />
            <h2 className="font-display text-sm font-semibold text-brand-dark uppercase">
              {isEdit ? "Editar Cliente" : "Cadastrar Novo Cliente"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onValid)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Cliente / Empresa</span>
              </label>
              <input
                type="text"
                {...register("name")}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
                placeholder="Ex. Oficina TechMec"
              />
              {errors.name && <p className="text-[10px] text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <UserRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Contato Responsável</span>
              </label>
              <input
                type="text"
                {...register("contactName")}
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
              {...register("doc")}
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
                {...register("email")}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
                placeholder="cliente@email.com"
              />
              {errors.email && <p className="text-[10px] text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Telefone</span>
              </label>
              <input
                type="text"
                {...register("phone")}
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
              disabled={isPending}
              className="bg-gradient-to-br from-brand to-brand-mid hover:from-brand-dark hover:to-brand disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md shadow-brand/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar e Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
