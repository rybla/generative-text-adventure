import { do_ } from "@/utility";
import { KeyboardEventHandler, useEffect, useRef, useState } from "react";
import "./App.css";
import {
  getCurrentRoom,
  getCurrentRoomConnections,
  getCurrentRoomItems,
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
  const leftColumnRef = useRef<HTMLDivElement>(null);

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

    // consoleInputRef.current?.scrollIntoView({
    //   behavior: "smooth",
    //   block: "end",
    // });

    leftColumnRef.current!.scrollTop = leftColumnRef.current!.scrollHeight;
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
      const prompt = event.currentTarget.value.trim();
      consoleInputRef.current!.value = "";
      await promptGame(prompt);
    }
  };

  const consoleInput_onKeyUp: KeyboardEventHandler<
    HTMLTextAreaElement
  > = async (event) => {
    // console.log(event.key);
    if (event.key === "Enter") {
      consoleInputRef.current!.value = "";
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

  function renderGameState(game: Game) {
    return (
      <div className="GameState">
        <div className="player">
          <div className="section-label">Player</div>
          <div className="name">{game.state.player.name}</div>
          <div className="description">{game.state.player.description}</div>
          <div className="Inventory">
            <span className="value-label">Inventory:</span>{" "}
            {getInventory(game).map((itemLocation, i) => (
              <div className="ItemAndLocation" key={i}>
                <div className="itemName">{itemLocation.item}</div>
                <div className="itemDescription">
                  {getItem(game, itemLocation.item).description}
                </div>
                <div className="itemLocationDescription">
                  {itemLocation.description}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="playerLocation">
          <div className="section-label">Current Location</div>
          <div className="roomName">{getCurrentRoom(game).name}</div>
          <div className="roomDescription">
            {getCurrentPlayerLocation(game).description}
          </div>
          <div className="playerLocationDescription">
            {getCurrentRoom(game).description}
          </div>
          <div className="RoomItems">
            <span className="value-label">Items:</span>{" "}
            {getCurrentRoomItems(game).map((location, i) => (
              <div className="ItemAndLocation" key={i}>
                <div className="itemName">{location.item}</div>
                <div className="itemDescription">
                  {getItem(game, location.item).description}
                </div>
                <div className="itemLocationDescription">
                  {location.description}
                </div>
              </div>
            ))}
          </div>
          <div className="Connections">
            <span className="value-label">Connections:</span>{" "}
            {getCurrentRoomConnections(game).map((connection, i) => (
              <div className="RoomConnection" key={i}>
                <div className="name">
                  {connection.room2 === getCurrentRoom(game).name
                    ? connection.room1
                    : connection.room2}
                </div>
                <div className="description">{connection.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderGameMetadata(game: Game) {
    return (
      <div className="GameMetadata">
        <div className="section-label">Metadata</div>
        <div className="name">{game.metadata.name}</div>
        <div className="creationDateTime">
          {renderDateTime(new Date(game.metadata.creationDateTime))}
        </div>
      </div>
    );
  }

  function renderTurns(game: Game) {
    return (
      <div className="Turns">
        <div className="section-label">Turns</div>
        {game.turns.map((turn, i) => (
          <div key={i} className="Turn">
            <div className="prompt">{turn.prompt}</div>
            <div className="description">{turn.description}</div>
          </div>
        ))}
      </div>
    );
  }

  function renderToolbar() {
    return (
      <div className="Toolbar">
        <button onClick={async () => await newGame()}>New Game</button>
        <button onClick={async () => await saveGame()}>Save Game</button>
        {savedGameMetadatas.map((metadata, i) => (
          <button onClick={async () => await loadGame(metadata.id)} key={i}>
            {metadata.name}
          </button>
        ))}
      </div>
    );
  }

  function renderConsole() {
    return (
      <div className="Console">
        <div className="section-label">Console</div>
        <textarea
          ref={consoleInputRef}
          id="consoleInput"
          onKeyDown={consoleInput_onKeyDown}
          onKeyUp={consoleInput_onKeyUp}
        />
      </div>
    );
  }

  function renderGameStatus(gameStatus: GameStatus) {
    return (
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
    );
  }

  return (
    <div className="App">
      <div className="left" ref={leftColumnRef}>
        {game !== undefined ? renderTurns(game) : <></>}
        {renderConsole()}
      </div>
      <div className="middle">
        {game !== undefined ? renderGameState(game) : <></>}
      </div>
      <div className="right">
        <div className="section-label">generative-text-adventure</div>
        {game !== undefined ? renderGameMetadata(game) : <></>}
        {renderToolbar()}
        {gameStatus !== undefined ? renderGameStatus(gameStatus) : <></>}
      </div>
    </div>
  );
}
