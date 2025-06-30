import { GameState, Item, ItemName, Place, PlaceName } from "../ontology";

const MainFoyer: Place = {
  name: PlaceName.parse("Main Foyer"),
  description: `You stand in the Main Foyer that refuses to be just one thing. The floor beneath your feet is a mosaic of polished obsidian tiles that seem to drink the light, but as you watch, they ripple and shift, momentarily forming the image of a constellation that no astronomer has ever named before dissolving back into darkness. The walls are not papered or painted, but hung with immense, antique mirrors whose reflections are stubbornly independent; one shows you as you are, another as a child clutching a lost toy, and a third reflects a figure cloaked in shadow, its face tantalizingly obscured. A grand, sweeping staircase of pale, almost translucent marble dominates the space, its balustrade carved into a procession of unknown beasts, but it offers no single destination. Instead, its steps branch and diverge, leading up into swirling mists of pearlescent light or descending into pools of quiet shadow, each path seeming to hum with a different, silent song. The air itself feels alive, crackling with a palpable energy that makes the hairs on your arms stand on end, a silent invitation and a warning wrapped into one.`,
};

const WelcomeNote: Item = {
  name: ItemName.parse("Welcome Note"),
  description: `Welcome to the Shifting Manor! This place is not haunted by ghosts, but by possibilities. Each door opened is a gamble, leading not just to another room, but to another reality—a library where books breathe and exhale stories as clouds of colored dust, an observatory where one can pluck stars from the velvet sky like ripe fruit, a kitchen where pots and pans simmer with recipes for emotions, or a simple hallway where the portraits age in reverse. The very air hums with a strange, static-like energy, a sense that the house itself is a puzzle box, and the player is the key, the trespasser, and the prize all at once. The player's goal is not to escape, but to understand; to navigate the illogical and shifting corridors to find the "Still Room," the one place at the heart of the chaos that is rumored to never change.`,
};

export const state: GameState = {
  setting: `The Shifting Manor is a building that rearranges its own blueprint according to забытые (zabytiye: "forgotten") whims and half-remembered dreams. The setting is not a place haunted by ghosts, but by possibilities. Each door opened is a gamble, leading not just to another room, but to another reality—a library where books breathe and exhale stories as clouds of colored dust, an observatory where one can pluck stars from the velvet sky like ripe fruit, a kitchen where pots and pans simmer with recipes for emotions, or a simple hallway where the portraits age in reverse. The very air hums with a strange, static-like energy, a sense that the house itself is a puzzle box, and the player is the key, the trespasser, and the prize all at once. The player's goal is not to escape, but to understand; to navigate the illogical and shifting corridors to find the "Still Room," the one place at the heart of the chaos that is rumored to never change.`,
  player: {
    name: `Corvin`,
    description: `Corvin is not a treasure hunter or a ghost seeker, but a cartographer of the forgotten, a man whose own memories feel as disjointed and rearranged as the Manor's corridors. He arrived at the threshold of the Shifting Manor not by accident, but by a pull—a quiet, gnawing curiosity about the places where logic frays. He is a man of quiet observation, with a worn leather-bound journal and a steady hand, treating each new impossible reality not as a threat, but as a verse in the Manor's strange, incoherent poem. His movements are patient, his gaze analytical, driven by the belief that if he can learn the rhythm of the house's chaotic heart, he might not only find the legendary Still Room, but also piece together the fragmented echoes of his own past that led him there.`,
  },
  places: new Map([[MainFoyer.name, MainFoyer]]),
  items: new Map([[WelcomeNote.name, WelcomeNote]]),
  playerLocation: {
    place: MainFoyer.name,
    description: `Corvin is standing just inside the enterance of the Foyer.`,
  },
  itemLocations: new Map([
    [
      WelcomeNote.name,
      {
        type: "place",
        item: WelcomeNote.name,
        place: MainFoyer.name,
        description:
          "The welcome note is placed on an old, round oak table in the center of the foyer.",
      },
    ],
  ]),
  placeConnections: new Map([
    [
      MainFoyer.name,
      [
        {
          place1: MainFoyer.name,
          place2: PlaceName.parse("Chester's Library"),
          description:
            "A large pair of doors connects the Main Foyer to Chester's Library.",
        },
        {
          place1: MainFoyer.name,
          place2: PlaceName.parse("Starlight Observatory"),
          description:
            "A small winding passageway connects the Main Foyer and the Starlight Observatory.",
        },
        {
          place1: MainFoyer.name,
          place2: PlaceName.parse("Central Kitchen"),
          description:
            "A metal doorway connects the Main Foyer and the Central Kitchen.",
        },
        {
          place1: MainFoyer.name,
          place2: PlaceName.parse("Grand Hallway"),
          description: "The Foyer connects directly to the Grand Hallway.",
        },
      ],
    ],
  ]),
};
