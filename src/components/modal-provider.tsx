"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type GlobalModal = "new-sale" | "new-product" | null;

const ModalContext = createContext<{
  open: (modal: GlobalModal) => void;
  close: () => void;
  activeModal: GlobalModal;
}>({ open: () => {}, close: () => {}, activeModal: null });

export function ModalProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<GlobalModal>(null);

  return (
    <ModalContext.Provider
      value={{
        open: setActiveModal,
        close: () => setActiveModal(null),
        activeModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export const useGlobalModal = () => useContext(ModalContext);
