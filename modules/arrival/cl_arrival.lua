SX.Arrival = {}
SX.Modules:Register('Arrival', 30)

local jobs = {}
local reached = {}

local function showArrival(job)
    local shown = HelpUI.Show('arrival', 'arrival_' .. job.id, {
        header = { subtitle = GetPhrase('arrival_subtitle', job.id), title = job.title, watermark = GetPhrase('arrival_watermark') },
        rows = {
            { type = 'text', label = GetPhrase('arrival_client'), value = job.poster, icon = 'user-round' },
            { type = 'text', label = GetPhrase('arrival_reward'), value = ('$%s'):format(job.reward), icon = 'banknote', tone = 'safe' },
            { type = 'text', label = GetPhrase('arrival_next'), value = GetPhrase('arrival_next_value'), tone = 'accent', scramble = false },
        },
        footer = { label = GetPhrase('arrival_footer'), items = { { value = '', icon = 'map-pin-check' } } },
        duration = Config.HelpMenu.arrivalDuration or 8000,
    })
    if not shown then
        Bridge.Notify(GetPhrase('notify_arrival', job.title), 'success')
    end
end

function SX.Arrival:SetJobs(list)
    jobs = type(list) == 'table' and list or {}
    local active = {}
    for _, job in ipairs(jobs) do active[job.id] = true end
    for id in pairs(reached) do
        if not active[id] then reached[id] = nil end
    end
end

function SX.Arrival:Initialize()
    if not Config.Arrival.enabled then return end

    RegisterNetEvent('sxContracts:jobsChanged', function(list)
        SX.Arrival:SetJobs(list)
    end)

    CreateThread(function()
        Wait(3000)
        SX.Arrival:SetJobs(TriggerServerCallback('sxContracts:getJobs'))

        while true do
            local wait = 2000
            if #jobs > 0 then
                local coords = GetEntityCoords(PlayerPedId())
                for _, job in ipairs(jobs) do
                    local location = job.location
                    if location and not reached[job.id] then
                        local distance = #(coords - vector3(location.x, location.y, location.z or coords.z))
                        if distance <= Config.Arrival.radius then
                            reached[job.id] = true
                            showArrival(job)
                            TriggerServerEvent('sxContracts:reportArrival', job.id)
                        elseif distance < Config.Arrival.radius * 4 then
                            wait = 500
                        end
                    end
                end
            end
            Wait(wait)
        end
    end)
end
