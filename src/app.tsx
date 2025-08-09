import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary, LocationProvider, Route, Router } from "preact-iso";
import { NotFound } from "./routes/404";
import HomePage from "./routes/home";
import { trpc } from "./trpc-client";
import { TRPCProvider } from "./utils/trpc";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // With SSR, we usually want to set some default staleTime
      // above 0 to avoid refetching immediately on the client
      staleTime: 60 * 1000,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider queryClient={queryClient} trpcClient={trpc}>
        <LocationProvider>
          <ErrorBoundary>
            <Router>
              <Route path="/" component={HomePage} />
              <Route default component={NotFound} />
            </Router>
          </ErrorBoundary>
        </LocationProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
}
