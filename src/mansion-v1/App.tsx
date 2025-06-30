import { do_ } from "@/utility";
import { KeyboardEventHandler, useEffect, useRef, useState } from "react";
import "./App.css";
import {
  getCurrentPlace,
  getCurrentPlaceConnections,
  getCurrentPlaceItems,
  getCurrentPlayerLocation,
  getInventory,
  getItem,
} from "./GameManager";
import type { Game, GameMetadata, GameStatus } from "./ontology";

export default function App() {
  const [game, set_game] = useState<Game | undefined>(undefined);
  const [gameStatus, set_gameStatus] = useState<GameStatus | undefined>(
    undefined,
  );
  const consoleInputRef = useRef<HTMLTextAreaElement>(null);

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

  const update_game = async () => {
    const game: Game = await (
      await fetch("/api/getGame", { method: "POST" })
    ).json();
    // console.log(`game:\n${JSON.stringify(game, null, 4)}`);
    set_game(game);

    const gameStatus: GameStatus = await (
      await fetch("/api/getGameStatus", { method: "POST" })
    ).json();
    // console.log(`gameStatus:\n${JSON.stringify(gameStatus, null, 4)}`);
    set_gameStatus(gameStatus);
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

  const promptGame = async (prompt: string) => {
    await fetch("/api/promptGame", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    await update_game();
  };

  // event handlers

  const consoleInput_onKeyDown: KeyboardEventHandler<
    HTMLTextAreaElement
  > = async (event) => {
    // console.log(event.key);
    if (event.key === "Enter") {
      await promptGame(event.currentTarget.value.trim());
    }
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
      <div className="section-label">generative-text-adventure</div>
      <div className="toolbar">
        <button onClick={async () => await newGame()}>New Game</button>
        <button onClick={async () => await saveGame()}>Save Game</button>
        <div>
          {savedGameMetadatas.map((metadata, i) => (
            <div key={i}>
              <button onClick={async () => await loadGame(metadata.id)}>
                {metadata.name}
              </button>
            </div>
          ))}
        </div>
      </div>
      {game !== undefined ? (
        <div className="Game">
          <div className="section-label">Game</div>
          <div className="GameMetadata">
            <div className="section-label">Metadata</div>
            <div className="name">{game.metadata.name}</div>
            <div className="creationDateTime">
              {renderDateTime(new Date(game.metadata.creationDateTime))}
            </div>
          </div>
          <div className="GameState">
            <div className="player">
              <div className="section-label">Player</div>
              <div className="name">
                <span className="value-label">Name:</span>{" "}
                {game.state.player.name}
              </div>
              <div className="description">
                <span className="value-label">Description:</span>{" "}
                {game.state.player.description}
              </div>
              <div className="inventory">
                <span className="value-label">Inventory:</span>{" "}
                <ul>
                  {getInventory(game).map((itemLocation, i) => (
                    <li key={i}>
                      <div className="ItemLocation">
                        <div className="name">{itemLocation.item}</div>
                        <div className="description">
                          {getItem(game, itemLocation.item).description}
                        </div>
                        <div className="itemLocationDescription">
                          {itemLocation.description}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="playerLocation">
              <div className="section-label">Current Location</div>
              <div className="placeName">
                <span className="value-label">Name:</span>{" "}
                {getCurrentPlace(game).name}
              </div>
              <span className="value-label">Description:</span>{" "}
              <div className="placeDescription">
                {getCurrentPlayerLocation(game).description}
              </div>
              <div className="playerLocationDescription">
                {getCurrentPlace(game).description}
              </div>
              <div className="items">
                <span className="value-label">Items:</span>{" "}
                <ul>
                  {getCurrentPlaceItems(game).map((location, i) => (
                    <li key={i}>
                      <div className="ItemLocation">
                        <div className="name">{location.item}</div>
                        <div className="description">
                          {getItem(game, location.item).description}
                        </div>
                        <div className="itemLocationDescription">
                          {location.description}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="connections">
                <span className="value-label">Connections:</span>{" "}
                <ul>
                  {getCurrentPlaceConnections(game).map((connection, i) => (
                    <li key={i}>
                      <div className="PlaceConnection">
                        <div className="name">
                          {connection.place2 === getCurrentPlace(game).name
                            ? connection.place1
                            : connection.place2}
                        </div>
                        <div className="description">
                          {connection.description}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="turns">
            <div className="section-label">Turns</div>
            {game.turns.map((turn, i) => (
              <div key={i} className="Turn">
                <div className="prompt">{turn.prompt}</div>
                <div className="description">{turn.description}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <></>
      )}

      <div className="Console">
        <div className="section-label">Console</div>
        <textarea
          ref={consoleInputRef}
          id="consoleInput"
          onKeyDown={consoleInput_onKeyDown}
        />
      </div>

      {gameStatus !== undefined ? (
        <div className="GameStatus">
          <div className="section-label">Status</div>
          <div className="messages">
            {gameStatus.messages.map((message, i) => (
              <div className={`message ${message.type}`} key={i}>
                {message.content}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
