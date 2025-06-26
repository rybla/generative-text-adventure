import { genkit, Part, ToolArgument, z } from "genkit";
import index from "./index.html";
import googleAI from "@genkit-ai/googleai";
import {
  Action,
  Game,
  GameId,
  GameMetadata,
  ItemPlacement,
  LocationName,
  PlayerDropItem,
  PlayerTakeItem,
} from "./ontology";
import * as fs from "fs/promises";
import { DynamicToolAction, ToolAction } from "@genkit-ai/ai/tool";

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
    state: {
      setting: `TODO`,
      player: {
        name: `TODO`,
        description: `TODO`,
        location: LocationName.parse(`TODO`),
        inventory: [],
      },
      locations: new Map(),
      items: new Map(),
      npcs: new Map(),
      npcLocatings: new Map(),
      npcInventories: new Map(),
      locationItems: new Map(),
      locationAdjecencies: new Map(),
    },
    turns: [],
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

// prompt utilities

const getGameDescription = (game: Game): Part => {
  const adjacentLocations = game.state.locationAdjecencies.get(
    game.state.player.location,
  )!;

  const nearbyNpcs = game.state.npcLocatings
    .entries()
    .flatMap(([npc, npcLocating]) =>
      npcLocating!.location === game.state.player.location
        ? [{ npc, npcLocating }]
        : [],
    )
    .toArray();

  const content = `
# Game State

## Game Setting

${game.state.setting}

## Player

The player's name is ${game.state.player.name}. ${game.state.player.description}

The player's current location is ${game.state.player.location}. ${game.state.locations.get(game.state.player.location)!.description}

The player inventory contains:
${game.state.player.inventory
  .map((itemHolding) =>
    `
  - ${itemHolding.item}: ${itemHolding.description}
      - Description: ${game.state.items.get(itemHolding.item)!.description}
      `.trim(),
  )
  .join("\n")
  .trim()}

## NPCs

The NPCs in the same location as the player are:
${game.state.npcLocatings
  .entries()
  .flatMap(([npc, npcLocating]) =>
    npcLocating!.location === game.state.player.location
      ? [
          `
  - ${npcLocating!.location}: ${npcLocating!.description}
      - Description: ${game.state.npcs.get(npc)!.description}
  `.trim(),
        ]
      : [],
  )
  .toArray()
  .join("\n")}


  `.trim();

  const url = `data:text/markdown;base64,${Buffer.from(content, "utf8").toString("base64")}`;

  return { media: { url } };
};

// ai flows

const updateGame = ai.defineFlow(
  {
    name: "updateGame",
    inputSchema: z.object({
      game: Game,
      prompt: z.string(),
    }),
    outputSchema: z.object({
      game: Game,
    }),
  },
  async (input) => {
    const prelude = `
You are the game master for a unique and creative text adventure game.
      `.trim();

    const initialDescription = await ai.generate({
      model: googleAI.model("gemini-2.5-flash-preview-04-17"),
      system: `
${prelude}

The user will describe in natural langauge what they want to do next in the game. Your task is to consider the user's description in order to reply with a one-paragraph description of what the player does next and what happens in the game as an immediate consequence.
      `.trim(),
      prompt: [getGameDescription(game), { text: `${input.prompt}` }],
    });

    const ActionOutput = z.union([
      z.object({
        type: z.literal("success"),
      }),
      z.object({
        type: z.literal("failure"),
        reason: z.string(),
      }),
    ]);

    const actions: Action[] = [];

    // interpret plan as sequence of Actions
    const actionDescriptions = await ai.generate({
      model: googleAI.model("gemini-2.5-flash-preview-04-17"),
      system: `
${prelude}

The user will provide a description of what the player does next and what happens in the game as an immediate consequence. Your task is to consider this natural-language description and interpret it as a sequence of structured actions.
        `.trim(),
      tools: [
        ai.dynamicTool(
          {
            name: "PlayerTakeItem",
            description:
              "The player takes an item from their current location into their inventory.",
            inputSchema: PlayerTakeItem,
            outputSchema: ActionOutput,
          },
          async (input) => {
            const itemPlacementIsTargetItem = (
              itemPlacement: ItemPlacement,
            ): boolean => itemPlacement.item !== input.item;

            // remove item from location
            const locationItemPlacements = game.state.locationItems.get(
              game.state.player.location,
            )!;

            if (
              locationItemPlacements.find(itemPlacementIsTargetItem) ===
              undefined
            )
              return {
                type: "failure" as const,
                reason: `There is no item with the name "${input.item}" in the player's current location.`,
              };

            game.state.locationItems.set(
              game.state.player.location,
              locationItemPlacements.filter(
                (itemPlacement) => itemPlacement.item !== input.item,
              ),
            );

            // add item to player inventory
            game.state.player.inventory.push({
              item: input.item,
              description: input.holdingDescription,
            });

            // record action
            actions.push(input);

            return {
              type: "success" as const,
            };
          },
        ),
        ai.dynamicTool({
          name: "PlayerDropItem",
          description:
            "The player drops an item from their inventory into their current location.",
          inputSchema: PlayerDropItem,
          outputSchema: ActionOutput,
        }),
        // TODO: tools for other actions
      ],
      prompt: initialDescription.text,
    });
    // execute actions
    // generate a summary of what happened and add the transcript of game
    // TODO
    return {
      game: input.game,
    };
  },
);

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
    // TODO
    "/api/prompt": async (req) => {
      console.log(`${req.method} ${req.url}`);
      const data = await req.json();
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
