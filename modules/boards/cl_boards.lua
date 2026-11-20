SX.Boards = {}
SX.Modules:Register('Boards', 30)

local INTERACT = 38
local blips = {}
local summary = { open = 0, time = 0 }

local function refreshSummary()
    if GetGameTimer() - summary.time < 30000 then return end
    summary.time = GetGameTimer()
    CreateThread(function()
        local result = TriggerServerCallback('sxContracts:getSummary')
        if result then summary.open = result.open or 0 end
    end)
end

local function showPrompt()
    local key = HelpUI.KeyLabel(INTERACT, 'E')
    local shown = HelpUI.ShowThisFrame('board', 'board', {
        header = { subtitle = 'sxContracts', title = GetPhrase('board_title'), watermark = GetPhrase('board_watermark') },
        rows = {
            {
                type = 'text',
                label = GetPhrase('board_open'),
                value = tostring(summary.open),
                icon = 'clipboard-list',
                tone = summary.open > 0 and 'accent' or nil,
            },
            { type = 'keys', keys = { { key = key, label = GetPhrase('board_read') } } },
        },
    }, summary.open)

    if not shown then
        BeginTextCommandDisplayHelp('STRING')
        AddTextComponentSubstringPlayerName(GetPhrase('board_help'))
        EndTextCommandDisplayHelp(0, false, true, -1)
    end
end

function SX.Boards:IsNear()
    local coords = GetEntityCoords(PlayerPedId())
    for _, point in ipairs(Config.Boards.points) do
        if #(coords - point.coords) <= Config.Boards.interactDistance then return true end
    end
    return false
end

function SX.Boards:Initialize()
    if #Config.Boards.points == 0 then return end

    if Config.Boards.blip and Config.Boards.blip.enabled then
        for _, point in ipairs(Config.Boards.points) do
            local blip = AddBlipForCoord(point.coords.x, point.coords.y, point.coords.z)
            SetBlipSprite(blip, Config.Boards.blip.sprite)
            SetBlipColour(blip, Config.Boards.blip.color)
            SetBlipScale(blip, Config.Boards.blip.scale)
            SetBlipAsShortRange(blip, true)
            BeginTextCommandSetBlipName('STRING')
            AddTextComponentSubstringPlayerName(point.label or GetPhrase('board_title'))
            EndTextCommandSetBlipName(blip)
            blips[#blips + 1] = blip
        end
    end

    CreateThread(function()
        while true do
            local wait = 1000
            local coords = GetEntityCoords(PlayerPedId())

            for _, point in ipairs(Config.Boards.points) do
                local distance = #(coords - point.coords)
                if distance <= Config.Boards.drawDistance then
                    wait = 0
                    if Config.Boards.marker then
                        DrawMarker(27, point.coords.x, point.coords.y, point.coords.z - 0.97, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                            0.9, 0.9, 0.5, 62, 230, 255, 120, false, false, 2, false, nil, nil, false)
                    end
                    if distance <= Config.Boards.interactDistance and not SX.UI:IsOpen() then
                        refreshSummary()
                        showPrompt()
                        if IsControlJustReleased(0, INTERACT) then
                            SX.UI:Open()
                        end
                    end
                end
            end

            Wait(wait)
        end
    end)

    AddEventHandler('onResourceStop', function(resource)
        if resource ~= GetCurrentResourceName() then return end
        for _, blip in ipairs(blips) do
            if DoesBlipExist(blip) then RemoveBlip(blip) end
        end
    end)
end
