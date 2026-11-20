STATUS = {
    OPEN = 'open',
    TAKEN = 'taken',
    DONE = 'done',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired',
}

function GetCategory(id)
    for _, category in ipairs(Config.Categories) do
        if category.id == id then return category end
    end
    return nil
end
