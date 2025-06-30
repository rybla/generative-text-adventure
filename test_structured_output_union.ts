import googleAI from "@genkit-ai/googleai";
import { genkit, z } from "genkit";

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model("gemini-2.5-flash"),
});

type Choice = z.infer<typeof Choice>;
// const Choice = z.literal("choice");
// const Choice = z.union([
//   z.object({ type: z.literal("cooperate"), description: z.string() }),
//   z.object({ type: z.literal("defect"), description: z.string() }),
// ]);
const Choice = z.union([
  z.object({ type: z.enum(["cooperate"]), description: z.string() }),
  z.object({ type: z.enum(["defect"]), description: z.string() }),
]);

const flow = ai.defineFlow(
  {
    name: "test_structured_output_union",
    inputSchema: z.object({
      prompt: z.string(),
    }),
    outputSchema: z.object({
      choices: z.array(Choice),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      prompt: input.prompt,
      output: {
        schema: z.object({
          choices: z.array(Choice),
        }),
      },
    });

    if (response.output === null) throw new Error("Failed to generate output");

    return response.output;
  },
);
