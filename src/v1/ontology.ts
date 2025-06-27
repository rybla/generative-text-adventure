import { z } from "genkit";

// ------------------------------------------------
// Names
// ------------------------------------------------

export type LocationName = z.infer<typeof LocationName>;
export const LocationName = z.string().brand<"LocationName">();

export type ItemName = z.infer<typeof ItemName>;
export const ItemName = z.string().brand<"ItemName">();

export type NpcName = z.infer<typeof NpcName>;
export const NpcName = z.string().brand<"NpcName">();

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

export type ItemPlacement = z.infer<typeof ItemPlacement>;
export const ItemPlacement = z.object({
  item: ItemName.describe("The item"),
  description: z
    .string()
    .describe(
      "A concise one-sentence description of exactly how the item is placed in the location",
    ),
});

export type ItemHolding = z.infer<typeof ItemHolding>;
export const ItemHolding = z.object({
  item: ItemName.describe("The item"),
  description: z
    .string()
    .describe(
      "A concise one-sentence description of exactly how the item is being held or otherwise stored by an NPC or the player",
    ),
});

// ------------------------------------------------
// Location
// ------------------------------------------------

export type Location = z.infer<typeof Location>;
export const Location = z.object({
  name: LocationName.describe("The name of the location"),
  description: z
    .string()
    .describe("A concise one-paragraph description of the location"),
});

// ------------------------------------------------
// Npc
// ------------------------------------------------

export type Npc = z.infer<typeof Npc>;
export const Npc = z.object({
  name: NpcName.describe("The name of the NPC"),
  description: z
    .string()
    .describe("A concise one-paragraph description of the NPC"),
});

export type NpcLocating = z.infer<typeof NpcLocating>;
export const NpcLocating = z.object({
  location: LocationName.describe("The location"),
  description: z
    .string()
    .describe(
      "A concise one-sentence description of exactly where in their location the NPC currently is",
    ),
});

// ------------------------------------------------
// Player
// ------------------------------------------------

export const Player = z.object({
  name: z.string(),
  description: z.string(),
  inventory: z.array(ItemHolding),
  location: LocationName,
});

// ------------------------------------------------
// Action
// ------------------------------------------------

// player actions

export type PlayerTakeItem = z.infer<typeof PlayerTakeItem>;
export const PlayerTakeItem = z.object({
  type: z.literal("PlayerTakeItem"),
  item: ItemName.describe("The item that the player takes"),
  description: z
    .string()
    .describe(
      "A concise one-sentence description of how the player takes the item",
    ),
  holdingDescription: z
    .string()
    .describe(
      "A concise one-sentence description of exactly how the item is being held or otherwise stored by player",
    ),
});

export type PlayerDropItem = z.infer<typeof PlayerDropItem>;
export const PlayerDropItem = z.object({
  type: z.literal("PlayerDropItem"),
  item: ItemName.describe("The item that the player drops"),
  itemPlacementDescription: z
    .string()
    .describe(
      "A concise one-sentence description of how the item is placed in the location",
    ),
  description: z
    .string()
    .describe(
      "A concise one-sentence description of how the player drops the item",
    ),
});

export const PlayerMove = z.object({
  type: z.literal("PlayerMove"),
  location: LocationName.describe("The location that the player moves to"),
  description: z
    .string()
    .describe(
      "A concise one-sentence description of how the player moves to the new location",
    ),
});

// npc actions

export type NpcMove = z.infer<typeof NpcMove>;
export const NpcMove = z.object({
  type: z.literal("NpcMove"),
  npc: NpcName,
  location: LocationName.describe("The location that the NPC moves to"),
  npcLocatingDescription: z
    .string()
    .describe(
      "A concise one-sentence description of where exactly the NPC is in the new location they move to.",
    ),
  description: z
    .string()
    .describe(
      "A concise one-sentence description of how the NPC moves to the new location",
    ),
});

export type NpcTakeItem = z.infer<typeof NpcTakeItem>;
export const NpcTakeItem = z.object({
  type: z.literal("NpcTakeItem"),
  npc: NpcName,
  item: ItemName.describe("The item that the NPC takes"),
  itemHoldingDescription: z
    .string()
    .describe(
      "A concise one-sentence description of how the NPC holds the item",
    ),
  description: z
    .string()
    .describe(
      "A concise one-sentence description of how the NPC takes the item",
    ),
});

export type NpcDropItem = z.infer<typeof NpcDropItem>;
export const NpcDropItem = z.object({
  type: z.literal("NpcDropItem"),
  npc: NpcName,
  item: ItemName.describe("The item that the NPC drops"),
  itemPlacementDescription: z
    .string()
    .describe(
      "A concise one-sentence description of where in the location that the NPC drops the item.",
    ),
  description: z
    .string()
    .describe("A concise one-sentence of how the NPC drops the item"),
});

// all actions

export type Action = z.infer<typeof Action>;
export const Action = z.union([
  PlayerTakeItem,
  PlayerDropItem,
  PlayerMove,
  NpcMove,
  NpcTakeItem,
  NpcDropItem,
]);

// ------------------------------------------------
// Turn
// ------------------------------------------------

export const Turn = z.object({
  prompt: z.string(),
  actions: z.array(Action),
  description: z.string(),
});

// ------------------------------------------------
// GameState
// ------------------------------------------------

// TODO: change organization so that there is a relation Item => Position (which can be player inventory, NPC inventory, or location inventory)
// TODO: standardize names: dont use placement, holding, etc. make a word to use for all of them
export type GameState = z.infer<typeof GameState>;
export const GameState = z.object({
  setting: z
    .string()
    .describe(
      "A detailed multi-paragraph description of the game's world setting.",
    ),
  // player
  player: Player,
  // things
  locations: z
    .record(LocationName, Location)
    .transform((x) => new Map(Object.entries(x)))
    .describe("Associates each location's name with that location data"),
  items: z
    .record(ItemName, Item)
    .transform((x) => new Map(Object.entries(x)))
    .describe("Associates each item's name with that item's data"),
  npcs: z
    .record(NpcName, Npc)
    .transform((x) => new Map(Object.entries(x)))
    .describe("Associates each NPC's name with that NPC's data"),
  // relationships
  npcLocatings: z
    .record(NpcName, NpcLocating)
    .transform((x) => new Map(Object.entries(x)))
    .describe(
      "Associates each NPC's name with the name of the location where the NPC currently is",
    ),
  npcInventories: z
    .record(NpcName, z.array(ItemHolding))
    .transform((x) => new Map(Object.entries(x)))
    .describe(
      "Associates each NPC's name with an array of the names of the items that the NPC is holding in some way",
    ),
  locationItems: z
    .record(LocationName, z.array(ItemPlacement))
    .transform((x) => new Map(Object.entries(x)))
    .describe(
      "Associates each location's name with an array of the placements of items in that location",
    ),
  locationAdjecencies: z
    .record(LocationName, z.array(LocationName))
    .transform((x) => new Map(Object.entries(x)))
    .describe(
      "Associates each location's name with an array of the names of the locations that are adjacent to that location",
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
