import { genkit } from "genkit";
import index from "./index.html";
import googleAI from "@genkit-ai/googleai";

export const ai = genkit({
  plugins: [googleAI()],
  // model: googleAI.model("gemini-2.5-flash"),
});

const server = Bun.serve({
  routes: {
    "/": index,
    // TODO: api
  },
  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`Server running at http://${server.hostname}:${server.port}`);
