import * as fs from "fs/promises";
import { z } from "genkit";
import { deepcopy, do_ } from "../utility";
import {
  GenerateActionInterpretationDescription,
  GenerateActionPlanDescription,
  GenerateActions,
  GenerateItemsForRoom,
  GenerateRoom,
} from "./ai";
import { GameError } from "./error";
import * as example1 from "./example/example1";
import GameManager from "./GameManager";
import index from "./index.html";
import {
  Game,
  GameId,
  GameMetadata,
  GameStatus,
  GameStatusMessage,
  PlayerMove,
} from "./ontology";

// constants

const gameDirpath = "./game";

// Game

const newGame = async (): Promise<Game> => {
  const id = Bun.randomUUIDv7();
  const game: Game = {
    metadata: {
      id,
      name: `Game ${id}`,
      creationDateTime: new Date().toISOString(),
    },
    state: example1.state,
    turns: [],
  };

  return game;
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

const gameStatus: GameStatus = {
  messages: [],
};

function log(message: GameStatusMessage) {
  gameStatus.messages.push(message);
  switch (message.type) {
    case "error": {
      console.error(message);
      break;
    }
    case "info": {
      console.info(message);
      break;
    }
    case "warning": {
      console.warn(message);
      break;
    }
  }
}

const gameManager: GameManager = new GameManager(await newGame());

class UpdateGameError extends Error {
  constructor() {
    super();
    this.name = "UpdateGameError";
  }
}

async function promptGame(input: { prompt: string }): Promise<void> {
  const game_old: Game = deepcopy(gameManager.game);

  try {
    const { actionPlanDescription } = await do_(async () => {
      const result = await GenerateActionPlanDescription({
        game: gameManager.game,
        prompt: input.prompt,
      });
      if (result.type === "error") {
        result.value.forEach((content) => log({ type: "error", content }));
        throw new UpdateGameError();
      }
      return result.value;
    });

    // --------------------------------
    // generate actions
    // --------------------------------

    // interpret plan as sequence of Actions
    const { actions } = await do_(async () => {
      const result = await GenerateActions({
        game: gameManager.game,
        actionPlanDescription,
      });
      if (result.type === "error") {
        result.value.forEach((content) => log({ type: "error", content }));
        throw new UpdateGameError();
      }
      return result.value;
    });

    // --------------------------------
    // before interpreting actions
    // --------------------------------

    const playerMoveToNewRoom = actions.find((action): action is PlayerMove => {
      switch (action.type) {
        case "PlayerMove":
          return !gameManager.existsRoom(action.room);
        default:
          return false;
      }
    });

    // if the player is moving to a new room, then generate that new room and some items to go in it
    if (playerMoveToNewRoom !== undefined) {
      await do_(async () => {
        const result = await GenerateRoom({
          game: gameManager.game,
          roomName: playerMoveToNewRoom.room,
        });

        if (result.type === "error") {
          result.value.forEach((content) => log({ type: "error", content }));
          throw new UpdateGameError();
        }

        const room = result.value.room;

        gameManager.createRoom(room, result.value.connections);
      });

      await do_(async () => {
        const result = await GenerateItemsForRoom({
          game: gameManager.game,
          room: playerMoveToNewRoom.room,
        });

        if (result.type === "error") {
          result.value.forEach((content) => log({ type: "error", content }));
          throw new UpdateGameError();
        }

        const itemsAndLocations = result.value.itemsAndLocations;

        for (const { item, description } of itemsAndLocations) {
          gameManager.createItem(item, {
            type: "room",
            item: item.name,
            room: playerMoveToNewRoom.room,
            description,
          });
        }
      });
    }

    // --------------------------------
    // interpret actions
    // --------------------------------

    let errorDuringInterpretingActions = false;

    for (const action of actions) {
      try {
        gameManager.interpretAction(action);
      } catch (error: unknown) {
        if (error instanceof GameError) {
          errorDuringInterpretingActions = true;
          log({ type: "error", content: error.message });
          continue;
        } else {
          throw error;
        }
      }
    }

    if (errorDuringInterpretingActions) {
      gameManager.game = game_old;
      throw new UpdateGameError();
    }

    // --------------------------------
    // after interpreting actions
    // --------------------------------

    // generate a summary of what happened and add the transcript of game
    const { actionInterpretationDescription } = await do_(async () => {
      const result = await GenerateActionInterpretationDescription({
        game: gameManager.game,
        prompt: input.prompt,
        actions,
      });

      if (result.type === "error") {
        result.value.forEach((content) => log({ type: "error", content }));
        throw new UpdateGameError();
      }

      return result.value;
    });

    gameManager.addTurn({
      prompt: input.prompt,
      actions,
      description: actionInterpretationDescription,
    });
  } catch (error: unknown) {
    if (error instanceof UpdateGameError) {
      log({
        type: "error",
        content:
          "Due to the preceeding UpdateGameErrors, failed to update game",
      });
    } else {
      throw error;
    }
  }
}

// server

const server = Bun.serve({
  routes: {
    "/": index,
    "/api/newGame": async (req) => {
      console.log(`${req.method} ${req.url}`);
      gameManager.game = await newGame();
      return new Response();
    },
    "/api/getGame": async (req) => {
      console.log(`${req.method} ${req.url}`);
      return Response.json(gameManager.game);
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
        `${gameDirpath}/${gameManager.game.metadata.id}.json`,
        JSON.stringify(gameManager.game, null, 4),
        {
          encoding: "utf8",
        },
      );
      return new Response();
    },
    "/api/loadGame": async (req) => {
      console.log(`${req.method} ${req.url}`);
      const input = z.object({ id: GameId }).parse(await req.json());
      gameManager.game = await loadGame(input.id);
      return new Response();
    },
    "/api/promptGame": async (req) => {
      console.log(`${req.method} ${req.url}`);
      const data = z.object({ prompt: z.string() }).parse(await req.json());
      await promptGame({ prompt: data.prompt });
      return new Response();
    },
    "/api/getGameStatus": async (req) => {
      console.log(`${req.method} ${req.url}`);
      return Response.json(gameStatus);
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
