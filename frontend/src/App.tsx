// Root application router.

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthRedirect } from "./features/auth/components/MapGate";
import { MapGate } from "./features/auth/components/MapGate";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { SignupPage } from "./pages/SignupPage";
import { WelcomePage } from "./pages/WelcomePage";

 // React component rendering App.
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route
                    path="/login"
                    element={
                        <AuthRedirect>
                            <LoginPage />
                        </AuthRedirect>
                    }
                />
                <Route
                    path="/signup"
                    element={
                        <AuthRedirect>
                            <SignupPage />
                        </AuthRedirect>
                    }
                />
                <Route
                    path="/forgot-password"
                    element={
                        <AuthRedirect>
                            <ForgotPasswordPage />
                        </AuthRedirect>
                    }
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route
                    path="/map"
                    element={
                        <MapGate>
                            <HomePage />
                        </MapGate>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
