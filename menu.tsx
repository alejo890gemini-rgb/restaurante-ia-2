import React from 'react';
import { createRoot } from 'react-dom/client';
import PublicApp from './components/PublicApp';
import { ToastProvider } from './hooks/useToast';
import { ToastContainer } from './components/ToastContainer';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("No se pudo encontrar el elemento raíz para montar la aplicación");
}
const root = createRoot(rootElement);

root.render(
    <React.StrictMode>
        <ToastProvider>
            <PublicApp />
            <ToastContainer />
        </ToastProvider>
    </React.StrictMode>
);
