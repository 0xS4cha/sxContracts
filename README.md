# sxContracts

A contract board for **ESX or standalone** FiveM servers. Players post paid jobs (deliveries, transports, escorts, recoveries…), other players take them, and the reward is paid once the poster validates the job. The money is held by the board from the moment the contract is posted, so nobody gets scammed.

## Features

- **Board**: every open contract with its category, reward, time left and location, filtered by category and searchable.
- **Escrow**: the reward and a board fee are taken when the contract is posted. The contractor is paid when the poster validates, the poster is refunded when the contract is cancelled or expires.
- **Offline safe**: a payment due to an offline player is kept and paid when they come back or open the board.
- **Paper contract**: with ox_inventory, the poster and the contractor get a unique `sx_contract` item (metadata with the contract id). Using it shows the contract as a typed paper with signatures and a status stamp, and anyone holding it can read it, for example to show it to the police. The same paper opens from the panel.
- **Physical boards**: contract boards placed in the city with a blip and a marker. Standing next to one shows how many contracts are open and the key to read it. With `Config.Open.boardOnly`, the command and the key are disabled and the board must be read in person.
- **Arrival**: when a contractor reaches the place of one of their jobs, a card shows the contract and the next step, and the client is told that the contractor arrived (checked by the server).
- **sxHelpMenu** (optional): the board prompt and the arrival card are drawn with [sxHelpMenu](https://github.com/0xS4cha/sxHelpMenu), the native help text and notifications are used without it.
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
| [ox_inventory](https://github.com/overextended/ox_inventory) | Optional. Money in standalone and the paper contract item |
| [sxHelpMenu](https://github.com/0xS4cha/sxHelpMenu) | Optional. Board prompt and arrival card |

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

5. With ox_inventory, add the paper item to `ox_inventory/data/items.lua`. `stack = false` keeps every copy unique and `consume = 0` keeps the paper after reading it:

   ```lua
   ['sx_contract'] = {
       label = 'Contract',
       weight = 10,
       stack = false,
       close = true,
       consume = 0,
       description = 'A contract from the board',
       server = { export = 'sxContracts.useContract' },
   },
   ```

   The item name can be changed with `Config.Paper.item`. Without ox_inventory there is no item, the paper is still shown from the panel.

## Usage

| Command / key | Description |
| --- | --- |
| `/contracts` / `F7` | Opens the contract board, disabled with `Config.Open.boardOnly` |
| `E` next to a board | Opens the contract board |

The key can be changed in *Settings > Key Bindings > FiveM*.

## Configuration

All values live in `shared/config.lua`.

| Key | Description |
| --- | --- |
| `Config.Framework` | `'auto'`, `'esx'` or `'standalone'` |
| `Config.Inventory` | `'auto'`, `'esx'`, `'ox_inventory'` or `'none'`, used for the money |
| `Config.Open` | Command, default key, and `boardOnly` to require a physical board (checked by the server, admins are not limited) |
| `Config.Boards.points` | Physical boards, `{ coords = vector3(...), label? }` |
| `Config.Boards.interactDistance` / `drawDistance` | Distance to read a board and to draw its marker |
| `Config.Boards.marker` / `blip` | Marker under the board and map blip (`sprite`, `color`, `scale`) |
| `Config.Arrival.enabled` / `radius` | Arrival detection and its radius in meters |
| `Config.Arrival.notifyPoster` | Tells the client when the contractor arrives |
| `Config.HelpMenu.enabled` / `position` / `offset` | sxHelpMenu cards and their anchor |
| `Config.HelpMenu.features` | Turns each card on or off: `arrival`, `board` |
| `Config.HelpMenu.arrivalDuration` | Milliseconds the arrival card stays on screen |
| `Config.Categories` | Categories with a [Lucide](https://lucide.dev/icons) icon name, the label comes from `category_<id>` in the translations |
| `Config.Contracts.minReward` / `maxReward` | Allowed reward range |
| `Config.Contracts.fee` | Share of the reward kept by the board, `0.05` is 5% |
| `Config.Contracts.titleLength` / `descriptionLength` | Text limits |
| `Config.Contracts.durationHours` | Visibility durations offered to the poster |
| `Config.Contracts.maxPostedPerPlayer` | Open or running contracts per poster |
| `Config.Contracts.maxTakenPerPlayer` | Running jobs per contractor |
| `Config.Contracts.expireInterval` | Seconds between two checks of the expired contracts |
| `Config.Paper.enabled` | Gives the paper item, needs ox_inventory |
| `Config.Paper.item` | Name of the paper item |
| `Config.Paper.givePoster` / `giveContractor` | Who gets a copy, when posting and when taking the contract |
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
| `useContract` | Item export for ox_inventory, opens the paper of the used copy |

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
| `sxContracts:arrived` | `id`, `source` of the contractor |

## License

MIT
