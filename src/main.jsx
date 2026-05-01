import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./constants/api.js";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./components/ToastProvider.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ToastContainer autoClose={1500} />
        <App />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
