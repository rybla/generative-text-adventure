import { do_, toReadOnlyArray } from "@/utility";
import { z } from "genkit";

// ------------------------------------------------
// Names
// ------------------------------------------------

export type RoomName = z.infer<typeof RoomName>;
export const RoomName = z.string().describe("The name of a room.");

export type ItemName = z.infer<typeof ItemName>;
export const ItemName = z.string().describe("The name of an item");

// ------------------------------------------------
// Item
// ------------------------------------------------

export type Item = z.infer<typeof Item>;
export const Item = z.object({
  name: ItemName.describe("The name of the item"),
  description: z
    .string()
    .describe("A concise one-paragraph description of the item"),
});

// ------------------------------------------------
// Room
// ------------------------------------------------

export type Room = z.infer<typeof Room>;
export const Room = z.object({
  name: RoomName.describe("The name of the room"),
  description: z
    .string()
    .describe("A concise one-paragraph description of the room"),
});

// ------------------------------------------------
// Player
// ------------------------------------------------

export type Player = z.infer<typeof Player>;
export const Player = z.object({
  name: z.string(),
  description: z.string(),
});

// ------------------------------------------------
// Relations
// ------------------------------------------------

export type PlayerLocation = z.infer<typeof PlayerLocation>;
export const PlayerLocation = z.object({
  room: RoomName,
  description: z
    .string()
    .describe(
      "A concise one-sentence description where exactly the player is currently located in the room.",
    ),
});

export type ItemLocationRoom = z.infer<typeof ItemLocationRoom>;
const ItemLocationRoom = z.object({
  type: z.enum(["room"]),
  item: ItemName,
  room: RoomName,
  description: z
    .string()
    .describe(
      "A concise one-sentence description where exactly the item is in the room.",
    ),
});

export type ItemLocationInventory = z.infer<typeof ItemLocationInventory>;
export const ItemLocationInventory = z.object({
  type: z.enum(["inventory"]),
  item: ItemName,
  description: z
    .string()
    .describe(
      "A concise one-sentence description of how the player is holding the item or storing it in their inventory.",
    ),
});

export type ItemLocation = z.infer<typeof ItemLocation>;
export const ItemLocation = z.union([ItemLocationRoom, ItemLocationInventory]);

export type RoomConnection = z.infer<typeof RoomConnection>;
export const RoomConnection = z.object({
  room1: RoomName.describe("Room #1"),
  room2: RoomName.describe("Room #2"),
  description: z
    .string()
    .describe(
      "A concise one-sentence description of how the doorway, passage, or other type of connection from the room #1 to the room #2.",
    ),
});

// ------------------------------------------------
// Action
// ------------------------------------------------

// player actions

export type PlayerTakeItem = z.infer<typeof PlayerTakeItem>;
export const PlayerTakeItem = z.object({
  type: z.enum(["PlayerTakeItem"]),
  item: ItemName.describe("The item that the player takes"),
  descriptionOfItemInInventory: z
    .string()
    .describe(
      "A concise one-sentence description of exactly how the item is being held or otherwise stored by player",
    ),
  description: z
    .string()
    .describe(
      "A concise one-sentence description of how the player takes the item",
    ),
});

export type PlayerDropItem = z.infer<typeof PlayerDropItem>;
export const PlayerDropItem = z.object({
  type: z.enum(["PlayerDropItem"]),
  item: ItemName.describe("The item that the player drops"),
  descriptionOfItemInRoom: z
    .string()
    .describe(
      "A concise one-sentence description of how the item is roomd in the player's current room",
    ),
  description: z
    .string()
    .describe(
      "A concise one-sentence description of how the player drops the item",
    ),
});

export type PlayerMove = z.infer<typeof PlayerMove>;
export const PlayerMove = z.object({
  type: z.enum(["PlayerMove"]),
  room: RoomName.describe("The room that the player moves to"),
  descriptionOfPlayerInRoom: z
    .string()
    .describe(
      "A concise one-sentence description of where exactly the player is in the new room",
    ),
  description: z
    .string()
    .describe(
      "A concise one-sentence description of how the player moves to the new room",
    ),
});

