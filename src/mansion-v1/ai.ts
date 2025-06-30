import googleAI from "@genkit-ai/googleai";
import { genkit, z } from "genkit";
import GameManager from "./GameManager";
import {
  Action,
  describeAction,
  Game,
  Item,
  ItemName,
  Room,
  RoomConnection,
  RoomName,
  Result,
  Action_specialized,
} from "./ontology";
import { toJsonSchema } from "genkit/schema";

// -----------------------------------------------------------------------------
// genkit
// -----------------------------------------------------------------------------

export const ai = genkit({ plugins: [googleAI()] });

const model_speed = googleAI.model("gemini-2.5-flash-lite-preview-06-17");
const model_power = googleAI.model("gemini-2.5-pro");

// -----------------------------------------------------------------------------
// prelude
// -----------------------------------------------------------------------------

const mkPrelude = (game: Game) =>
  //   `
  // You are the game master for a unique and creative text adventure game.
  // For all of your tasks, make sure to follow these rules:
  // - ALWAYS refer to the items and rooms by their exact full names when using it as an output field's value.
  //   - NEVER use articles like "the" before the name.
  //   - NEVER wrap names in quotes.
  // - The player is ONLY allowed to take items that are explicitly listed in their current location.
  // - The player is ONLY allowed to drop items that are explicitly listed in their inventory.
  // - The player is only allowed to move to other rooms that are explicitly listed as connected to their current room.
  // `.trim();
  `
You are the game master for a unique and creative text adventure game. Keep the following tips in mind:
  - Be creative!
  - Play along with the user, but also make sure to make the game play out coherently with according the the game's setting.
  - All of your writing should be in present tense and 3rd person perspecitve.
`.trim();

// -----------------------------------------------------------------------------
// GenerateActionPlanDescription
// -----------------------------------------------------------------------------

export type GenerateActionPlanDescription_Input = z.infer<
  typeof GenerateActionPlanDescription_Input
>;
export const GenerateActionPlanDescription_Input = z.object({
  game: Game,
  prompt: z.string(),
});

export type GenerateActionPlanDescription_Output = z.infer<
  typeof GenerateActionPlanDescription_Output
>;
export const GenerateActionPlanDescription_Output = Result(
  z.array(z.string()),
  z.object({
    actionPlanDescription: z.string(),
  }),
);

export const GenerateActionPlanDescription = ai.defineFlow(
  {
    name: "GenerateActionPlanDescription",
    inputSchema: GenerateActionPlanDescription_Input,
    outputSchema: GenerateActionPlanDescription_Output,
  },
  async (input): Promise<GenerateActionPlanDescription_Output> => {
    try {
      const gameManager = new GameManager(input.game);

      const response = await ai.generate({
        model: model_speed,
        system: `
${mkPrelude(input.game)}

The user will attach a file that describes the current status of the game and then describe in natural language what they want to do next in the game. Your task is to consider the user's description in order to reply with a one-paragraph description of what the player does next and what happens in the game as an immediate consequence.

It is critical that you ONLY describe the IMMEDIATE next thing that the player does and its IMMEDIATE consequences. Don't play out the narrative too much, since the player should get a chance to decide how to response to things as they happen.
        `.trim(),
        prompt: [
          {
            media: {
              url: `data:text/markdown;base64,${Buffer.from(gameManager.getGameDescription(), "utf8").toString("base64")}`,
            },
          },
          { text: input.prompt },
        ],
      });

      return { type: "ok", value: { actionPlanDescription: response.text } };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { type: "error", value: [error.message] };
      } else {
        throw error;
      }
    }
  },
);

// -----------------------------------------------------------------------------
// GenerateActions
// -----------------------------------------------------------------------------

export type GenerateActions_Input = z.infer<typeof GenerateActions_Input>;
export const GenerateActions_Input = z.object({
  game: Game,
  actionPlanDescription: z.string(),
});

export type GenerateActions_Output = z.infer<typeof GenerateActions_Output>;
export const GenerateActions_Output = Result(
  z.array(z.string()),
  z.object({
    actions: z.array(Action),
  }),
);

export const GenerateActions = ai.defineFlow(
  {
    name: "GenerateActions",
    inputSchema: GenerateActions_Input,
    outputSchema: GenerateActions_Output,
  },
  async (input): Promise<GenerateActions_Output> => {
    try {
      const Action_schema = Action_specialized(input.game);
      // console.log(
      //   JSON.stringify(toJsonSchema({ schema: Action_schema }), null, 4),
      // );
      const response = await ai.generate({
        model: model_speed,
        system: `
${mkPrelude(input.game)}

The user will provide a description of what the player does next and what happens in the game as an immediate consequence. Your task is to consider this natural-language description and interpret it as a sequence of structured actions.
            `.trim(),
        prompt: input.actionPlanDescription,
        output: {
          schema: z.object({
            actions: z.array(Action_schema),
          }),
        },
      });
      if (response.output === null)
        throw new Error("GenerateActions: response.output === null");

      return { type: "ok", value: { actions: response.output.actions } };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { type: "error", value: [error.message] };
      } else {
        throw error;
      }
    }
  },
);

// -----------------------------------------------------------------------------
// GenerateActionInterpretationDescription
// -----------------------------------------------------------------------------

export type GenerateActionInterpretationDescription_Input = z.infer<
  typeof GenerateActionInterpretationDescription_Input
>;
export const GenerateActionInterpretationDescription_Input = z.object({
  game: Game,
  prompt: z.string(),
  actions: z.array(Action),
});

export type GenerateActionInterpretationDescription_Output = z.infer<
  typeof GenerateActionInterpretationDescription_Output
>;
export const GenerateActionInterpretationDescription_Output = Result(
  z.array(z.string()),
  z.object({
    actionInterpretationDescription: z.string(),
  }),
);

