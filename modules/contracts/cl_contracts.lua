SX.Contracts = {}
SX.Modules:Register('Contracts', 10)

local function proxy(name, event, transform)
    RegisterNUICallback(name, function(data, cb)
        local args = transform and transform(data) or { data }
        cb(TriggerServerCallback(event, table.unpack(args)) or { ok = false, error = 'timeout' })
    end)
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

    RegisterNUICallback('setWaypoint', function(data, cb)
        if data and tonumber(data.x) and tonumber(data.y) then
            SetNewWaypoint(tonumber(data.x) + 0.0, tonumber(data.y) + 0.0)
            Bridge.Notify(GetPhrase('notify_waypoint'), 'info')
        end
        cb({ ok = true })
    end)

    RegisterCommand(Config.Open.command, function()
        SX.UI:Open()
    end, false)

    if Config.Open.key and Config.Open.key ~= '' then
        RegisterKeyMapping(Config.Open.command, GetPhrase('keymap_open'), 'keyboard', Config.Open.key)
    end

    TriggerServerEvent('sxContracts:ready')
end
