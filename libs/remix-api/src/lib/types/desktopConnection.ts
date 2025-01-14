export const desktopConnectionType = {
    connected: 'connected',
    disconnected: 'disconnected',
    disabled: 'disabled',
    alreadyConnected: 'alreadyConnected',
}

export type desktopConnection  = typeof desktopConnectionType [keyof typeof desktopConnectionType ]