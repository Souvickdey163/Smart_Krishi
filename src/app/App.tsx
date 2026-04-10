import { RouterProvider } from "react-router";
import { router } from "./routes";
import { LanguageProvider } from "./context/LanguageContext";
import { CropStoreProvider } from "./context/CropStoreContext";

export default function App() {
  return (
    <CropStoreProvider>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </CropStoreProvider>
  );
}