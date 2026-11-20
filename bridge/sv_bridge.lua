Bridge = {}
Bridge.Name = 'standalone'
Bridge.Inventory = 'none'

local ESX = nil

local function detectFramework()
    if Config.Framework == 'standalone' then return 'standalone' end

    if Config.Framework == 'esx' or GetResourceState('es_extended') ~= 'missing' then
        local ok, obj = pcall(function()
            return exports.es_extended:getSharedObject()
        end)
        if ok and obj then
            ESX = obj
            return 'esx'
        end
        Logger:error('BRIDGE', 'es_extended could not be loaded, running standalone')
    end

    return 'standalone'
end

local function detectInventory()
    if Config.Inventory ~= 'auto' then return Config.Inventory end
    if GetResourceState('ox_inventory') ~= 'missing' then return 'ox_inventory' end
    if Bridge.Name == 'esx' then return 'esx' end
    return 'none'
end

Bridge.Name = detectFramework()
Bridge.Inventory = detectInventory()
Logger:info('BRIDGE', 'Framework:', Bridge.Name, 'Money:', Bridge.Inventory)

local function esxPlayer(source)
    return ESX and ESX.GetPlayerFromId(source) or nil
end

function Bridge.GetIdentifier(source)
    local xPlayer = esxPlayer(source)
    if xPlayer then return xPlayer.getIdentifier() end
    return GetPlayerIdentifierByType(source, 'license')
end

function Bridge.GetName(source)
    local xPlayer = esxPlayer(source)
    if xPlayer and xPlayer.getName then
        local ok, name = pcall(xPlayer.getName)
        if ok and name then return name end
    end
    return GetPlayerName(source) or ('#' .. tostring(source))
end

function Bridge.GetSourceFromIdentifier(identifier)
    for _, playerId in ipairs(GetPlayers()) do
        local source = tonumber(playerId)
        if Bridge.GetIdentifier(source) == identifier then
            return source
        end
    end
    return nil
end

function Bridge.IsAdmin(source)
    if Config.Admin.ace and IsPlayerAceAllowed(source, Config.Admin.ace) then
        return true
    end

    local xPlayer = esxPlayer(source)
    if xPlayer then
        local group = xPlayer.getGroup()
        for _, allowed in ipairs(Config.Admin.groups) do
            if group == allowed then return true end
        end
    end

    return false
end

function Bridge.HasMoneySystem()
    return Bridge.Name == 'esx' or Bridge.Inventory == 'ox_inventory'
end

function Bridge.GetMoney(source)
    local xPlayer = esxPlayer(source)
    if xPlayer then return xPlayer.getMoney() end
    if Bridge.Inventory == 'ox_inventory' then
        return exports.ox_inventory:GetItemCount(source, 'money') or 0
    end
    return 0
end

function Bridge.RemoveMoney(source, amount)
    if amount <= 0 then return true end
    local xPlayer = esxPlayer(source)
    if xPlayer then
        if xPlayer.getMoney() < amount then return false end
        xPlayer.removeMoney(amount)
        return true
    end
    if Bridge.Inventory == 'ox_inventory' then
        return exports.ox_inventory:RemoveItem(source, 'money', amount) and true or false
    end
    return false
end

function Bridge.AddMoney(source, amount)
    if amount <= 0 then return true end
    local xPlayer = esxPlayer(source)
    if xPlayer then
        xPlayer.addMoney(amount)
        return true
    end
    if Bridge.Inventory == 'ox_inventory' then
        return exports.ox_inventory:AddItem(source, 'money', amount) and true or false
    end
    return false
end

function Bridge.HasMetadataItems()
    return Bridge.Inventory == 'ox_inventory'
end

function Bridge.GiveItemWithMetadata(source, item, metadata)
    if not Bridge.HasMetadataItems() then return false end
    if not exports.ox_inventory:CanCarryItem(source, item, 1, metadata) then return false end
    local ok = exports.ox_inventory:AddItem(source, item, 1, metadata)
    return ok and true or false
end

function Bridge.CountItemWithMetadata(source, item, metadata)
    if not Bridge.HasMetadataItems() then return 0 end
    return exports.ox_inventory:GetItemCount(source, item, metadata) or 0
end

function Bridge.GetSlotMetadata(inventory, slot)
    if not Bridge.HasMetadataItems() then return nil end
    local data = exports.ox_inventory:GetSlot(inventory, slot)
    return data and data.metadata or nil
end

function Bridge.Notify(source, message, kind)
    TriggerClientEvent('sxContracts:notify', source, message, kind or 'info')
end
