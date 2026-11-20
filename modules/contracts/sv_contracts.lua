SX.Contracts = {}
SX.Modules:Register('Contracts', 10)

local HISTORY_LIMIT = 50

local function now()
    return os.time()
end

local function fail(error)
    return { ok = false, error = error }
end

local function decodeLocation(value)
    if not value or value == '' then return nil end
    local ok, data = pcall(json.decode, value)
    if ok and type(data) == 'table' and data.x and data.y then return data end
    return nil
end

local function toClient(row, identifier)
    return {
        id = row.id,
        title = row.title,
        description = row.description or '',
        category = row.category,
        reward = row.reward,
        status = row.status,
        poster = { name = row.poster_name, isMe = row.poster == identifier },
        contractor = row.contractor and { name = row.contractor_name, isMe = row.contractor == identifier } or nil,
        location = decodeLocation(row.location),
        createdAt = row.created_at,
        expiresAt = row.expires_at,
        takenAt = row.taken_at,
        closedAt = row.closed_at,
    }
end

local function getRow(id)
    return MySQL.single.await('SELECT * FROM sx_contracts WHERE id = ?', { id })
end

local function countRows(where, params)
    return MySQL.scalar.await('SELECT COUNT(*) FROM sx_contracts WHERE ' .. where, params) or 0
end

local function notifyIdentifier(identifier, message)
    local target = identifier and Bridge.GetSourceFromIdentifier(identifier)
    if target then Bridge.Notify(target, message) end
end

function SX.Contracts:ToPaper(row)
    return {
        id = row.id,
        title = row.title,
        description = row.description or '',
        category = row.category,
        reward = row.reward,
        status = row.status,
        poster = row.poster_name,
        contractor = row.contractor_name,
        location = decodeLocation(row.location),
        createdAt = row.created_at,
        expiresAt = row.expires_at,
        takenAt = row.taken_at,
        closedAt = row.closed_at,
    }
end

function SX.Contracts:GivePaper(source, row)
    if not Config.Paper.enabled or not Bridge.HasMetadataItems() then return end
    local given = Bridge.GiveItemWithMetadata(source, Config.Paper.item, {
        contractId = row.id,
        label = GetPhrase('paper_item_label', row.id),
        description = row.title,
    })
    if not given then
        Bridge.Notify(source, GetPhrase('notify_paper_full'), 'error')
    end
end

function SX.Contracts:CanReadPaper(source, row)
    local identifier = Bridge.GetIdentifier(source)
    if row.poster == identifier or row.contractor == identifier then return true end
    if row.status == STATUS.OPEN and row.expires_at > now() then return true end
    if Bridge.IsAdmin(source) then return true end
    return Bridge.CountItemWithMetadata(source, Config.Paper.item, { contractId = row.id }) > 0
end

function SX.Contracts:GetPaper(source, id)
    local row = getRow(id)
    if not row or not self:CanReadPaper(source, row) then return fail('not_allowed') end
    return { ok = true, data = self:ToPaper(row) }
end

function SX.Contracts:UsePaper(source, metadata)
    local id = metadata and tonumber(metadata.contractId)
    local row = id and getRow(id)
    if not row then
        Bridge.Notify(source, GetPhrase('notify_paper_unknown'), 'error')
        return
    end
    TriggerClientEvent('sxContracts:openPaper', source, self:ToPaper(row))
end

function SX.Contracts:Settle(source)
    if not Bridge.HasMoneySystem() then return 0 end
    local identifier = Bridge.GetIdentifier(source)
    if not identifier then return 0 end

    local rows = MySQL.query.await(
        'SELECT id, payout_amount FROM sx_contracts WHERE payout_to = ? AND settled = 0', { identifier }) or {}
    local total = 0

    for _, row in ipairs(rows) do
        local claimed = MySQL.update.await('UPDATE sx_contracts SET settled = 1 WHERE id = ? AND settled = 0', { row.id })
        if claimed == 1 then
            if Bridge.AddMoney(source, row.payout_amount) then
                total = total + row.payout_amount
            else
                MySQL.update.await('UPDATE sx_contracts SET settled = 0 WHERE id = ?', { row.id })
            end
        end
    end

    if total > 0 then
        Bridge.Notify(source, GetPhrase('notify_paid', total), 'success')
    end
    return total
end

local function payout(row, identifier, amount, status)
    local settled = (Bridge.HasMoneySystem() and amount > 0) and 0 or 1
    MySQL.update.await([[
        UPDATE sx_contracts
        SET status = ?, payout_to = ?, payout_amount = ?, settled = ?, closed_at = ?
        WHERE id = ?
    ]], { status, identifier, amount, settled, now(), row.id })

    local target = Bridge.GetSourceFromIdentifier(identifier)
    if target then SX.Contracts:Settle(target) end
