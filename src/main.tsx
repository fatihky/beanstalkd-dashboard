import { render } from "preact";
import "./index.css";
import { App } from "./app.tsx";

// retroui'ın fontları
// https://www.retroui.dev/docs/install/vite
import "@fontsource/archivo-black";
// Supports weights 300-700
import "@fontsource-variable/space-grotesk";

render(<App />, document.getElementById("app")!);
