const express = require('express');
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/pair', async (req, res) => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        printQRInTerminal: false,
        auth: state,
        browser: ['PairingBot', 'Chrome', '1.0.0'],
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr, pairingCode } = update;

        if (pairingCode) {
            res.send(`<h2>Your Pairing Code:</h2><pre>${pairingCode}</pre>`);
        }

        if (connection === 'open') {
            console.log('Connected!');
            await saveCreds();
        }
    });

    sock.ev.on('creds.update', saveCreds);
});

app.get('/creds', (req, res) => {
    if (fs.existsSync('./auth_info_baileys/creds.json')) {
        res.download('./auth_info_baileys/creds.json');
    } else {
        res.status(404).send('creds.json not found');
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
