# WA Auto Sender

[![Release](https://img.shields.io/github/v/release/ELMYNS/WA-auto-sender)](https://github.com/ELMYNS/WA-auto-sender/releases)

A **simple**, **standalone**, **100% local** Windows app for automatically sending WhatsApp messages to your own client list. Your data stays on your PC — nothing is shared with third-party platforms.

The messaging engine is **`whatsapp-web.js`** (the same engine [OpenWA](https://github.com/rmyndharis/OpenWA) is built on), integrated **directly** into the app with **bundled Chromium**. No server, no Docker, **no downloads on first launch**: install, open, scan the QR code, and send.

> ⚠️ **Responsible use**: only message contacts who have agreed to receive your messages. Follow [WhatsApp's policies](https://www.whatsapp.com/legal/business-policy/). Built-in rate limits and pacing help protect your account.

---

## 📥 Download (end users)

Go to **[Releases](https://github.com/ELMYNS/WA-auto-sender/releases)** and download:

| File | Description |
|---|---|
| `WA Auto Sender Setup 1.0.0.exe` | **Installer** — creates a desktop shortcut (recommended) |
| `WA Auto Sender 1.0.0.exe` | **Portable** — double-click, no installation required |

> 💡 For the portable version: copy the `.exe` to your **Desktop** before running it (don't run it from the download folder if you plan to replace it later).

---

## 📖 How to use

### 1. First-time setup

1. **Install** (Setup) or **run** (Portable) the application
2. Go to **Connection** (🔗)
3. On your phone: WhatsApp → **Linked devices** → **Link a device**
4. **Scan the QR code** shown in the app
5. Wait for the **Connected** ✅ status

### 2. Import your contacts

1. Open the **Contacts** tab (👥)
2. **Import a file** (`.txt`, `.csv`, `.xlsx`) or **paste numbers**
3. **Moroccan numbers** are detected automatically (`06…`, `07…`, `+212…`)
4. Confirm your contacts appear with the **"Not sent yet"** status

### 3. Choose a message template

1. Open the **Templates** tab (📝)
2. Pick an existing template or create your own (French + Arabic)
3. Available variables: `{name}`, `{phone}`, `{date}`

### 4. Start automatic sending

1. Open the **Auto Send** tab (🚀)
2. Select a **template** and **language** (French or Arabic)
3. Click **Start sending**
4. The app automatically sends to all contacts marked **"not sent yet"**
5. Use **Pause** / **Resume** / **Stop** as needed

### 5. Track results

- **Contacts** tab: filter by **Sent** / **Failed** / **Not sent yet**
- **Export** button to save a list
- **Auto Send** tab: progress and daily limit

### 6. Reset

| Action | Where |
|---|---|
| **Change WhatsApp number** | Connection → **Disconnect / Change number** |
| **Delete contacts** | Contacts → filter → **Clear** |
| **Full reset** (number + contacts) | Settings → **Reset application** |

> Your data (contacts, session) is stored locally in `%AppData%/wa-auto-sender` on your PC. It is **never** uploaded to the internet or to GitHub.

---

## ✨ Features

- 🔗 QR login with saved session
- 🚀 Automatic sending with smart pacing
- 🌍 **French** + **Arabic** UI (RTL)
- 📝 Business message templates (FR/AR)
- 👥 Import `.txt` / `.csv` / `.xlsx` + Moroccan number detection
- 📊 Sent / pending / failed tracking + export
- ⏱️ Random intervals, daily limit, batch pauses
- 🕐 Configurable sending hours, weekend skip option
- 💾 100% local — no cloud data

---

## 🛠️ Development

### Requirements

- Windows 10/11 (x64)
- [Node.js](https://nodejs.org/) 20+ (22 recommended)
- Git

### Setup

```powershell
git clone https://github.com/ELMYNS/WA-auto-sender.git
cd WA-auto-sender

# Downloads Chromium into resources/chromium (required for offline build)
$env:PUPPETEER_CACHE_DIR="$PWD\resources\chromium"
npm install
```

### Development mode

```powershell
npm run electron:dev
```

### Build Windows .exe (offline)

```powershell
npm run build
```

Installers are generated in `release/`.

> If you hit SSL certificate errors (corporate proxy):
> `npm config set strict-ssl false` then `$env:NODE_TLS_REJECT_UNAUTHORIZED="0"`

### Publish a GitHub release

```powershell
npm run build
.\scripts\publish-release.ps1
```

---

## 🧱 Architecture

```
electron/
  main.ts                  # Electron main process + IPC
  preload.ts               # Secure renderer ↔ main bridge
  shared.ts                # Shared types
  services/
    whatsapp-client.ts     # whatsapp-web.js engine + bundled Chromium
    campaign-engine.ts     # Auto-send loop (intervals, limits, pauses)
    database.ts            # Local JSON storage
    number-parser.ts       # Moroccan number detection
src/
  App.tsx + components/    # React UI
  i18n.ts                  # French + Arabic translations
resources/
  icon.png                 # App icon
  chromium/                # Bundled Chromium (generated at npm install, not versioned)
```

---

## ⚙️ Recommended settings (new account)

| Setting | Safe value |
|---|---|
| Daily limit | 50–80 |
| Min/max interval | 45 s / 120 s |
| Batch size | 10 |
| Pause between batches | 5 min |
| Safety pause | every 15 messages, 3 min duration |
| Sending hours | 9 AM–8 PM, skip weekends |

Increase gradually over weeks if your account stays healthy.

---

## 📄 License

[MIT](LICENSE) — uses `whatsapp-web.js` (Apache-2.0). WhatsApp is a Meta trademark; this project is not affiliated with WhatsApp/Meta.
