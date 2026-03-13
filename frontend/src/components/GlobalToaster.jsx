import { Toaster } from "react-hot-toast";

const GlobalToaster = () => {
    return (
        <Toaster
            position="bottom-right"
            containerStyle={{ zIndex: 999999 }}
            toastOptions={{
                // Base structure applied to all toasts
                style: {
                    color: "#ffffff", // White text for all
                    fontWeight: "bold",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                },
                // FULL GREEN background for successes
                success: {
                    style: {
                        background: "#10b981", // Tailwind emerald-500
                    },
                    iconTheme: {
                        primary: "#ffffff", // White checkmark
                        secondary: "#10b981", // Green inner icon circle
                    },
                },
                // FULL RED background for errors (including auth locks)
                error: {
                    style: {
                        background: "#ef4444", // Tailwind red-500
                    },
                    iconTheme: {
                        primary: "#ffffff", // White X mark
                        secondary: "#ef4444", // Red inner icon circle
                    },
                },
            }}
        />
    );
};

export default GlobalToaster;
