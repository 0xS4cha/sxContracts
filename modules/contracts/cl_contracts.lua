SX.Contracts = {}
SX.Modules:Register('Contracts', 10)

local function proxy(name, event, transform)
    RegisterNUICallback(name, function(data, cb)
        local args = transform and transform(data) or { data }
        cb(TriggerServerCallback(event, table.unpack(args)) or { ok = false, error = 'timeout' })
    end)
end

local function withPlace(paper)
    local location = type(paper) == 'table' and paper.location
    if location and location.x and location.y then
        local z = location.z or 0.0
        local street = GetStreetNameAtCoord(location.x + 0.0, location.y + 0.0, z + 0.0)
        paper.place = {
            street = GetStreetNameFromHashKey(street),
            zone = GetLabelText(GetNameOfZone(location.x + 0.0, location.y + 0.0, z + 0.0)),
        }
    end
    return paper
end

local function currentLocation()
    local coords = GetEntityCoords(PlayerPedId())
    return { x = coords.x, y = coords.y, z = coords.z }
end

function SX.Contracts:Initialize()
    proxy('getBoard', 'sxContracts:getBoard', function() return {} end)
    proxy('createContract', 'sxContracts:create', function(data)
        data = data or {}
        if data.attachLocation then data.location = currentLocation() end
        data.attachLocation = nil
        return { data }
    end)
    proxy('acceptContract', 'sxContracts:accept', function(data) return { data and data.id } end)
    proxy('abandonContract', 'sxContracts:abandon', function(data) return { data and data.id } end)
    proxy('completeContract', 'sxContracts:complete', function(data) return { data and data.id } end)
    proxy('cancelContract', 'sxContracts:cancel', function(data) return { data and data.id, data and data.admin == true } end)

    RegisterNUICallback('getPaper', function(data, cb)
        local result = TriggerServerCallback('sxContracts:getPaper', data and data.id) or { ok = false, error = 'timeout' }
        if result.ok then withPlace(result.data) end
        cb(result)
    end)

    RegisterNetEvent('sxContracts:openPaper', function(paper)
        SX.UI:OpenPaper(withPlace(paper))
    end)

    RegisterNUICallback('setWaypoint', function(data, cb)
        if data and tonumber(data.x) and tonumber(data.y) then
            SetNewWaypoint(tonumber(data.x) + 0.0, tonumber(data.y) + 0.0)
            Bridge.Notify(GetPhrase('notify_waypoint'), 'info')
        end
        cb({ ok = true })
    end)

    if not Config.Open.boardOnly then
        RegisterCommand(Config.Open.command, function()
            SX.UI:Open()
        end, false)

        if Config.Open.key and Config.Open.key ~= '' then
            RegisterKeyMapping(Config.Open.command, GetPhrase('keymap_open'), 'keyboard', Config.Open.key)
        end
    end

    TriggerServerEvent('sxContracts:ready')
end
