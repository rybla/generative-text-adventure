import { do_ } from "@/utility";
import { useEffect, useState } from "react";
import type { Game, GameMetadata, GameStatus } from "./ontology";
// import { GameManager } from "./ontology";

export default function App() {
  const [game, set_game] = useState<Game | undefined>(undefined);
  // const gameManager = new GameManager(game as Game);
  const [gameStatus, set_gameStatus] = useState<GameStatus | undefined>(
    undefined,
  );

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
    set_gameStatus(
      await (await fetch("/api/getGameStatus", { method: "POST" })).json(),
    );
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

  function renderDateTime(date: Date) {
    return (
      <div className="DateTime">
        <div className="date">{date.toLocaleDateString()}</div>
        <div className="time">{date.toLocaleTimeString()}</div>
      </div>
    );
  }

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
      {game !== undefined ? (
        <div className="Game">
          <div className="name">{game.metadata.name}</div>
          <div className="creationDateTime">
            {renderDateTime(new Date(game.metadata.creationDateTime))}
          </div>
          <div className="player">
            <div className="name">{game.state.player.name}</div>
            <div className="description">{game.state.player.description}</div>
          </div>
          <div className="playerLocation">
            <div className="placeName">{game.state.playerLocation.place}</div>
            <div className="placeDescription">
              {
                game.state.places!.get(game.state.playerLocation.place)!
                  .description
              }
            </div>
            <div className="playerLocationDescription">
              {game.state.playerLocation.description}
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
      {gameStatus !== undefined ? (
        <div className="GameStatus">
          <div className="messages">
            {gameStatus.messages.map((message) => (
              <div className={`message ${message.type}`}>{message.content}</div>
            ))}
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