export type PlayerInspect = z.infer<typeof PlayerInspect>;
export const PlayerInspect = z.object({
  type: z.enum(["PlayerInspect"]),
  inspectProcessDescription: z
    .string()
    .describe(
      "A concise one-sentence description of how the player inspects an item, location, or anything else.",
    ),
  inspectResultDescription: z
    .string()
    .describe(
      "A concise one-sentence description of what the player observes as a result of their inspection.",
    ),
});

export type PlayerPass = z.infer<typeof PlayerPass>;
export const PlayerPass = z.object({
  type: z.enum(["PlayerPass"]),
  description: z
    .string()
    .describe(
      "A concise one-sentence description of how the player idly does something that doesn't modify the game state.",
    ),
});

// all actions

export type Action = z.infer<typeof Action>;
export const Action = z.union([
  PlayerTakeItem,
  PlayerDropItem,
  PlayerMove,
  PlayerInspect,
  PlayerPass,
]);

export function describeAction(action: Action): string {
  switch (action.type) {
    case "PlayerDropItem":
      return `${action.description} New location of the item in current room: ${action.descriptionOfItemInRoom}`;
    case "PlayerTakeItem":
      return `${action.description} New location of the item in the player's inventory: ${action.descriptionOfItemInInventory}`;
    case "PlayerInspect":
      return `${action.inspectProcessDescription} ${action.inspectResultDescription}`;
    case "PlayerMove":
      return `${action.description} New location of the player: ${action.descriptionOfPlayerInRoom}`;
    case "PlayerPass":
      return `${action.description}`;
  }
}

// --------------------------------
// specialized actions
// --------------------------------

export const PlayerTakeItem_specialized = (
  game: Game,
): z.ZodType<PlayerTakeItem> | undefined => {
  const items = toReadOnlyArray(
    game.state.itemLocations.flatMap((location): ItemName[] =>
      location.type === "room" &&
      location.room === game.state.playerLocation.room
        ? [location.item]
        : [],
    ),
  );

  if (items.length === 0) return undefined;

  return z.object({
    type: z.enum(["PlayerTakeItem"]),
    // item: ItemName.describe("The item that the player takes"),
    item: z
      .enum(items as readonly [ItemName, ...ItemName[]])
      .describe("The item that the player takes"),
    descriptionOfItemInInventory: z
      .string()
      .describe(
        "A concise one-sentence description of exactly how the item is being held or otherwise stored by player",
      ),
    description: z
      .string()
      .describe(
        "A concise one-sentence description of how the player takes the item",
      ),
  });
};

export const PlayerDropItem_specialized = (
  game: Game,
): z.ZodType<PlayerDropItem> | undefined => {
  const items = toReadOnlyArray(
    game.state.itemLocations.flatMap((location): ItemName[] =>
      location.type === "inventory" ? [location.item] : [],
    ),
  );
  if (items.length === 0) return undefined;

  return z.object({
    type: z.enum(["PlayerDropItem"]),
    // item: ItemName.describe("The item that the player drops"),
    item: z
      .enum(items as readonly [ItemName, ...ItemName[]])
      .describe("The item that the player drops"),
    descriptionOfItemInRoom: z
      .string()
      .describe(
        "A concise one-sentence description of how the item is roomd in the player's current room",
      ),
    description: z
      .string()
      .describe(
        "A concise one-sentence description of how the player drops the item",
      ),
  });
};

export const PlayerMove_specialized = (
  game: Game,
): z.ZodType<PlayerMove> | undefined => {
  const rooms = toReadOnlyArray(
    game.state.roomConnections.flatMap((connection): RoomName[] =>
      connection.room1 === game.state.playerLocation.room
        ? [connection.room2]
        : connection.room2 === game.state.playerLocation.room
          ? [connection.room1]
          : [],
    ),
  );
  if (rooms.length === 0) return undefined;

  return z.object({
    type: z.enum(["PlayerMove"]),
    // room: RoomName.describe("The room that the player moves to"),
    room: z
      .enum(rooms as readonly [RoomName, ...RoomName[]])
      .describe("The room that the player moves to"),
    descriptionOfPlayerInRoom: z
      .string()
      .describe(
        "A concise one-sentence description of where exactly the player is in the new room",
      ),
    description: z
      .string()
      .describe(
        "A concise one-sentence description of how the player moves to the new room",
      ),
  });
};

