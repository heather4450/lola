import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <meta name="theme-color" content="#0B0B0F" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
            rel="stylesheet"
          />
          <style>{`
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html, body, #__next {
              width: 100%;
              height: 100%;
              background: #0B0B0F;
              color: #ffffff;
            }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              overflow-x: hidden;
              min-height: 100vh;
            }
            input, textarea, button, select {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
            }
            ::-webkit-scrollbar { width: 3px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
          `}</style>
        </head>
        <body>
          {children}
          {/* Telegram WebApp script - LOAD AFTER HTML, NO DEFER/ASYNC */}
          <script src="https://telegram.org/js/telegram-web-app.js" />
        </body>
      </html>
    </QueryClientProvider>
  );
}