end

function SX.Contracts:GetBoard(source)
    local identifier = Bridge.GetIdentifier(source)
    local open = MySQL.query.await([[
        SELECT * FROM sx_contracts WHERE status = ? AND expires_at > ? ORDER BY created_at DESC
    ]], { STATUS.OPEN, now() }) or {}
    local posted = MySQL.query.await([[
        SELECT * FROM sx_contracts WHERE poster = ? ORDER BY created_at DESC LIMIT ?
    ]], { identifier, HISTORY_LIMIT }) or {}
    local taken = MySQL.query.await([[
        SELECT * FROM sx_contracts WHERE contractor = ? ORDER BY COALESCE(taken_at, created_at) DESC LIMIT ?
    ]], { identifier, HISTORY_LIMIT }) or {}
    local earned = MySQL.scalar.await([[
        SELECT COALESCE(SUM(reward), 0) FROM sx_contracts WHERE contractor = ? AND status = ?
    ]], { identifier, STATUS.DONE }) or 0

    local function map(list)
        local result = {}
        for i, row in ipairs(list) do result[i] = toClient(row, identifier) end
        return result
    end

    return {
        ok = true,
        data = {
            me = { name = Bridge.GetName(source), admin = Bridge.IsAdmin(source) },
            money = Bridge.HasMoneySystem(),
            settings = {
                categories = Config.Categories,
                minReward = Config.Contracts.minReward,
                maxReward = Config.Contracts.maxReward,
                fee = Config.Contracts.fee,
                durations = Config.Contracts.durationHours,
                titleLength = Config.Contracts.titleLength,
                descriptionLength = Config.Contracts.descriptionLength.max,
            },
            open = map(open),
            posted = map(posted),
            taken = map(taken),
            stats = { earned = earned },
            now = now(),
        },
    }
end

