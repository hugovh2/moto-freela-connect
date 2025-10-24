import { createRoot } from "react-dom/client";
import * as Sentry from '@sentry/react';
import { initSentry } from "./lib/sentry";
import App from "./App.tsx";
import "./index.css";

// Initialize Sentry for crash monitoring
initSentry();

// Wrap app with Sentry ErrorBoundary
const SentryApp = Sentry.withErrorBoundary(App, {
  fallback: ({ error, resetError }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h1>
        <p className="text-gray-600 mb-6">
          Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
        </p>
        <button
          onClick={resetError}
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-300"
        >
          Tentar Novamente
        </button>
        {import.meta.env.DEV && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">Detalhes do erro</summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
              {error?.toString()}
            </pre>
          </details>
        )}
      </div>
    </div>
  ),
  showDialog: false,
});

createRoot(document.getElementById("root")!).render(<SentryApp />);
