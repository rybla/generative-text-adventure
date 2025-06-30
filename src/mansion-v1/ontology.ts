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
  places: z
    .record(PlaceName, Place)
    .transform((x) => new Map(Object.entries(x)))
    .describe("Associates each place's name with that place data"),
  items: z
    .record(ItemName, Item)
    .transform((x) => new Map(Object.entries(x)))
    .describe("Associates each item's name with that item's data"),
  //
  // relationships
  //
  playerLocation: PlayerLocation,
  itemLocations: z
    .record(ItemName, ItemLocation)
    .transform((x) => new Map(Object.entries(x)))
    .describe("Associates each item's name with that item's location"),
  placeConnections: z
    .record(PlaceName, z.array(PlaceConnection))
    .transform((x) => new Map(Object.entries(x)))
    .describe(
      "Associates each place's name that place's connections to other places.",
    ),
});

// ------------------------------------------------
// Game
// ------------------------------------------------

export type GameId = z.infer<typeof GameId>;
export const GameId = z.string().uuid();

export type GameMetadata = z.infer<typeof GameMetadata>;
export const GameMetadata = z.object({
  id: GameId,
  name: z.string(),
  creationDateTime: z
    .string()
    .datetime()
    .transform((s) => new Date(s)),
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
// errors
// --------------------------------

export class BugError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BugError";
  }
}

export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameError";
  }
}

// --------------------------------
// GameManager
// --------------------------------

export class GameManager {
  constructor(public game: Game) {}

  // global

  addTurn(turn: Turn) {
    this.game.turns.push(turn);
  }

  // existence

  existsPlace(place: PlaceName, assert = false) {
    if (!this.game.state.places.has(place)) {
      if (assert) throw new GameError(`The place "${place}" does not exist.`);
      else return false;
    }
    if (!this.game.state.placeConnections.has(place))
      throw new BugError(
        `The place "${place}" is not in \`placeConnections\`.`,
      );

    return true;
  }

  existsItem(item: ItemName, assert = false) {
    if (!this.game.state.items.has(item)) {
      if (assert) throw new GameError(`The item "${item}" does not exist.`);
      else return false;
    }
    if (!this.game.state.itemLocations.has(item))
      throw new BugError(`The item "${item}" is not in \`itemLocations\`.`);
    return true;
  }

  // getter properties

  get inventory() {
    return new Map(
      this.game.state.itemLocations
        .entries()
        .flatMap<
          [ItemName, ItemLocation & { type: "inventory" }]
        >(([item_, itemLocation]) => {
          const item = ItemName.parse(item_);
          if (itemLocation !== undefined && itemLocation.type === "inventory") {
            return [[item, itemLocation]];
          } else {
            return [];
          }
        }),
    );
  }

  get currentPlaceConnections() {
    return this.getPlaceConnections(this.game.state.playerLocation.place);
  }

  get currentPlace() {
    return this.getPlace(this.game.state.playerLocation.place);
  }

  get currentPlayerLocation() {
    return this.game.state.playerLocation;
  }

  // getters

  getItem(item: ItemName) {
    this.existsItem(item, true);
    return this.game.state.items.get(item)!;
  }

  getItemLocation(item: ItemName) {
    this.existsItem(item, true);
    return this.game.state.itemLocations.get(item)!;
  }

  getPlace(place: PlaceName) {
    this.existsPlace(place, true);
    return this.game.state.places.get(place)!;
  }

  getPlaceConnections(place: PlaceName) {
    this.existsPlace(place, true);
    return this.game.state.placeConnections.get(place)!;
  }

  // create

  createPlace(place: Place, placeConnections: PlaceConnection[]) {
    if (this.existsPlace(place.name))
      throw new GameError(`The place "${place.name}" already exists.`);
    this.game.state.places.set(place.name, place);

    // placeConnections
    this.game.state.placeConnections.set(place.name, placeConnections);
    for (const placeConnection of placeConnections) {
      const placeConnections2 = this.getPlaceConnections(
        placeConnection.place2,
      );
      // swap place1 and place2
      placeConnections2.push({
        place1: placeConnection.place2,
        place2: placeConnection.place1,
        description: placeConnection.description,
      });
    }
  }

  createItem(item: Item, itemLocation: ItemLocation) {
    if (this.existsItem(item.name))
      throw new GameError(`The item "${item.name}" already exists.`);
    this.game.state.items.set(item.name, item);

    this.game.state.itemLocations.set(item.name, itemLocation);
  }

  // modifiers

  setPlayerLocation(playerLocation: PlayerLocation) {
    this.existsPlace(playerLocation.place, true);
    this.game.state.playerLocation = playerLocation;
  }

  setItemLocation(item: ItemName, itemLocation: ItemLocation) {
    this.existsItem(item, true);
    const itemLocation_old = this.getItemLocation(item);
    switch (itemLocation.type) {
      case "inventory": {
        if (itemLocation_old.type === "inventory") {
          throw new GameError(
            `The item "${item}" is already in the player's inventory.`,
          );
        }
        break;
      }
      case "place": {
        this.existsPlace(itemLocation.place, true);
        if (
          itemLocation_old.type === "place" &&
          itemLocation_old.place === itemLocation.place
        )
          throw new GameError(
            `The item "${item}" is already in the place "${itemLocation.place}".`,
          );
        break;
      }
    }
    this.game.state.itemLocations.set(item, itemLocation);
  }

  // action interpretations

  interpretAction(action: Action) {
    switch (action.type) {
      case "PlayerDropItem": {
        this.setItemLocation(action.item, {
          type: "place",
          item: action.item,
          place: this.game.state.playerLocation.place,
          description: action.descriptionOfItemInPlace,
        });
        break;
      }
      case "PlayerTakeItem": {
        this.setItemLocation(action.item, {
          type: "inventory",
          item: action.item,
          description: action.descriptionOfItemInInventory,
        });
        break;
      }
      case "PlayerMove": {
        this.setPlayerLocation({
          place: action.place,
          description: action.descriptionOfPlayerInPlace,
        });
        break;
      }
    }
  }

  get description() {
    return `

# Game State

This document describes the current state of the game.

## Setting

${this.game.state.setting}

## Player

The player's name is "${this.game.state.player.name}". ${this.game.state.player.description}

## Inventory

The player inventory contains:
${this.inventory
  .entries()
  .map(([item, itemLocation]) =>
    `
  - "${item}": ${itemLocation.description}
  - Description: ${this.game.state.items.get(item)!.description}
      `.trim(),
  )
  .toArray()
  .join("\n")
  .trim()}

## Current Place

The player is currently in "${this.game.state.playerLocation.place}": ${this.game.state.playerLocation.description}

## Connected Places

The player's current place is connected to the following places:
${this.currentPlaceConnections.map((connection) => `${connection.place2}: ${connection.description}`).join("\n")}

`.trim();
  }
}

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
