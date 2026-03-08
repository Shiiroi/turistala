import HomePage from "./pages/HomePage";
import { Toaster } from "react-hot-toast";

function App() {
    return (
        <>
            <Toaster
                position="bottom-right"
                containerStyle={{ zIndex: 999999 }}
            />
            <HomePage />
        </>
    );
}

export default App;
