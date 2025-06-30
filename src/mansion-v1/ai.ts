import googleAI from "@genkit-ai/googleai";
import { genkit, z } from "genkit";
import {
  Action,
  Game,
  GameManager,
  Item,
  ItemName,
  Place,
  PlaceConnection,
  PlaceName,
  Result,
} from "./ontology";
// -----------------------------------------------------------------------------
// genkit
// -----------------------------------------------------------------------------

export const ai = genkit({ plugins: [googleAI()] });

// -----------------------------------------------------------------------------
// prelude
// -----------------------------------------------------------------------------

const mkPrelude = (game: Game) =>
  `
You are the game master for a unique and creative text adventure game.
    `.trim();

// -----------------------------------------------------------------------------
// GenerateActionPlanDescription
// -----------------------------------------------------------------------------

export type GenerateActionPlanDescription_Input = z.infer<
  typeof GenerateActionPlanDescription_Input
>;
export const GenerateActionPlanDescription_Input = z.object({
  game: Game,
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
        model: googleAI.model("gemini-2.5-flash"),
        system: `
${mkPrelude(input.game)}

The user will describe in natural langauge what they want to do next in the game. Your task is to consider the user's description in order to reply with a one-paragraph description of what the player does next and what happens in the game as an immediate consequence.
        `.trim(),
        prompt: [
          {
            media: {
              url: `data:text/markdown;base64,${Buffer.from(gameManager.description, "utf8").toString("base64")}`,
            },
          },
          { text: `${prompt}` },
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
      const response = await ai.generate({
        model: googleAI.model("gemini-2.5-flash"),
        system: `
${mkPrelude(input.game)}

The user will provide a description of what the player does next and what happens in the game as an immediate consequence. Your task is to consider this natural-language description and interpret it as a sequence of structured actions.
            `.trim(),
        prompt: input.actionPlanDescription,
        output: {
          schema: z.object({
            actions: z.array(Action),
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
        model: googleAI.model("gemini-2.5-pro"),
        system: `
${mkPrelude(input.game)}

The user will provide the list of actions that occured in the current turm. Your task is to write a short paragraph that rephrases the information from the actions into a narrative story-telling form. Reply with JUST the one-paragraph description.
          `.trim(),
        prompt: `
In the last turn, the player took the following actions:
${input.actions
  .map(
    (action) => `
    - ${action.type}: ${action.description}`,
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
// GeneratePlace
// -----------------------------------------------------------------------------

export type GeneratePlace_Input = z.infer<typeof GeneratePlace_Input>;
export const GeneratePlace_Input = z.object({
  game: Game,
  placeName: PlaceName,
});

export type GeneratePlace_Output = z.infer<typeof GeneratePlace_Output>;
export const GeneratePlace_Output = Result(
  z.array(z.string()),
  z.object({
    place: Place,
    connections: z.array(PlaceConnection),
  }),
);

export const GeneratePlace = ai.defineFlow(
  {
    name: "GeneratePlace",
    inputSchema: GeneratePlace_Input,
    outputSchema: GeneratePlace_Output,
  },
  async (input): Promise<GeneratePlace_Output> => {
    try {
      const response = await ai.generate({
        model: googleAI.model("gemini-2.5-pro"),
        system: `
${mkPrelude(input.game)}

The user will provide the name of a new place that should be added to the game.
Use this name as inspiration to come up with a flushed-out description of the place.
Additionally, come up with 3 connections that the new place has to other new places, such as doors, passageways, paths, or any other ways places can be connected.
`.trim(),
        prompt: `${input.placeName}`,
        output: {
          schema: z.object({
            placeDescription: z
              .string()
              .describe(`A one-paragraph description of ${input.placeName}.`),
            connections: z.array(
              z.object({
                otherPlace: PlaceName.describe(
                  "The name of the new place to connect to",
                ),
                description: z
                  .string()
                  .describe(
                    "A concise one-sentence description of how the doorway, passage, path, or other type of connection to the new place to connect to",
                  ),
              }),
            ),
          }),
        },
      });

      if (response.output === null)
        throw new Error("GeneratePlace: response.output === null");

      return {
        type: "ok",
        value: {
          place: {
            name: input.placeName,
            description: response.output.placeDescription,
          },
          connections: response.output.connections.map((c) => ({
            place1: input.placeName,
            place2: c.otherPlace,
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
// GenerateItemsForPlace
// -----------------------------------------------------------------------------

export type GenerateItemsForPlace_Input = z.infer<
  typeof GenerateItemsForPlace_Input
>;
export const GenerateItemsForPlace_Input = z.object({
  game: Game,
  place: PlaceName,
});

export type GenerateItemsForPlace_Output = z.infer<
  typeof GenerateItemsForPlace_Output
>;
export const GenerateItemsForPlace_Output = Result(
  z.array(z.string()),
  z.object({
    itemsAndLocations: z.array(
      z.object({
        item: Item,
        description: z
          .string()
          .describe(
            "A concise one-sentence description of where in the place that the item is located.",
          ),
      }),
    ),
  }),
);

export const GenerateItemsForPlace = ai.defineFlow(
  {
    name: "GenerateItemsForPlace",
    inputSchema: GenerateItemsForPlace_Input,
    outputSchema: GenerateItemsForPlace_Output,
  },
  async (input): Promise<GenerateItemsForPlace_Output> => {
    try {
      const response = await ai.generate({
        model: googleAI.model("gemini-2.5-pro"),
        system: `
${mkPrelude(input.game)}

The user will provide the name of a new place that was just added to the game.
Use this name as inspiration to come up with a list of items that will

flushed-out description of the place.
Additionally, come up with 3 connections that the new place has to other new places, such as doors, passageways, paths, or any other ways places can be connected.
`.trim(),
        prompt: `${input.place}`,
        output: {
          schema: z.object({
            placeDescription: z
              .string()
              .describe(`A one-paragraph description of ${input.place}.`),
            itemsAndLocations: z.array(
              z.object({
                itemName: ItemName,
                itemDescription: z
                  .string()
                  .describe("A concise one-paragraph description of the item"),
                itemLocationDescription: z
                  .string()
                  .describe(
                    "A concise one-sentence description where exactly the item is in the place.",
                  ),
              }),
            ),
          }),
        },
      });

      if (response.output === null)
        throw new Error("GeneratePlace: response.output === null");

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
