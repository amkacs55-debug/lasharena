import { createContext, useContext, useState } from "react";

interface BookingModalContextValue {
  isOpen: boolean;
  preselectedServiceId: string | null;
  open: (serviceId?: string) => void;
  close: () => void;
}

const BookingModalContext = createContext<BookingModalContextValue | null>(null);

export function BookingModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | null>(null);

  return (
    <BookingModalContext.Provider
      value={{
        isOpen,
        preselectedServiceId,
        open: (serviceId) => {
          setPreselectedServiceId(serviceId ?? null);
          setIsOpen(true);
        },
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </BookingModalContext.Provider>
  );
}

export function useBookingModal() {
  const ctx = useContext(BookingModalContext);
  if (!ctx) throw new Error("useBookingModal must be used within BookingModalProvider");
  return ctx;
}