export const GenerateActionInterpretationDescription = ai.defineFlow(
  {
    name: "GenerateActionInterpretationDescription",
    inputSchema: GenerateActionInterpretationDescription_Input,
    outputSchema: GenerateActionInterpretationDescription_Output,
  },
  async (input): Promise<GenerateActionInterpretationDescription_Output> => {
    try {
      const response = await ai.generate({
        model: model_speed,
        system: `
${mkPrelude(input.game)}

The user will provide the textual prompt they wrote to describe what they wanted to do this turn and a list of actions that they actually did this turn. Your task is to write a short paragraph that, keeping the context of what the user was intending to do in mind, rephrases the actions that the player took into a narrative story-telling form. Reply with JUST the one-paragraph description.
          `.trim(),
        prompt: `
What I intended to do this turn:
${input.prompt
  .split("\n")
  .map((s) => `> ${s}`)
  .join("\n")}

Actions I actually took this turn:
${input.actions
  .map(
    (action) => `
    - ${action.type}: ${describeAction(action)}`,
  )
  .join("\n")}`.trim(),
      });

      return {
        type: "ok",
        value: { actionInterpretationDescription: response.text },
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { type: "error", value: [error.message] };
      } else {
        throw error;
      }
    }
  },
);

// -----------------------------------------------------------------------------
// GenerateRoom
// -----------------------------------------------------------------------------

export type GenerateRoom_Input = z.infer<typeof GenerateRoom_Input>;
export const GenerateRoom_Input = z.object({
  game: Game,
  roomName: RoomName,
});

export type GenerateRoom_Output = z.infer<typeof GenerateRoom_Output>;
export const GenerateRoom_Output = Result(
  z.array(z.string()),
  z.object({
    room: Room,
    connections: z.array(RoomConnection),
  }),
);

export const GenerateRoom = ai.defineFlow(
  {
    name: "GenerateRoom",
    inputSchema: GenerateRoom_Input,
    outputSchema: GenerateRoom_Output,
  },
  async (input): Promise<GenerateRoom_Output> => {
    try {
      const response = await ai.generate({
        model: model_speed,
        system: `
${mkPrelude(input.game)}

The user will provide the name of a new room that should be added to the game.
Use this name as inspiration to come up with a flushed-out description of the room.
Additionally, come up with 3 connections that the new room has to other new rooms, such as doors, passageways, paths, or any other ways rooms can be connected.
`.trim(),
        prompt: `${input.roomName}`,
        output: {
          schema: z.object({
            roomDescription: z
              .string()
              .describe(`A one-paragraph description of ${input.roomName}.`),
            connections: z.array(
              z.object({
                otherRoom: RoomName.describe(
                  "The name of the new room to connect to",
                ),
                description: z
                  .string()
                  .describe(
                    "A concise one-sentence description of how the doorway, passage, path, or other type of connection to the new room to connect to",
                  ),
              }),
            ),
          }),
        },
      });

      if (response.output === null)
        throw new Error("GenerateRoom: response.output === null");

      return {
        type: "ok",
        value: {
          room: {
            name: input.roomName,
            description: response.output.roomDescription,
          },
          connections: response.output.connections.map((c) => ({
            room1: input.roomName,
            room2: c.otherRoom,
            description: c.description,
          })),
        },
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { type: "error", value: [error.message] };
      } else {
        throw error;
      }
    }
  },
);

// -----------------------------------------------------------------------------
// GenerateItemsForRoom
// -----------------------------------------------------------------------------

export type GenerateItemsForRoom_Input = z.infer<
  typeof GenerateItemsForRoom_Input
>;
export const GenerateItemsForRoom_Input = z.object({
  game: Game,
  room: RoomName,
});

export type GenerateItemsForRoom_Output = z.infer<
  typeof GenerateItemsForRoom_Output
>;
export const GenerateItemsForRoom_Output = Result(
  z.array(z.string()),
  z.object({
    itemsAndLocations: z.array(
      z.object({
        item: Item,
        description: z
          .string()
          .describe(
            "A concise one-sentence description of where in the room that the item is located.",
          ),
      }),
    ),
  }),
);

export const GenerateItemsForRoom = ai.defineFlow(
  {
    name: "GenerateItemsForRoom",
    inputSchema: GenerateItemsForRoom_Input,
    outputSchema: GenerateItemsForRoom_Output,
  },
  async (input): Promise<GenerateItemsForRoom_Output> => {
    try {
      const response = await ai.generate({
        model: model_speed,
        system: `
${mkPrelude(input.game)}

The user will provide the name of a new room that was just added to the game.
Use this name as inspiration to come up with a list of items that will

flushed-out description of the room.
Additionally, come up with 3 connections that the new room has to other new rooms, such as doors, passageways, paths, or any other ways rooms can be connected.
`.trim(),
        prompt: `${input.room}`,
        output: {
          schema: z.object({
            roomDescription: z
              .string()
              .describe(`A one-paragraph description of ${input.room}.`),
            itemsAndLocations: z.array(
              z.object({
                itemName: ItemName,
                itemDescription: z
                  .string()
                  .describe("A concise one-paragraph description of the item"),
                itemLocationDescription: z
                  .string()
                  .describe(
                    "A concise one-sentence description where exactly the item is in the room.",
                  ),
              }),
            ),
          }),
        },
      });

      if (response.output === null)
        throw new Error("GenerateRoom: response.output === null");

      return {
        type: "ok",
        value: {
          itemsAndLocations: response.output.itemsAndLocations.map((x) => ({
            item: {
              name: x.itemName,
              description: x.itemDescription,
            },
            description: x.itemLocationDescription,
          })),
        },
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { type: "error", value: [error.message] };
      } else {
        throw error;
      }
    }
  },
);
