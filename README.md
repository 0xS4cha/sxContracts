# sxContracts

A contract board for **ESX or standalone** FiveM servers. Players post paid jobs (deliveries, transports, escorts, recoveries…), other players take them, and the reward is paid once the poster validates the job. The money is held by the board from the moment the contract is posted, so nobody gets scammed.

## Features

- **Board**: every open contract with its category, reward, time left and location, filtered by category and searchable.
- **Escrow**: the reward and a board fee are taken when the contract is posted. The contractor is paid when the poster validates, the poster is refunded when the contract is cancelled or expires.
- **Offline safe**: a payment due to an offline player is kept and paid when they come back or open the board.
- **Jobs**: take a contract, set a GPS waypoint on its location, abandon it to put it back on the board.
- **Limits**: reward range, fee, visibility durations, active contracts per poster and jobs per contractor.
- **Admin**: admins can remove any open or running contract, the poster is refunded.
- **Interface**: React panel in the sxIllegals / sxHelpMenu style.
- **Translations**: English and French.
- **Exports and events** to plug other resources (for example sxIllegals influence on completed jobs).

## Dependencies

| Resource | Purpose |
| --- | --- |
| [oxmysql](https://github.com/overextended/oxmysql) | Required. Contracts storage |
| [es_extended](https://github.com/esx-framework/esx_core) | Optional. Identifiers, names, money and admin groups |
| [ox_inventory](https://github.com/overextended/ox_inventory) | Optional. Money in standalone |

Without ESX nor ox_inventory, rewards are shown but no money moves.

## Installation

1. Clone the repository into your `resources` folder.
2. The table is created on start, `db.sql` is there to create it by hand.
3. Build the interface.

   ```bash
   cd sxContracts/web
   npm install
   npm run build
   ```

4. Add the resource to your `server.cfg` after its dependencies.

   ```cfg
   ensure oxmysql
   ensure sxContracts
   ```

## Usage

| Command / key | Description |
| --- | --- |
| `/contracts` / `F7` | Opens the contract board |

The key can be changed in *Settings > Key Bindings > FiveM*.

## Configuration

All values live in `shared/config.lua`.

| Key | Description |
| --- | --- |
| `Config.Framework` | `'auto'`, `'esx'` or `'standalone'` |
| `Config.Inventory` | `'auto'`, `'esx'`, `'ox_inventory'` or `'none'`, used for the money |
| `Config.Open` | Command and default key |
| `Config.Categories` | Categories with a [Lucide](https://lucide.dev/icons) icon name, the label comes from `category_<id>` in the translations |
| `Config.Contracts.minReward` / `maxReward` | Allowed reward range |
| `Config.Contracts.fee` | Share of the reward kept by the board, `0.05` is 5% |
| `Config.Contracts.titleLength` / `descriptionLength` | Text limits |
| `Config.Contracts.durationHours` | Visibility durations offered to the poster |
| `Config.Contracts.maxPostedPerPlayer` | Open or running contracts per poster |
| `Config.Contracts.maxTakenPerPlayer` | Running jobs per contractor |
| `Config.Contracts.expireInterval` | Seconds between two checks of the expired contracts |
| `Config.Admin` | ESX groups and ACE permission (`sxcontracts.admin`) allowed to remove contracts |

## How it works

A contract goes through `open` → `taken` → `done`, or ends `cancelled` (by its poster or an admin) or `expired`. Every change is an atomic update on `sx_contracts`, so two players cannot take the same contract. When money is due, the contract stores who must be paid and how much with `settled = 0`; the server pays it right away if the player is online, otherwise on their next login or board opening.

## Exports

### Server

| Export | Description |
| --- | --- |
| `GetContract(id)` | Returns a contract or `nil` |
| `GetOpenContracts()` | Returns the open contracts |
| `OpenBoard(source)` | Opens the board for a player |

### Client

| Export | Description |
| --- | --- |
| `OpenBoard()` / `CloseBoard()` / `IsBoardOpen()` | Controls the panel |

### Server events

| Event | Arguments |
| --- | --- |
| `sxContracts:created` | `id`, `source` |
| `sxContracts:accepted` | `id`, `source` |
| `sxContracts:abandoned` | `id`, `source` |
| `sxContracts:completed` | `id`, `contractor identifier`, `reward` |
| `sxContracts:cancelled` | `id`, `source` |
| `sxContracts:expired` | `id` |

## License

MIT
