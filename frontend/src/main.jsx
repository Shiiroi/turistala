import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store";
import GlobalToaster from "./components/GlobalToaster";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Provider store={store}>
            <GlobalToaster />
            <App />
        </Provider>
    </StrictMode>,
);
