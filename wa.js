const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");

// Keep track of message IDs that have been responded to
const respondedMessages = new Set();

const startSock = async () => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(
      "auth_info_baileys"
    );
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false, // Disable the built-in QR print
    });

    // Listen for connection updates (including QR code)
    sock.ev.on("connection.update", (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        qrcode.generate(qr, { small: true }); // Print the QR code using qrcode-terminal
      }

      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !== 401; // Do not reconnect if logged out
        console.log("Connection closed. Reconnecting:", shouldReconnect);

        if (shouldReconnect) {
          startSock(); // Automatically reconnect
        }
      } else if (connection === "open") {
        console.log("WhatsApp Web connection established");
      }
    });

    // Handle incoming messages
    sock.ev.on("messages.upsert", async (msg) => {
      const message = msg.messages[0];
      const from = message.key.remoteJid;
      const messageId = message.key.id;

      console.log("Message:", msg);
      if (
        !message.key.fromMe &&
        !respondedMessages.has(messageId) &&
        from === "919494252174@s.whatsapp.net"
      ) {
        await sock.sendMessage(from, { text: "Hi" });
        console.log("Sent automatic reply to", from);
        respondedMessages.add(messageId);
      }
    });

    sock.ev.on("creds.update", saveCreds);
  } catch (error) {
    console.error("Error in startSock:", error);
    console.log("Restarting the connection after an error...");
    startSock(); // Restart the connection on error
  }
};

startSock();
