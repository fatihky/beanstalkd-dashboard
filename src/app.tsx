import { ErrorBoundary, LocationProvider, Route, Router } from "preact-iso";
import { NotFound } from "./routes/404";
import HomePage from "./routes/home";

export function App() {
  return (
    <>
      <LocationProvider>
        <ErrorBoundary>
          <Router>
            <Route path="/" component={HomePage} />
            <Route default component={NotFound} />
          </Router>
        </ErrorBoundary>
      </LocationProvider>
    </>
  );
}
