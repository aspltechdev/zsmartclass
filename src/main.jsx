import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
// Global button system — single source of truth for button color + size.
// Imported last so it also reaches modals rendered via portals to document.body.
import "./styles/buttons.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);