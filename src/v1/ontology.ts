import { z } from "genkit";

export type LocationName = z.infer<typeof LocationName>;
const LocationName = z.string();

export type ItemName = z.infer<typeof ItemName>;
const ItemName = z.string();

export type CharacterName = z.infer<typeof CharacterName>;
const CharacterName = z.string();

export type Item = z.infer<typeof Item>;
export const Item = z.object({
  name: z.string().describe("The name of the item"),
  description: z.string().describe("A short description of the item"),
});

export type Location = z.infer<typeof Location>;
export const Location = z.object({
  name: z.string().describe("The name of the location"),
  description: z.string().describe("A short description of the location."),
});

export type Character = z.infer<typeof Character>;
export const Character = z.object({
  name: z.string().describe("The name of the character."),
  description: z.string().describe("A short descriptionˇ of the character."),
});

export type CharacterLocation = z.infer<typeof CharacterLocation>;
export const CharacterLocation = z.object({
  description: z
    .string()
    .describe(
      "A description of where exactly in the location the character currently is.",
    ),
});

export type ItemPlacement = z.infer<typeof ItemPlacement>;
export const ItemPlacement = z.object({
  description: z
    .string()
    .describe(
      "A description of how exactly the item is placed in the location.",
    ),
});

export type ItemHolding = z.infer<typeof ItemHolding>;
export const ItemHolding = z.object({
  description: z
    .string()
    .describe(
      "A description of how exactly the item is being held by a character.",
    ),
});

export type Action = {};

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
  // things
  locations: z
    .record(LocationName, Location)
    .transform((x) => new Map(Object.entries(x)))
    .describe("Associates each location's name with that location data"),
  items: z
    .record(ItemName, Item)
    .transform((x) => new Map(Object.entries(x)))
    .describe("Associates each item's name with that item's data"),
  characters: z
    .record(CharacterName, Character)
    .transform((x) => new Map(Object.entries(x)))
    .describe("Associates each character's name with that character's data"),
  // relationships
  characterLocations: z
    .record(CharacterName, CharacterLocation)
    .transform((x) => new Map(Object.entries(x)))
    .describe(
      "Associates each character's name with the name of the location where the character currently is.",
    ),
  characterInventories: z
    .record(CharacterName, z.array(ItemHolding))
    .transform((x) => new Map(Object.entries(x)))
    .describe(
      "Associates each character's name with an array of the names of the items that the character is holding in some way.",
    ),
  locationItems: z
    .record(LocationName, z.array(ItemPlacement))
    .transform((x) => new Map(Object.entries(x)))
    .describe(
      "Associates each location's name with an array of the placements of items in that location.",
    ),
  locationAdjecencies: z
    .record(LocationName, z.array(LocationName))
    .transform((x) => new Map(Object.entries(x)))
    .describe(
      "Associates each location's name with an array of the names of the locations that are adjacent to that location.",
    ),
});
