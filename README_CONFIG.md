# WebSocket Server Configuration

Tento soubor obsahuje konfiguraci pro WebSocket server v různých prostředích.

## Struktura

- `config.js` - Hlavní konfigurační soubor
- `.env.example` - Příklad environment proměnných

## Režimy prostředí

### Development (výchozí)
- Port: 3000
- CORS: localhost URLs
- Verbose logging: Zapnutý
- Spuštění: `npm run dev`

### Production
- Port: Z ENV nebo 3000
- CORS: Z ENV nebo konfigurace
- Verbose logging: Vypnutý
- Spuštění: `npm run prod`

## Nastavení pro produkci

1. Zkopírujte `.env.example` na `.env`:
   ```bash
   copy .env.example .env
   ```

2. Upravte `.env` pro produkci:
   ```
   NODE_ENV=production
   WS_PORT=3000
   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

3. Spusťte v produkčním režimu:
   ```bash
   npm run prod
   ```

## Konfigurace

### Development
```javascript
development: {
    port: 3000,
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:80', 'http://localhost'],
        methods: ['GET', 'POST'],
        credentials: true
    },
    logging: {
        enabled: true,
        verbose: true  // Všechny logy
    }
}
```

### Production
```javascript
production: {
    port: process.env.WS_PORT || 3000,
    cors: {
        origin: process.env.CORS_ORIGINS.split(','),
        methods: ['GET', 'POST'],
        credentials: true
    },
    logging: {
        enabled: true,
        verbose: false  // Jen důležité logy
    }
}
```

## Logging

- **Development**: Podrobné logování všech událostí
- **Production**: Pouze základní informace (start, chyby)

Verbose logy zahrnují:
- Připojení/odpojení uživatelů
- Join/leave event rooms
- Nové zprávy
- Typing indicators
- Reakce
- Seznam aktivních uživatelů
