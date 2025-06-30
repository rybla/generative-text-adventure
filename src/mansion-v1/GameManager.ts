import { BugError, GameError } from "./error";
import type {
  Action,
  Game,
  Item,
  ItemLocation,
  ItemName,
  Room,
  RoomConnection,
  RoomName,
  PlayerLocation,
  Turn,
} from "./ontology";

export default class GameManager {
  constructor(public game: Game) {}

  getInventory() {
    return getInventory(this.game);
  }

  getCurrentRoomConnections() {
    return getCurrentRoomConnections(this.game);
  }

  getCurrentRoom() {
    return getCurrentRoom(this.game);
  }

  getCurrentPlayerLocation() {
    return getCurrentPlayerLocation(this.game);
  }

  getCurrentRoomItems() {
    return getCurrentRoomItems(this.game);
  }

  getItem(item: ItemName) {
    return getItem(this.game, item);
  }

  getItemLocation(item: ItemName) {
    return getItemLocation(this.game, item);
  }

  getRoom(room: RoomName) {
    return getRoom(this.game, room);
  }

  getRoomConnections(room: RoomName) {
    return getRoomConnections(this.game, room);
  }

  existsRoom(room: RoomName) {
    return existsRoom(this.game, room);
  }

  existsItem(item: ItemName) {
    return existsItem(this.game, item);
  }

  getGameDescription() {
    return getGameDescription(this.game);
  }

  addTurn(turn: Turn) {
    this.game.turns.push(turn);
  }

  createRoom(room: Room, roomConnections: RoomConnection[]) {
    if (this.existsRoom(room.name))
      throw new GameError(`The room "${room.name}" already exists.`);
    this.game.state.rooms.push(room);
    this.game.state.roomConnections.push(...roomConnections);
  }

  createItem(item: Item, itemLocation: ItemLocation) {
    if (this.existsItem(item.name))
      throw new GameError(`The item "${item.name}" already exists.`);
    this.game.state.items.push(item);
    this.game.state.itemLocations.push(itemLocation);
  }

  setPlayerLocation(playerLocation: PlayerLocation) {
    existsRoom(this.game, playerLocation.room, true);
    this.game.state.playerLocation = playerLocation;
  }

  setItemLocation(item: ItemName, itemLocation: ItemLocation) {
    existsItem(this.game, item, true);
    const itemLocation_old = this.getItemLocation(item);
    switch (itemLocation.type) {
      case "inventory": {
        if (itemLocation_old.type === "inventory") {
          throw new GameError(
            `The item "${item}" is already in the player's inventory.`,
          );
        }
        break;
      }
      case "room": {
        existsRoom(this.game, itemLocation.room, true);
        if (
          itemLocation_old.type === "room" &&
          itemLocation_old.room === itemLocation.room
        )
          throw new GameError(
            `The item "${item}" is already in the room "${itemLocation.room}".`,
          );
        break;
      }
    }
    this.game.state.itemLocations.splice(
      this.game.state.itemLocations.findIndex(
        ({ item: item_ }) => item_ === item,
      ),
      1,
      itemLocation,
    );
  }

  interpretAction(action: Action) {
    switch (action.type) {
      case "PlayerDropItem": {
        this.setItemLocation(action.item, {
          type: "room",
          item: action.item,
          room: this.game.state.playerLocation.room,
          description: action.descriptionOfItemInRoom,
        });
        break;
      }
      case "PlayerTakeItem": {
        this.setItemLocation(action.item, {
          type: "inventory",
          item: action.item,
          description: action.descriptionOfItemInInventory,
        });
        break;
      }
      case "PlayerMove": {
        this.setPlayerLocation({
          room: action.room,
          description: action.descriptionOfPlayerInRoom,
        });
        break;
      }
      case "PlayerInspect": {
        // IDEA: add to an array of thoughts that go away over time?
        break;
      }
    }
  }
}

export function getInventory(game: Game) {
  return game.state.itemLocations.flatMap((itemLocation) => {
    if (itemLocation.type === "inventory") {
      return [itemLocation];
    } else {
      return [];
    }
  });
}

export function getCurrentRoomConnections(game: Game) {
  return getRoomConnections(game, game.state.playerLocation.room);
}

export function getCurrentRoom(game: Game) {
  return getRoom(game, game.state.playerLocation.room);
}

export function getCurrentPlayerLocation(game: Game) {
  return game.state.playerLocation;
}

export function getCurrentRoomItems(game: Game) {
  return game.state.itemLocations.flatMap((itemLocation) => {
    if (
      itemLocation.type === "room" &&
      itemLocation.room === getCurrentRoom(game).name
    ) {
      return [itemLocation];
    } else {
      return [];
    }
  });
}

export function getItem(game: Game, item: ItemName) {
  existsItem(game, item, true);
  return game.state.items.find(({ name: item_ }) => item_ === item)!;
}

export function getItemLocation(game: Game, item: ItemName) {
  existsItem(game, item, true);
  return game.state.itemLocations.find(({ item: item_ }) => item_ === item)!;
}

export function getRoom(game: Game, room: RoomName) {
  existsRoom(game, room, true);
  return game.state.rooms.find(({ name: room_ }) => room_ === room)!;
}

export function getRoomConnections(game: Game, room: RoomName) {
  existsRoom(game, room, true);
  return game.state.roomConnections.filter(
    ({ room1, room2 }) => room1 === room || room2 === room,
  )!;
}

export function existsRoom(game: Game, room: RoomName, assert = false) {
  if (
    game.state.rooms.find(({ name: room_ }) => room_ === room) === undefined
  ) {
    if (assert) throw new GameError(`The room "${room}" does not exist.`);
    else return false;
  }
  if (
    game.state.roomConnections.find(
      (connection) => connection.room1 === room || connection.room2 === room,
    ) === undefined
  )
    throw new BugError(`The room "${room}" is not in \`roomConnections\`.`);

  return true;
}

export function existsItem(game: Game, item: ItemName, assert = false) {
  if (
    game.state.items.find(({ name: item_ }) => item_ === item) === undefined
  ) {
    if (assert) throw new GameError(`The item "${item}" does not exist.`);
    else return false;
  }
  if (
    game.state.itemLocations.find(({ item: item_ }) => item_ === item) ===
    undefined
  )
    throw new BugError(`The item "${item}" is not in \`itemLocations\`.`);
  return true;
}

export function getGameDescription(game: Game) {
  return `

# Game State

This document describes the current state of the game.

## Setting

${game.state.setting}

## Player

The player's name is "${game.state.player.name}". ${game.state.player.description}

## Inventory

The player inventory contains:
${getInventory(game)
  .map((location) =>
    `
  - "${location.item}": ${location.description}
  - Description: ${getItem(game, location.item).description}
    `.trim(),
  )
  .join("\n")
  .trim()}

## Current Room

The player is currently in "${game.state.playerLocation.room}": ${game.state.playerLocation.description}

The following items are in this room:
${getCurrentRoomItems(game)
  .map((location) =>
    `
  - "${location.item}": ${location.description}
  - Description: ${getItem(game, location.item).description}
    `.trim(),
  )
  .join("\n")
  .trim()}

## Connected Rooms

The player's current room is connected to the following rooms:
${getCurrentRoomConnections(game)
  .map((connection) => `${connection.room2}: ${connection.description}`)
  .join("\n")}

`.trim();
}
