import { z } from "genkit";

// ------------------------------------------------
// Names
// ------------------------------------------------

export type PlaceName = z.infer<typeof PlaceName>;
export const PlaceName = z
  .string()
  .brand<"PlaceName">()
  .describe("The name of a place.");

export type ItemName = z.infer<typeof ItemName>;
export const ItemName = z
  .string()
  .brand<"ItemName">()
  .describe("The name of an item");

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
// Place
// ------------------------------------------------

export type Place = z.infer<typeof Place>;
export const Place = z.object({
  name: PlaceName.describe("The name of the place"),
  description: z
    .string()
    .describe("A concise one-paragraph description of the place"),
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
  place: PlaceName,
  description: z
    .string()
    .describe(
      "A concise one-sentence description where exactly the player is currently located in the place.",
    ),
});

export type ItemLocationPlace = z.infer<typeof ItemLocationPlace>;
const ItemLocationPlace = z.object({
  type: z.literal("place"),
  item: ItemName,
  place: PlaceName,
  description: z
    .string()
    .describe(
      "A concise one-sentence description where exactly the item is in the place.",
    ),
});

export type ItemLocationInventory = z.infer<typeof ItemLocationInventory>;
export const ItemLocationInventory = z.object({
  type: z.literal("inventory"),
  item: ItemName,
  description: z
    .string()
    .describe(
      "A concise one-sentence description of how the player is holding the item or storing it in their inventory.",
    ),
});

export type ItemLocation = z.infer<typeof ItemLocation>;
export const ItemLocation = z.union([ItemLocationPlace, ItemLocationInventory]);

export type PlaceConnection = z.infer<typeof PlaceConnection>;
export const PlaceConnection = z.object({
  place1: PlaceName.describe("Place #1"),
  place2: PlaceName.describe("Place #2"),
  description: z
    .string()
    .describe(
      "A concise one-sentence description of how the doorway, passage, or other type of connection from the place #1 to the place #2.",
    ),
});

// ------------------------------------------------
// Action
// ------------------------------------------------

// player actions

export type PlayerTakeItem = z.infer<typeof PlayerTakeItem>;
export const PlayerTakeItem = z.object({
  type: z.literal("PlayerTakeItem"),
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
  type: z.literal("PlayerDropItem"),
  item: ItemName.describe("The item that the player drops"),
  descriptionOfItemInPlace: z
    .string()
    .describe(
      "A concise one-sentence description of how the item is placed in the player's current place",
    ),
  description: z
    .string()
    .describe(
      "A concise one-sentence description of how the player drops the item",
    ),
});

export type PlayerMove = z.infer<typeof PlayerMove>;
export const PlayerMove = z.object({
  type: z.literal("PlayerMove"),
  place: PlaceName.describe("The place that the player moves to"),
  descriptionOfPlayerInPlace: z
    .string()
    .describe(
      "A concise one-sentence description of where exactly the player is in the new place",
    ),
  description: z
    .string()
    .describe(
      "A concise one-sentence description of how the player moves to the new place",
    ),
});

// all actions

export type Action = z.infer<typeof Action>;
export const Action = z.union([PlayerTakeItem, PlayerDropItem, PlayerMove]);

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
  places: z.array(Place).describe("All of the places in the game."),
  items: z.array(Item).describe("All of the items in the game."),
  //
  // relationships
  //
  playerLocation: PlayerLocation,
  itemLocations: z
    .array(ItemLocation)
    .describe("For each item in the game, its location."),
  placeConnections: z
    .array(PlaceConnection)
    .describe("All of the connections between places in the game."),
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
    z.object({ type: z.literal("error"), value: error }),
    z.object({ type: z.literal("ok"), value: ok }),
  ]);

export const mkError = <Error, Ok = any>(value: Error): Result<Error, Ok> => ({
  type: "error",
  value,
});

export const mkOk = <Ok, Error = any>(value: Ok): Result<Error, Ok> => ({
  type: "ok",
  value,
});
