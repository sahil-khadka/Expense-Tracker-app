import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((message, type = "success") => {
    if (!message) return;
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(null), 1500);
    return () => clearTimeout(timeout);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="toast-container">
          <div
            className={`toast-notification ${
              toast.type === "error" ? "toast-error" : "toast-success"
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              aria-label="Dismiss notification"
              onClick={hideToast}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.showToast;
}
