# WA Auto Sender

[![Release](https://img.shields.io/github/v/release/ELMYNS/WA-auto-sender)](https://github.com/ELMYNS/WA-auto-sender/releases)

Application Windows **simple**, **autonome** et **100% locale** pour l'envoi automatique de messages WhatsApp à votre propre liste de clients. Vos données restent sur votre PC — rien n'est partagé avec une plateforme tierce.

Le moteur d'envoi est **`whatsapp-web.js`** (le moteur sur lequel [OpenWA](https://github.com/rmyndharis/OpenWA) est construit), intégré **directement** dans l'application avec **Chromium embarqué**. Aucun serveur, aucun Docker, **aucun téléchargement au premier lancement** : on installe, on ouvre, on scanne le QR, on envoie.

> ⚠️ **Usage responsable** : n'envoyez qu'à des contacts qui ont accepté de recevoir vos messages. Respectez les [Conditions de WhatsApp](https://www.whatsapp.com/legal/business-policy/). Les limites/cadences intégrées servent à protéger votre compte.

---

## 📥 Téléchargement (utilisateurs)

Allez sur la page **[Releases](https://github.com/ELMYNS/WA-auto-sender/releases)** et téléchargez :

| Fichier | Description |
|---|---|
| `WA Auto Sender Setup 1.0.0.exe` | **Installateur** — crée un raccourci sur le bureau (recommandé) |
| `WA Auto Sender 1.0.0.exe` | **Portable** — double-clic, aucune installation |

> 💡 Pour la version portable : copiez le `.exe` sur le **Bureau** avant de le lancer (ne l'exécutez pas depuis le dossier de téléchargement si vous prévoyez de le remplacer).

---

## 📖 Mode d'emploi

### 1. Première utilisation

1. **Installez** (Setup) ou **lancez** (Portable) l'application
2. Allez dans **Connexion** (🔗)
3. Sur votre téléphone : WhatsApp → **Appareils connectés** → **Connecter un appareil**
4. **Scannez le QR code** affiché dans l'application
5. Attendez le statut **Connecté** ✅

### 2. Importer vos contacts

1. Onglet **Contacts** (👥)
2. **Importer un fichier** (`.txt`, `.csv`, `.xlsx`) ou **coller des numéros**
3. Les numéros **marocains** sont détectés automatiquement (`06…`, `07…`, `+212…`)
4. Vérifiez que vos contacts apparaissent avec le statut **« Pas encore envoyé »**

### 3. Choisir un message

1. Onglet **Modèles** (📝)
2. Choisissez un modèle existant ou créez le vôtre (FR + Arabe)
3. Variables disponibles : `{name}`, `{phone}`, `{date}`

### 4. Lancer l'envoi automatique

1. Onglet **Envoi auto** (🚀)
2. Sélectionnez un **modèle** et la **langue** (Français ou Arabe)
3. Cliquez sur **Démarrer l'envoi**
4. L'application envoie automatiquement à tous les contacts **« pas encore envoyé »**
5. Utilisez **Pause** / **Reprendre** / **Arrêter** si besoin

### 5. Suivre les résultats

- Onglet **Contacts** : filtres **Envoyé** / **Échec** / **Pas encore envoyé**
- Bouton **Exporter** pour sauvegarder une liste
- Onglet **Envoi auto** : progression et limite journalière

### 6. Réinitialiser

| Action | Où ? |
|---|---|
| **Changer de numéro WhatsApp** | Connexion → **Déconnecter / Changer de numéro** |
| **Supprimer les contacts** | Contacts → filtre → **Vider** |
| **Tout réinitialiser** (numéro + contacts) | Réglages → **Réinitialiser l'application** |

> Vos données (contacts, session) sont stockées localement dans `%AppData%/wa-auto-sender` sur votre PC. Elles ne sont **jamais** envoyées sur Internet ni sur GitHub.

---

## ✨ Fonctionnalités

- 🔗 Connexion QR, session sauvegardée
- 🚀 Envoi automatique avec cadence intelligente
- 🌍 Interface **Français** + **Arabe** (RTL)
- 📝 Modèles de messages business (FR/AR)
- 👥 Import `.txt` / `.csv` / `.xlsx` + détection numéros marocains
- 📊 Suivi envoyé / en attente / échec + export
- ⏱️ Intervalles aléatoires, limite journalière, pauses entre lots
- 🕐 Heures d'envoi configurables, option week-end
- 💾 100% local — aucune donnée cloud

---

## 🛠️ Développement (développeurs)

### Prérequis

- Windows 10/11 (x64)
- [Node.js](https://nodejs.org/) 20+ (22 recommandé)
- Git

### Installation

```powershell
git clone https://github.com/ELMYNS/WA-auto-sender.git
cd WA-auto-sender

# Télécharge Chromium dans resources/chromium (nécessaire pour le build offline)
$env:PUPPETEER_CACHE_DIR="$PWD\resources\chromium"
npm install
```

### Mode développement

```powershell
npm run electron:dev
```

### Compiler le .exe Windows

```powershell
npm run build
```

Les installateurs sont générés dans `release/`.

> En cas d'erreur de certificat SSL (proxy d'entreprise) :
> `npm config set strict-ssl false` puis `$env:NODE_TLS_REJECT_UNAUTHORIZED="0"`

---

## 🧱 Architecture

```
electron/
  main.ts                  # Process principal Electron + IPC
  preload.ts               # Pont sécurisé renderer ↔ main
  shared.ts                # Types partagés
  services/
    whatsapp-client.ts     # Moteur whatsapp-web.js + Chromium embarqué
    campaign-engine.ts     # Boucle d'envoi auto (intervalles, limites, pauses)
    database.ts            # Stockage local JSON
    number-parser.ts       # Détection numéros marocains
src/
  App.tsx + components/    # Interface React
  i18n.ts                  # Traductions FR + AR
resources/
  icon.png                 # Icône
  chromium/                # Chromium embarqué (généré à npm install, non versionné)
```

---

## ⚙️ Réglages recommandés (compte récent)

| Réglage | Valeur prudente |
|---|---|
| Limite journalière | 50–80 |
| Intervalle min/max | 45 s / 120 s |
| Taille du lot | 10 |
| Pause entre lots | 5 min |
| Pause de sécurité | toutes les 15, durée 3 min |
| Heures d'envoi | 9h–20h, pas le week-end |

---

## 📄 Licence

[MIT](LICENSE) — utilise `whatsapp-web.js` (Apache-2.0). WhatsApp est une marque de Meta ; ce projet n'est pas affilié à WhatsApp/Meta.
