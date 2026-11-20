exports('OpenBoard', function()
    SX.UI:Open()
end)

exports('CloseBoard', function()
    SX.UI:Close()
end)

exports('IsBoardOpen', function()
    return SX.UI:IsOpen()
end)

RegisterNetEvent('sxContracts:open', function()
    SX.UI:Open()
end)
