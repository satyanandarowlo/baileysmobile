const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");

// Keep track of message IDs that have been responded to
const respondedMessages = new Set();

const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // Disable the built-in QR print
  });

  sock.ev.on("connection.update", (update) => {
    const { qr } = update;
    if (qr) {
      qrcode.generate(qr, { small: true }); // Print the QR code using qrcode-terminal
    }
  });

  sock.ev.on("messages.upsert", async (msg) => {
    const message = msg.messages[0];
    const from = message.key.remoteJid;
    const messageId = message.key.id;

    console.log("Message:", msg);
    // Check if the message is not from yourself and if it's from the target number
    if (
      !message.key.fromMe &&
      !respondedMessages.has(messageId) &&
      from === "919494252174@s.whatsapp.net"
    ) {
      await sock.sendMessage(from, { text: "Hi" });
      console.log("Sent automatic reply to", from);

      // Mark this message as responded to
      respondedMessages.add(messageId);
    }
  });

  sock.ev.on("creds.update", saveCreds);
};

startSock();
