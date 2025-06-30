# generative-text-adventure

People have already tried using LLMs for free-form text adventure games, such as AI Dungeon and others. Two major persistent issues are:
- world coherence the LLMs will just go along with whatever the player wants, and there's no structure or rules to how things play out
- world persistence: as the game continues, older events fall out of context and can't be recovered

There are many different strategies for addressing these issues. I have been experimenting with this strategy:

I encoded the game world as structured data and defined a structured interface for the LLM to interact with the game world (such as moving items, moving the player, etc). An LLM gets a fixed-size context of what the current situation is regarding the player -- a description of the player and their current location, without any historical context. When the player prompts their next actions, an LLM first interprets this natural-language description of what the player wants to do next into a sequence of actions to perform in order to update the game world (using the structured interface). This feature leverages structured output features of advanced models (such as 2.5 models). Finally, these actions are programmatically interpreted to actually update the game world accordingly. In this way, the model _must_ follow the rules of the game defined by this interface since it can _only_ generate valid actions. Since the game world's information is stored in a structured way, it can be saved indefinitely, facilitating infinite world persistence, and also only a fixed-size slice of relevant features can be presented to the model as context when deciding how to interpret the players prompt their next actions so the context is never overflowed, overcoming the context size limitations.


## Development

To install dependencies:

```bash
bun install
```

To start a development server:

```bash
bun dev
```

To run for production:

```bash
bun start
```

This project was created using `bun init` in bun v1.2.14. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
