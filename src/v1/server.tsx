import { genkit, z } from "genkit";
import index from "./index.html";
import googleAI from "@genkit-ai/googleai";
import { Game, GameId, GameMetadata } from "./ontology";
import * as fs from "fs/promises";

// constants

const gameDirpath = "./game";

// initialization

export const ai = genkit({
  plugins: [googleAI()],
  // model: googleAI.model("gemini-2.5-flash"),
});

// Game

const newGame = (): Game => {
  const id = Bun.randomUUIDv7();
  return {
    metadata: {
      id,
      name: `Game ${id}`,
      creationDateTime: new Date(),
    },
    locations: new Map(),
    items: new Map(),
    characters: new Map(),
    characterLocations: new Map(),
    characterInventories: new Map(),
    locationItems: new Map(),
    locationAdjecencies: new Map(),
  };
};

const loadGame = async (id: string): Promise<Game> => {
  return Game.parse(
    JSON.parse(
      await fs.readFile(`${gameDirpath}/${id}.json`, {
        encoding: "utf8",
      }),
    ),
  );
};

let game: Game = newGame();

// server

const server = Bun.serve({
  routes: {
    "/": index,
    "/api/newGame": async (req) => {
      console.log(`${req.method} ${req.url}`);
      game = newGame();
      return new Response();
    },
    "/api/getGame": async (req) => {
      console.log(`${req.method} ${req.url}`);
      return Response.json(game);
    },
    "/api/getSavedGameMetadatas": async (req) => {
      console.log(`${req.method} ${req.url}`);
      if (!(await fs.exists(gameDirpath))) return Response.json([]);
      const savedGameIds = await fs.readdir(gameDirpath);
      const metadatas: GameMetadata[] = await Promise.all(
        savedGameIds.map(
          async (id) => (await loadGame(id.slice(0, -".json".length))).metadata,
        ),
      );
      return Response.json(metadatas);
    },
    "/api/saveGame": async (req) => {
      console.log(`${req.method} ${req.url}`);
      if (!(await fs.exists(gameDirpath))) await fs.mkdir(`${gameDirpath}`);
      await fs.writeFile(
        `${gameDirpath}/${game.metadata.id}.json`,
        JSON.stringify(game, null, 4),
        {
          encoding: "utf8",
        },
      );
      return new Response();
    },
    "/api/loadGame": async (req) => {
      console.log(`${req.method} ${req.url}`);
      const input = z.object({ id: GameId }).parse(await req.json());
      game = await loadGame(input.id);
      return new Response();
    },
  },
  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`Server running at http://${server.hostname}:${server.port}`);
