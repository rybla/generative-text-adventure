import { BugError, GameError } from "./error";
import type {
  Action,
  Game,
  Item,
  ItemLocation,
  ItemName,
  Place,
  PlaceConnection,
  PlaceName,
  PlayerLocation,
  Turn,
} from "./ontology";

export default class GameManager {
  constructor(public game: Game) {}

  getInventory() {
    return getInventory(this.game);
  }

  getCurrentPlaceConnections() {
    return getCurrentPlaceConnections(this.game);
  }

  getCurrentPlace() {
    return getCurrentPlace(this.game);
  }

  getCurrentPlayerLocation() {
    return getCurrentPlayerLocation(this.game);
  }

  getCurrentPlaceItems() {
    return getCurrentPlaceItems(this.game);
  }

  getItem(item: ItemName) {
    return getItem(this.game, item);
  }

  getItemLocation(item: ItemName) {
    return getItemLocation(this.game, item);
  }

  getPlace(place: PlaceName) {
    return getPlace(this.game, place);
  }

  getPlaceConnections(place: PlaceName) {
    return getPlaceConnections(this.game, place);
  }

  existsPlace(place: PlaceName) {
    return existsPlace(this.game, place);
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

  createPlace(place: Place, placeConnections: PlaceConnection[]) {
    if (this.existsPlace(place.name))
      throw new GameError(`The place "${place.name}" already exists.`);
    this.game.state.places.push(place);
    this.game.state.placeConnections.push(...placeConnections);
  }

  createItem(item: Item, itemLocation: ItemLocation) {
    if (this.existsItem(item.name))
      throw new GameError(`The item "${item.name}" already exists.`);
    this.game.state.items.push(item);
    this.game.state.itemLocations.push(itemLocation);
  }

  setPlayerLocation(playerLocation: PlayerLocation) {
    existsPlace(this.game, playerLocation.place, true);
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
      case "place": {
        existsPlace(this.game, itemLocation.place, true);
        if (
          itemLocation_old.type === "place" &&
          itemLocation_old.place === itemLocation.place
        )
          throw new GameError(
            `The item "${item}" is already in the place "${itemLocation.place}".`,
          );
        break;
      }
    }
    this.game.state.itemLocations.push(itemLocation);
  }

  interpretAction(action: Action) {
    switch (action.type) {
      case "PlayerDropItem": {
        this.setItemLocation(action.item, {
          type: "place",
          item: action.item,
          place: this.game.state.playerLocation.place,
          description: action.descriptionOfItemInPlace,
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
          place: action.place,
          description: action.descriptionOfPlayerInPlace,
        });
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

export function getCurrentPlaceConnections(game: Game) {
  return getPlaceConnections(game, game.state.playerLocation.place);
}

export function getCurrentPlace(game: Game) {
  return getPlace(game, game.state.playerLocation.place);
}

export function getCurrentPlayerLocation(game: Game) {
  return game.state.playerLocation;
}

export function getCurrentPlaceItems(game: Game) {
  return game.state.itemLocations.flatMap((itemLocation) => {
    if (
      itemLocation.type === "place" &&
      itemLocation.place === getCurrentPlace(game).name
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

export function getPlace(game: Game, place: PlaceName) {
  existsPlace(game, place, true);
  return game.state.places.find(({ name: place_ }) => place_ === place)!;
}

export function getPlaceConnections(game: Game, place: PlaceName) {
  existsPlace(game, place, true);
  return game.state.placeConnections.filter(
    ({ place1, place2 }) => place1 === place || place2 === place,
  )!;
}

export function existsPlace(game: Game, place: PlaceName, assert = false) {
  if (
    game.state.places.find(({ name: place_ }) => place_ === place) === undefined
  ) {
    if (assert) throw new GameError(`The place "${place}" does not exist.`);
    else return false;
  }
  if (
    game.state.placeConnections.find(
      (connection) =>
        connection.place1 === place || connection.place2 === place,
    ) === undefined
  )
    throw new BugError(`The place "${place}" is not in \`placeConnections\`.`);

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

## Current Place

The player is currently in "${game.state.playerLocation.place}": ${game.state.playerLocation.description}

The following items are in this place:
${getCurrentPlaceItems(game)
  .map((location) =>
    `
  - "${location.item}": ${location.description}
  - Description: ${getItem(game, location.item).description}
    `.trim(),
  )
  .join("\n")
  .trim()}

## Connected Places

The player's current place is connected to the following places:
${getCurrentPlaceConnections(game)
  .map((connection) => `${connection.place2}: ${connection.description}`)
  .join("\n")}

`.trim();
}