function SX.Contracts:Create(source, data)
    if type(data) ~= 'table' then return fail('invalid') end
    local identifier = Bridge.GetIdentifier(source)
    local settings = Config.Contracts

    local title = Utils.Trim(tostring(data.title or ''))
    local description = Utils.Trim(tostring(data.description or ''))
    local reward = math.floor(tonumber(data.reward) or 0)
    local hours = tonumber(data.duration)

    if #title < settings.titleLength.min or #title > settings.titleLength.max then return fail('invalid_title') end
    if #description > settings.descriptionLength.max then return fail('invalid_description') end
    if not GetCategory(data.category) then return fail('invalid_category') end
    if reward < settings.minReward or reward > settings.maxReward then return fail('invalid_reward') end

    local validDuration = false
    for _, value in ipairs(settings.durationHours) do
        if value == hours then validDuration = true end
    end
    if not validDuration then return fail('invalid_duration') end

    local active = countRows('poster = ? AND status IN (?, ?)', { identifier, STATUS.OPEN, STATUS.TAKEN })
    if active >= settings.maxPostedPerPlayer then return fail('too_many_posted') end

    local fee = math.floor(reward * settings.fee)
    if Bridge.HasMoneySystem() and not Bridge.RemoveMoney(source, reward + fee) then
        return fail('not_enough_money')
    end

    local location = nil
    if type(data.location) == 'table' and tonumber(data.location.x) and tonumber(data.location.y) then
        location = json.encode({
            x = tonumber(data.location.x) + 0.0,
            y = tonumber(data.location.y) + 0.0,
            z = (tonumber(data.location.z) or 0.0) + 0.0,
        })
    end

    local created = now()
    local id = MySQL.insert.await([[
        INSERT INTO sx_contracts (title, description, category, reward, fee, status, poster, poster_name, location, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ]], { title, description, data.category, reward, fee, STATUS.OPEN, identifier, Bridge.GetName(source), location, created, created + hours * 3600 })

    Logger:info('CONTRACTS', ('Contract #%s created by %s for %s'):format(id, identifier, reward))
    if Config.Paper.givePoster then
        local row = getRow(id)
        if row then self:GivePaper(source, row) end
    end
    TriggerEvent('sxContracts:created', id, source)
    return { ok = true, data = { id = id } }
end

function SX.Contracts:Accept(source, id)
    local identifier = Bridge.GetIdentifier(source)
    local row = getRow(id)
    if not row or row.status ~= STATUS.OPEN or row.expires_at <= now() then return fail('not_available') end
    if row.poster == identifier then return fail('own_contract') end

    local taken = countRows('contractor = ? AND status = ?', { identifier, STATUS.TAKEN })
    if taken >= Config.Contracts.maxTakenPerPlayer then return fail('too_many_taken') end

    local updated = MySQL.update.await([[
        UPDATE sx_contracts SET status = ?, contractor = ?, contractor_name = ?, taken_at = ? WHERE id = ? AND status = ?
    ]], { STATUS.TAKEN, identifier, Bridge.GetName(source), now(), id, STATUS.OPEN })
    if updated ~= 1 then return fail('not_available') end

    if Config.Paper.giveContractor then
        self:GivePaper(source, getRow(id) or row)
    end
    notifyIdentifier(row.poster, GetPhrase('notify_taken', row.title, Bridge.GetName(source)))
    TriggerEvent('sxContracts:accepted', id, source)
    return { ok = true }
end

function SX.Contracts:Abandon(source, id)
    local identifier = Bridge.GetIdentifier(source)
    local updated = MySQL.update.await([[
        UPDATE sx_contracts SET status = ?, contractor = NULL, contractor_name = NULL, taken_at = NULL
        WHERE id = ? AND status = ? AND contractor = ?
    ]], { STATUS.OPEN, id, STATUS.TAKEN, identifier })
    if updated ~= 1 then return fail('not_allowed') end

    local row = getRow(id)
    if row then notifyIdentifier(row.poster, GetPhrase('notify_abandoned', row.title)) end
    TriggerEvent('sxContracts:abandoned', id, source)
    return { ok = true }
end

function SX.Contracts:Complete(source, id)
    local identifier = Bridge.GetIdentifier(source)
    local row = getRow(id)
    if not row or row.status ~= STATUS.TAKEN or row.poster ~= identifier then return fail('not_allowed') end

    payout(row, row.contractor, row.reward, STATUS.DONE)
    notifyIdentifier(row.contractor, GetPhrase('notify_completed', row.title))
    TriggerEvent('sxContracts:completed', id, row.contractor, row.reward)
    return { ok = true }
end

function SX.Contracts:Cancel(source, id, asAdmin)
    local identifier = Bridge.GetIdentifier(source)
    local row = getRow(id)
    if not row then return fail('not_allowed') end

    if asAdmin then
        if not Bridge.IsAdmin(source) then return fail('not_allowed') end
        if row.status ~= STATUS.OPEN and row.status ~= STATUS.TAKEN then return fail('not_allowed') end
    elseif row.status ~= STATUS.OPEN or row.poster ~= identifier then
        return fail('not_allowed')
    end

    payout(row, row.poster, row.reward, STATUS.CANCELLED)
    if row.contractor then notifyIdentifier(row.contractor, GetPhrase('notify_cancelled', row.title)) end
    TriggerEvent('sxContracts:cancelled', id, source)
    return { ok = true }
end

function SX.Contracts:Expire()
    local rows = MySQL.query.await('SELECT * FROM sx_contracts WHERE status = ? AND expires_at <= ?', { STATUS.OPEN, now() }) or {}
    for _, row in ipairs(rows) do
        payout(row, row.poster, row.reward, STATUS.EXPIRED)
        notifyIdentifier(row.poster, GetPhrase('notify_expired', row.title))
        TriggerEvent('sxContracts:expired', row.id)
    end
end

function SX.Contracts:Initialize()
    RegisterServerCallback('sxContracts:getBoard', function(source)
        SX.Contracts:Settle(source)
        return SX.Contracts:GetBoard(source)
    end)
    RegisterServerCallback('sxContracts:getPaper', function(source, id) return SX.Contracts:GetPaper(source, tonumber(id)) end)
    RegisterServerCallback('sxContracts:create', function(source, data) return SX.Contracts:Create(source, data) end)
    RegisterServerCallback('sxContracts:accept', function(source, id) return SX.Contracts:Accept(source, tonumber(id)) end)
    RegisterServerCallback('sxContracts:abandon', function(source, id) return SX.Contracts:Abandon(source, tonumber(id)) end)
    RegisterServerCallback('sxContracts:complete', function(source, id) return SX.Contracts:Complete(source, tonumber(id)) end)
    RegisterServerCallback('sxContracts:cancel', function(source, id, asAdmin)
        return SX.Contracts:Cancel(source, tonumber(id), asAdmin == true)
    end)

    AddEventHandler('esx:playerLoaded', function(playerId)
        SetTimeout(5000, function() SX.Contracts:Settle(playerId) end)
    end)
    RegisterNetEvent('sxContracts:ready', function()
        local src = source
        SetTimeout(5000, function() SX.Contracts:Settle(src) end)
    end)

end

function SX.Contracts:InitializeAsync()
    MySQL.query.await(LoadResourceFile(GetCurrentResourceName(), 'db.sql'))

    while true do
        local ok, err = pcall(self.Expire, self)
        if not ok then Logger:error('CONTRACTS', 'Expire failed:', err) end
        Wait(Config.Contracts.expireInterval * 1000)
    end
end
