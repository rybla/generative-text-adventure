import { useEffect, useState } from "react";
import { Game, GameMetadata } from "./ontology";
import { do_ } from "@/utility";

export default function App() {
  const [game, set_game] = useState<Game | undefined>(undefined);

  const [savedGameMetadatas, set_savedGameMetadatas] = useState<GameMetadata[]>(
    [],
  );

  // endpoints

  const newGame = async () => {
    await fetch("/api/newGame", { method: "POST" });
    await update_game();
  };

  const saveGame = async () => {
    await fetch("/api/saveGame", { method: "POST" });
    await update_savedGameMetadatas();
  };

  const loadGame = async (id: string) => {
    await fetch(`/api/loadGame`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
    await update_game();
  };

  // updates

  const update_game = async () => {
    set_game(await (await fetch("/api/getGame", { method: "POST" })).json());
  };

  const update_savedGameMetadatas = async () => {
    set_savedGameMetadatas(
      await (
        await fetch("/api/getSavedGameMetadatas", {
          method: "POST",
        })
      ).json(),
    );
  };

  // effects

  useEffect(() => {
    do_(async () => {
      update_game();
    });
  }, []);

  useEffect(() => {
    do_(async () => {
      await update_savedGameMetadatas();
    });
  }, []);

  // render

  return (
    <div className="App">
      <div>App</div>
      <div>
        <button onClick={async () => await newGame()}>New Game</button>
        <button onClick={async () => await saveGame()}>Save Game</button>
        <div>
          {savedGameMetadatas.map((md, i) => (
            <div key={i}>
              <button onClick={async () => await loadGame(md.id)}>
                {md.name}
              </button>
            </div>
          ))}
        </div>
      </div>
      {game !== undefined ? <GameView game={game} /> : <></>}
    </div>
  );
}

export function GameView(props: { game: Game }) {
  return (
    <div className="Game">
      <div className="name">{props.game.metadata.name}</div>
      <div className="name">
        <DateTimeView date={new Date(props.game.metadata.creationDateTime)} />
      </div>
    </div>
  );
}

export function DateTimeView(props: { date: Date }) {
  return (
    <div className="DateTime">
      <div className="date">{props.date.toLocaleDateString()}</div>
      <div className="time">{props.date.toLocaleTimeString()}</div>
    </div>
  );
}
