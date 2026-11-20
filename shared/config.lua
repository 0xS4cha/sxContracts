Config = {}

Config.Framework = 'auto'
Config.Inventory = 'auto'

Config.Open = {
    command = 'contracts',
    key = 'F7',
    boardOnly = false,
}

Config.Boards = {
    interactDistance = 2.0,
    drawDistance = 20.0,
    marker = true,
    blip = { enabled = true, sprite = 408, color = 5, scale = 0.8 },
    points = {
        { coords = vector3(195.17, -933.77, 30.69) },
    },
}

Config.Arrival = {
    enabled = true,
    radius = 30.0,
    notifyPoster = true,
}

Config.HelpMenu = {
    enabled = true,
    position = 'bottom-right',
    offset = nil,
    features = {
        arrival = true,
        board = true,
    },
    arrivalDuration = 8000,
}

Config.Categories = {
    { id = 'delivery', icon = 'package' },
    { id = 'transport', icon = 'car' },
    { id = 'escort', icon = 'shield' },
    { id = 'recovery', icon = 'key-round' },
    { id = 'protection', icon = 'swords' },
    { id = 'other', icon = 'clipboard-list' },
}

Config.Contracts = {
    minReward = 100,
    maxReward = 500000,
    fee = 0.05,
    titleLength = { min = 4, max = 60 },
    descriptionLength = { max = 600 },
    durationHours = { 2, 6, 24, 72 },
    maxPostedPerPlayer = 5,
    maxTakenPerPlayer = 2,
    expireInterval = 60,
}

Config.Paper = {
    enabled = true,
    item = 'sx_contract',
    givePoster = true,
    giveContractor = true,
}

Config.Admin = {
    groups = { 'admin', 'superadmin' },
    ace = 'sxcontracts.admin',
}
