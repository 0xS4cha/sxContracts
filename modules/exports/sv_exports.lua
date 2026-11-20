local function publicContract(row)
    if not row then return nil end
    return {
        id = row.id,
        title = row.title,
        category = row.category,
        reward = row.reward,
        status = row.status,
        poster = row.poster,
        contractor = row.contractor,
        expiresAt = row.expires_at,
    }
end

exports('GetContract', function(id)
    return publicContract(MySQL.single.await('SELECT * FROM sx_contracts WHERE id = ?', { tonumber(id) }))
end)

exports('GetOpenContracts', function()
    local rows = MySQL.query.await('SELECT * FROM sx_contracts WHERE status = ? AND expires_at > ?', { STATUS.OPEN, os.time() }) or {}
    local result = {}
    for i, row in ipairs(rows) do result[i] = publicContract(row) end
    return result
end)

exports('OpenBoard', function(source)
    TriggerClientEvent('sxContracts:open', source)
end)
