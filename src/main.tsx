import ReactDOM from "react-dom/client";
import App from "@/App";
import "@/index.css";
import { initViewportScale } from "@/lib/viewportScale";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

// Scale the fixed-px UI up to fill large displays (no-op at ≤1920 wide).
initViewportScale();

ReactDOM.createRoot(rootElement).render(<App />);
