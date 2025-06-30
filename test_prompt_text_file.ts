import googleAI from "@genkit-ai/googleai";
import { genkit } from "genkit";

export const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model("gemini-2.5-flash"),
});

const markdownContent = `
# This is an example file

This is some random text generated to illustrate the content of a Markdown file. It serves no specific purpose other than to occupy space and provide a context for the example. We can include various Markdown elements to make it more interesting.

- First random item
- Second random item, perhaps a bit longer to show wrapping.
- Third random item, just for good measure.

For more details, visit the [Genkit website](https://genkit.ai).
This file demonstrates how to embed content within a data URL.
`;

const url = `data:text/markdown;base64,${Buffer.from(markdownContent, "utf8").toString("base64")}`;

// console.log(url);
// process.exit(0);

const result = await ai.generate({
  prompt: [
    {
      media: {
        url,
      },
    },
    {
      text: "Summarize the content in the attached file.",
    },
  ],
});

console.log(result.text);
