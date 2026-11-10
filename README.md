# 7is online (Multiplayer)

Drei Dateien: `index.html` (das Spiel), `server.js` (Server), `package.json`.
Der Server liefert das Spiel aus und leitet Positionen und Chat der Spieler weiter.
Deine Freunde brauchen nur einen Browser und den Link. Kein Claude, kein Konto.

## Lokal testen (Computer)
1. Node.js (Version 18 oder neuer) installieren: https://nodejs.org
2. Im Ordner: `npm install` und dann `npm start`
3. Im Browser öffnen: http://localhost:3000
   Im selben WLAN erreichen Freunde das Spiel über http://DEINE-IP:3000

## Ins Internet stellen (Beispiel: Render)
1. Konto auf https://github.com anlegen, neues Repository, die Dateien `index.html`, `server.js`, `package.json` hochladen.
2. Konto auf https://render.com anlegen, "New" > "Web Service", das Repository auswählen.
3. Build Command: `npm install`   Start Command: `npm start`
4. Nach dem Deploy bekommst du einen Link (https://dein-name.onrender.com). Den schickst du deinen Freunden.

Hinweise
- Kostenlose Tarife schlafen oft nach einer Weile ein. Der erste Aufruf kann dann etwas dauern.
- Das Spiel ist für bis zu 12 gleichzeitige Verbindungen eingestellt (4 Rollen).
- Die Rollen (Viktor, Reza, Martin, Baran) kann nur je ein Spieler gleichzeitig haben.
