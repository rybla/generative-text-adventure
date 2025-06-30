import { GameState, Item, ItemName, Room, RoomName } from "../ontology";

const MainFoyer: Room = {
  name: RoomName.parse("Main Foyer"),
  description: `In the Foyer, nothing is constant. The obsidian floor shifts from darkness to the light of alien stars. The mirrored walls show not just you, but your childhood and a future shrouded in shadow. From a grand staircase of pale marble, carved with a procession of strange beasts, infinite paths diverge into mist and shadow. The air itself is a live wire, crackling with the twin promises of welcome and warning.`,
};

const WelcomeNote: Item = {
  name: ItemName.parse("Welcome Note"),
  description: `Welcome to the Shifting Manor! This place is not haunted by ghosts, but by possibilities. Each door opened is a gamble, leading not just to another room, but to another reality—a library where books breathe and exhale stories as clouds of colored dust, an observatory where one can pluck stars from the velvet sky like ripe fruit, a kitchen where pots and pans simmer with recipes for emotions, or a simple hallway where the portraits age in reverse. The very air hums with a strange, static-like energy, a sense that the house itself is a puzzle box, and the player is the key, the trespasser, and the prize all at once. The player's goal is not to escape, but to understand; to navigate the illogical and shifting corridors to find the "Still Room," the one place at the heart of the chaos that is rumored to never change.`,
};

const Flashlight: Item = {
  name: ItemName.parse("Flashlight"),
  description: `A simple flashlight, but one that illuminates the dark corners of the Shifting Manor. It's not just a tool, but a companion, a reminder that even in the most chaotic of places, there is always a way forward.`,
};

export const state: GameState = {
  setting: `The Shifting Manor is a building that rearranges its own blueprint according to забытые (zabytiye: "forgotten") whims and half-remembered dreams. The setting is not a place haunted by ghosts, but by possibilities. Each door opened is a gamble, leading not just to another room, but to another reality—a library where books breathe and exhale stories as clouds of colored dust, an observatory where one can pluck stars from the velvet sky like ripe fruit, a kitchen where pots and pans simmer with recipes for emotions, or a simple hallway where the portraits age in reverse. The very air hums with a strange, static-like energy, a sense that the house itself is a puzzle box, and the player is the key, the trespasser, and the prize all at once. The player's goal is not to escape, but to understand; to navigate the illogical and shifting corridors to find the "Still Room," the one place at the heart of the chaos that is rumored to never change.`,
  player: {
    name: `Corvin`,
    description: `Drawn to the Shifting Manor by its fraying logic, Corvin came as a cartographer of the forgotten, his own memories as disjointed as its corridors. No treasure hunter, he arrived with only a worn journal and a steady hand, treating each new impossibility not as a threat, but as a verse in the house's incoherent poem. Patient and analytical, he seeks the rhythm of the Manor's chaotic heart, believing that in mapping it, he will find not only the legendary Still Room but the fragmented path of his own past.`,
  },
  rooms: [MainFoyer],
  items: [WelcomeNote, Flashlight],
  playerLocation: {
    room: MainFoyer.name,
    description: `Corvin is standing just inside the entrance of the Foyer.`,
  },
  itemLocations: [
    {
      type: "room",
      item: WelcomeNote.name,
      room: MainFoyer.name,
      description:
        "The welcome note is placed on an old, round oak table in the center of the foyer.",
    },
    {
      type: "inventory",
      item: Flashlight.name,
      description: "The flashlight is in Corvin's pocket.",
    },
  ],
  roomConnections: [
    {
      room1: MainFoyer.name,
      room2: RoomName.parse("Chester's Library"),
      description:
        "A large pair of doors connects the Main Foyer to Chester's Library.",
    },
    {
      room1: MainFoyer.name,
      room2: RoomName.parse("Starlight Observatory"),
      description:
        "A small winding passageway connects the Main Foyer and the Starlight Observatory.",
    },
    {
      room1: MainFoyer.name,
      room2: RoomName.parse("Central Kitchen"),
      description:
        "A metal doorway connects the Main Foyer and the Central Kitchen.",
    },
    {
      room1: MainFoyer.name,
      room2: RoomName.parse("Grand Hallway"),
      description: "The Foyer connects directly to the Grand Hallway.",
    },
  ],
};
