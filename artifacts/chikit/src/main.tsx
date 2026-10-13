import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupDemoInterceptor } from "./lib/demoInterceptor";

// Initialize AIIMS Jodhpur virtual hospital stateful mock engine
setupDemoInterceptor();

createRoot(document.getElementById("root")!).render(<App />);