export const PlayerInspect_specialized = (
  game: Game,
): z.ZodType<PlayerInspect> | undefined => {
  return z.object({
    type: z.enum(["PlayerInspect"]),
    inspectProcessDescription: z
      .string()
      .describe(
        "A concise one-sentence description of how the player inspects an item, location, or anything else.",
      ),
    inspectResultDescription: z
      .string()
      .describe(
        "A concise one-sentence description of what the player observes as a result of their inspection.",
      ),
  });
};

/**
 * These actions are specialized to the current state of the game. So, for example, they make it so that the player can _only_ interact with items or go to rooms that are actually available.
 */
export const Action_specialized = (game: Game): z.ZodType<Action> => {
  // @ts-ignore
  const actions: readonly z.ZodType<Action>[] = toReadOnlyArray(
    [
      PlayerDropItem_specialized(game),
      PlayerMove_specialized(game),
      PlayerTakeItem_specialized(game),
      PlayerInspect_specialized(game),
    ].filter((action) => action !== undefined),
  );

  if (actions.length === 0) {
    return PlayerPass;
  } else if (actions.length === 1) {
    return actions[0];
  } else {
    return z.union(
      actions as readonly [
        z.ZodType<Action>,
        z.ZodType<Action>,
        ...z.ZodType<Action>[],
      ],
    );
  }
};

// ------------------------------------------------
// Turn
// ------------------------------------------------

export type Turn = z.infer<typeof Turn>;
export const Turn = z.object({
  prompt: z.string(),
  actions: z.array(Action),
  description: z.string(),
});

// ------------------------------------------------
// GameState
// ------------------------------------------------

export type GameState = z.infer<typeof GameState>;
export const GameState = z.object({
  //
  // global
  //
  setting: z
    .string()
    .describe(
      "A detailed multi-paragraph description of the game's world setting.",
    ),
  //
  // player
  //
  player: Player,
  //
  // things
  //
  rooms: z.array(Room).describe("All of the rooms in the game."),
  items: z.array(Item).describe("All of the items in the game."),
  //
  // relationships
  //
  playerLocation: PlayerLocation,
  itemLocations: z
    .array(ItemLocation)
    .describe("For each item in the game, its location."),
  roomConnections: z
    .array(RoomConnection)
    .describe("All of the connections between rooms in the game."),
});

// ------------------------------------------------
// Game
// ------------------------------------------------

export type GameId = z.infer<typeof GameId>;
export const GameId = z.string();

export type GameMetadata = z.infer<typeof GameMetadata>;
export const GameMetadata = z.object({
  id: GameId,
  name: z.string(),
  creationDateTime: z.string(),
});

export type Game = z.infer<typeof Game>;
export const Game = z.object({
  metadata: GameMetadata,
  state: GameState,
  turns: z.array(Turn),
});

// --------------------------------
// status
// --------------------------------

export type GameStatusMessage = z.infer<typeof GameStatusMessage>;
export const GameStatusMessage = z.object({
  type: z.enum(["info", "warning", "error"]),
  content: z.string(),
});

export type GameStatus = z.infer<typeof GameStatus>;
export const GameStatus = z.object({
  messages: z.array(GameStatusMessage),
});

// --------------------------------
// Result
// --------------------------------

export type Result<Error, Ok> =
  | { type: "error"; value: Error }
  | { type: "ok"; value: Ok };

export const Result = <Error, Ok>(error: z.ZodType<Error>, ok: z.ZodType<Ok>) =>
  z.union([
    z.object({ type: z.enum(["error"]), value: error }),
    z.object({ type: z.enum(["ok"]), value: ok }),
  ]);

export const mkError = <Error, Ok = any>(value: Error): Result<Error, Ok> => ({
  type: "error",
  value,
});

export const mkOk = <Ok, Error = any>(value: Ok): Result<Error, Ok> => ({
  type: "ok",
  value,
});
