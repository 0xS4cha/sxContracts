SX.UI = {}
SX.Modules:Register('UI', 5)

local isOpen = false
local mode = nil

function SX.UI:Send(action, data)
    SendNUIMessage({ action = action, data = data or {} })
end

local function focus()
    local locale = GetPreferredLanguageId()
    SetNuiFocus(true, true)
    SX.UI:Send('setTranslations', { locale = locale, translations = GetLanguageTable(locale) })
    SX.UI:Send('setLocale', { locale = locale })
end

function SX.UI:Open()
    if isOpen and mode == 'board' then return end
    if not isOpen then focus() end
    isOpen, mode = true, 'board'
    self:Send('hidePaper')
    self:Send('setVisible', { visible = true })
end

function SX.UI:OpenPaper(paper)
    if isOpen and mode == 'board' then
        self:Send('showPaper', { paper = paper, standalone = false })
        return
    end
    if not isOpen then focus() end
    isOpen, mode = true, 'paper'
    self:Send('showPaper', { paper = paper, standalone = true })
end

function SX.UI:Close()
    if not isOpen then return end
    isOpen, mode = false, nil
    SetNuiFocus(false, false)
    self:Send('hidePaper')
    self:Send('setVisible', { visible = false })
end

function SX.UI:IsOpen()
    return isOpen
end

function SX.UI:Initialize()
    RegisterNUICallback('nuiReady', function(_, cb)
        cb({ ok = true })
    end)

    RegisterNUICallback('close', function(_, cb)
        SX.UI:Close()
        cb({ ok = true })
    end)

    CreateThread(function()
        while true do
            if isOpen then
                DisableControlAction(0, 1, true)
                DisableControlAction(0, 2, true)
                DisableControlAction(0, 142, true)
                DisableControlAction(0, 18, true)
                DisableControlAction(0, 322, true)
                DisableControlAction(0, 106, true)
                Wait(0)
            else
                Wait(500)
            end
        end
    end)
end
