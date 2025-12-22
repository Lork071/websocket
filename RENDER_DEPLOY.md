# Nasazení WebSocket serveru na Render.com

## Příprava

### 1. Git repozitář
Ujistěte se, že máte váš WebSocket kód v Git repozitáři (GitHub, GitLab nebo Bitbucket).

```bash
# Pokud ještě nemáte git inicializovaný v celém projektu, vytvořte submodul pro websocket
cd backend/websocket
git init
git add .
git commit -m "Initial WebSocket server setup"

# Vytvořte GitHub repozitář a pushněte kód
git remote add origin https://github.com/YOUR_USERNAME/tipster-websocket.git
git branch -M main
git push -u origin main
```

## Nasazení na Render.com

### Krok 1: Vytvoření účtu
1. Přejděte na https://render.com
2. Registrujte se (můžete použít GitHub účet)

### Krok 2: Vytvoření nové Web Service
1. V Render dashboardu klikněte na **"New +"** → **"Web Service"**
2. Připojte svůj GitHub/GitLab/Bitbucket repozitář
3. Vyberte repozitář s WebSocket serverem

### Krok 3: Konfigurace služby
Vyplňte následující údaje:

**Basic Settings:**
- **Name:** `tipster-websocket` (nebo libovolný název)
- **Region:** Frankfurt (nejbližší k ČR)
- **Branch:** `main`
- **Root Directory:** `backend/websocket` (pokud je to část většího projektu)
  - NEBO nechte prázdné, pokud máte samostatný repozitář
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm run prod`

**Instance Type:**
- Vyberte **"Free"** (dostanete 750 hodin zdarma měsíčně)

### Krok 4: Environment Variables
Přidejte tyto proměnné prostředí:

1. Klikněte na **"Advanced"** → **"Add Environment Variable"**

```
NODE_ENV = production
WS_PORT = 10000
CORS_ORIGINS = https://vase-domena.cz,https://www.vase-domena.cz
```

**Poznámka:** Render automaticky přiřadí port, ale váš server musí poslouchat na `process.env.PORT`

### Krok 5: Deploy
1. Klikněte na **"Create Web Service"**
2. Render automaticky začne buildovat a deployovat
3. Po úspěšném nasazení dostanete URL ve formátu: `https://tipster-websocket.onrender.com`

## URL vašeho WebSocket serveru
Po nasazení bude váš WebSocket server dostupný na:
```
https://tipster-websocket-XXXXX.onrender.com
```

## Aktualizace frontend konfigurace

V `frontend/src/config` nebo tam, kde máte konfiguraci, nastavte:

```javascript
const config = {
  development: {
    websocketUrl: 'http://localhost:3000'
  },
  production: {
    websocketUrl: 'https://tipster-websocket-XXXXX.onrender.com'
  }
}
```

## Důležité informace o Free Tier

### Limitace:
- ✅ 750 hodin provozu měsíčně (plně stačí)
- ✅ Automatický SSL certifikát
- ✅ Automatické nasazení při push do git
- ⚠️ Server se "uspí" po 15 minutách neaktivity
- ⚠️ První požadavek po uspání trvá ~30 sekund (cold start)

### Řešení cold startu:
Pro důležité aplikace můžete použít:
1. **Cron job** - pingovat server každých 14 minut
2. **Upgrade na placený plán** ($7/měsíc) - server nikdy nespí

## Automatické nasazení (CI/CD)

Render automaticky nasadí novou verzi při každém push do hlavní větve:

```bash
git add .
git commit -m "Update WebSocket server"
git push
```

## Monitorování

V Render dashboardu můžete sledovat:
- **Logs** - real-time logy serveru
- **Metrics** - využití CPU, paměti
- **Events** - historie deploymentů

## Troubleshooting

### Server nefunguje
1. Zkontrolujte logy v Render dashboardu
2. Ověřte, že `package.json` obsahuje správné závislosti
3. Ujistěte se, že server poslouchá na `process.env.PORT`

### CORS problémy
Aktualizujte `CORS_ORIGINS` environment variable s vašimi doménami

### WebSocket nepřipojuje
1. Zkontrolujte URL (musí být `https://` ne `http://`)
2. Ověřte, že frontend používá správnou URL
3. Zkontrolujte CORS nastavení

## Alternativní možnosti

Pokud vám Render nevyhovuje:
- **Railway.app** - podobný free tier
- **Fly.io** - generous free tier
- **Heroku** - $5/měsíc (už nemají free tier)
- **Vercel** - pro Next.js s WebSocket funkcionalitou
