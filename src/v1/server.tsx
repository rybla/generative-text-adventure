import { genkit, Part, ToolArgument, z } from "genkit";
import index from "./index.html";
import googleAI from "@genkit-ai/googleai";
import {
  Action,
  Game,
  GameId,
  GameMetadata,
  Item,
  ItemHolding,
  ItemName,
  ItemPlacement,
  Location,
  LocationName,
  Npc,
  NpcLocating,
  NpcName,
  PlayerDropItem,
  PlayerTakeItem,
} from "./ontology";
import * as fs from "fs/promises";
import { DynamicToolAction, ToolAction } from "@genkit-ai/ai/tool";
import { GeneratorOfIterable } from "../utility";
import { P } from "node_modules/@genkit-ai/ai/lib/chunk-CT_4hHut";

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

const getGameDescriptionAsMessagePart = (game: Game): Part => {
  const adjacentLocations = game.state.locationAdjecencies.get(
    game.state.player.location,
  )!;

  const nearbyNpcs = Array.from(game.state.npcLocatings.entries()).flatMap(
    ([npc, npcLocating]) =>
      npcLocating!.location === game.state.player.location
        ? [{ npc, npcLocating }]
        : [],
  );

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
${Array.from(game.state.npcLocatings.entries())
  .map(([npc, npcLocating]) =>
    npcLocating!.location === game.state.player.location
      ? [
          `
  - ${npcLocating!.location}: ${npcLocating!.description}
      - Description: ${game.state.npcs.get(npc)!.description}
  `.trim(),
        ]
      : [],
  )
  .join("\n")}


  `.trim();

  const url = `data:text/markdown;base64,${Buffer.from(content, "utf8").toString("base64")}`;

  return { media: { url } };
};

// ai flows

class ActionInterpretationError extends Error {
  constructor() {
    super();
    this.name = "ActionInterpretationError";
  }
}

const updateGame = ai.defineFlow(
  {
    name: "updateGame",
    inputSchema: z.object({
      game: Game,
      prompt: z.string(),
    }),
    outputSchema: z.union([
      z.object({
        type: z.literal("ok"),
        game: Game,
      }),
      z.object({
        type: z.literal("error"),
        reason: z.string(),
      }),
    ]),
  },
  async (input) => {
    const errors: string[] = [];

    const prelude = `
You are the game master for a unique and creative text adventure game.
      `.trim();

    const initialDescriptionResponse = await ai.generate({
      model: googleAI.model("gemini-2.5-flash-preview-04-17"),
      system: `
${prelude}

The user will describe in natural langauge what they want to do next in the game. Your task is to consider the user's description in order to reply with a one-paragraph description of what the player does next and what happens in the game as an immediate consequence.
      `.trim(),
      prompt: [
        getGameDescriptionAsMessagePart(game),
        { text: `${input.prompt}` },
      ],
    });

    // interpret plan as sequence of Actions
    const actionsResponse = await ai.generate({
      model: googleAI.model("gemini-2.5-flash-preview-04-17"),
      system: `
${prelude}

The user will provide a description of what the player does next and what happens in the game as an immediate consequence. Your task is to consider this natural-language description and interpret it as a sequence of structured actions.
        `.trim(),
      prompt: initialDescriptionResponse.text,
      output: {
        schema: z.object({
          actions: z.array(Action),
        }),
      },
    });
    if (actionsResponse.output === null)
      return {
        type: "error" as const,
        reason: "actionsResponse.output === null",
      };

    const actions = actionsResponse.output.actions;

    // --------------------------------
    // utilities
    // --------------------------------

    const getNpc = (npcName: NpcName): Npc => {
      const npc = game.state.npcs.get(npcName);
      if (npc === undefined) {
        errors.push(`The NPC "${npcName}" does not exist.`);
        throw new ActionInterpretationError();
      }
      return npc;
    };

    const getLocation = (locationName: LocationName): Location => {
      const location = game.state.locations.get(locationName);
      if (location === undefined) {
        errors.push(`The location "${location}" does not exist.`);
        throw new ActionInterpretationError();
      }
      return location;
    };

    const getItem = (itemName: ItemName): Item => {
      const item = game.state.items.get(itemName);
      if (item === undefined) {
        errors.push(`The item "${itemName}" does not exist.`);
        throw new ActionInterpretationError();
      }
      return item;
    };

    const setNpcLocation = (
      npc: NpcName,
      location: LocationName,
      npcLocatingDescription: string,
    ): void => {
      getNpc(npc);
      getLocation(location);
      const npcLocating = game.state.npcLocatings.get(npc);
      if (npcLocating === undefined) {
        errors.push(`The NPC "${npc}" does not exist.`);
        throw new ActionInterpretationError();
      }
      npcLocating.location = location;
      npcLocating.description = npcLocatingDescription;
    };

    const addItemToPlayerInventory = (item: ItemName, description: string) => {
      getItem(item);
      game.state.player.inventory.push({ item, description });
    };

    const removeItemFromPlayerInventory = (item: ItemName): void => {
      getItem(item);
      const inventory = game.state.player.inventory;
      const itemIndex = inventory.findIndex(
        (itemHolding) => itemHolding.item === item,
      );
      if (itemIndex === -1) {
        errors.push(
          `The item "${item}" was not found in the player's inventory.`,
        );
        throw new ActionInterpretationError();
      }

      inventory.splice(itemIndex, 1);
    };

    const getNpcInventory = (npc: NpcName): ItemPlacement[] => {
      getNpc(npc);
      const inventory = game.state.npcInventories.get(npc);
      if (inventory === undefined) {
        errors.push(`The NPC "${npc}" does not exist.`);
        throw new ActionInterpretationError();
      }
      return inventory;
    };

    const addItemToNpcInventory = (
      npc: NpcName,
      item: ItemName,
      description: string,
    ) => {
      getNpc(npc);
      getItem(item);
      const inventory = getNpcInventory(npc);
      inventory.push({ item, description });
    };

    const removeItemFromNpcInventory = (npc: NpcName, item: ItemName) => {
      getNpc(npc);
      getItem(item);
      const inventory = getNpcInventory(npc);
      const itemIndex = inventory.findIndex(
        (itemPlacement) => itemPlacement.item === item,
      );
      if (itemIndex === -1) {
        errors.push(
          `The item "${item}" was not found in the inventory of NPC "${npc}".`,
        );
        throw new ActionInterpretationError();
      }

      inventory.splice(itemIndex, 1);
    };

    const getLocationItems = (location: LocationName): ItemPlacement[] => {
      getLocation(location);
      const itemPlacements = game.state.locationItems.get(location);
      if (itemPlacements === undefined) {
        errors.push(`The location "${location}" does not exist.`);
        throw new ActionInterpretationError();
      }
      return itemPlacements;
    };

    const addItemToLocation = (
      location: LocationName,
      item: ItemName,
      description: string,
    ) => {
      getLocation(location);
      getItem(item);
      const itemPlacements = getLocationItems(location);
      itemPlacements.push({ item, description });
    };

    const removeItemFromLocation = (location: LocationName, item: ItemName) => {
      getLocation(location);
      getItem(item);
      const itemPlacements = getLocationItems(location);
      const itemIndex = itemPlacements.findIndex(
        (itemPlacement) => itemPlacement.item === item,
      );
      if (itemIndex === -1) {
        errors.push(
          `The item "${item}" does not exist in the location "${location}".`,
        );
        throw new ActionInterpretationError();
      }
      itemPlacements.splice(itemIndex, 1);
    };

    const getNpcLocating = (npc: NpcName): NpcLocating => {
      getNpc(npc);
      const npcLocating = game.state.npcLocatings.get(npc);
      if (npcLocating === undefined) {
        errors.push(`The NPC "${npc}" does not exist.`);
        throw new ActionInterpretationError();
      }
      return npcLocating;
    };

    // --------------------------------
    // execute actions
    // --------------------------------

    for (const action of actions) {
      try {
        switch (action.type) {
          case "NpcDropItem": {
            removeItemFromNpcInventory(action.npc, action.item);
            addItemToLocation(
              getNpcLocating(action.npc).location,
              action.item,
              action.itemPlacementDescription,
            );
            break;
          }
          case "NpcMove": {
            setNpcLocation(
              action.npc,
              action.location,
              action.npcLocatingDescription,
            );
            break;
          }
          case "NpcTakeItem": {
            removeItemFromLocation(
              getNpcLocating(action.npc).location,
              action.item,
            );
            addItemToNpcInventory(
              action.npc,
              action.item,
              action.itemHoldingDescription,
            );
            break;
          }
          case "PlayerDropItem": {
            removeItemFromPlayerInventory(action.item);
            addItemToLocation(
              game.state.player.location,
              action.item,
              action.itemPlacementDescription,
            );
            break;
          }
          case "PlayerMove": {
            getLocation(action.location);
            game.state.player.location = action.location;
            break;
          }
          case "PlayerTakeItem": {
            removeItemFromLocation(game.state.player.location, action.item);
            addItemToPlayerInventory(action.item, action.holdingDescription);
            break;
          }
        }
      } catch (error: unknown) {
        if (error instanceof ActionInterpretationError) {
          // errors will be accumulated to report at the end
          continue;
        } else {
          throw error;
        }
      }
    }

    // generate a summary of what happened and add the transcript of game
    // TODO
    return {
      type: "ok" as const,
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
