# Meridian — CRM WhatsApp da GB Systems

CRM focado em **disparo em massa no WhatsApp**, com funil, inbox e fila segura. O envio sai pelo **n8n** (Evolution API ou WhatsApp Cloud).

## Acesso local

```bash
npm install
npm test
npm run dev
```

Abra [http://localhost:3010](http://localhost:3010)

- GB Systems: `admin@gbsystems.com` / `meridian123` → painel de clientes
- Cliente demo: `cliente@demo.com` / `demo123` → CRM + WhatsApp
- Cadastro público: `/cadastro` (fica pendente até a GB aprovar)

## Ligar o n8n

1. Importe `n8n/meridian-disparo.json`.
2. Configure as variáveis de ambiente do n8n (`MERIDIAN_URL`, `MERIDIAN_SECRET`, `EVOLUTION_*`).
3. Em **Conexões**, cole a URL do webhook `meridian-send`.
4. Desmarque **Modo sandbox**.

O n8n também pode chamar `POST /api/dispatch/tick` a cada minuto para esvaziar a fila.

## Docker / EasyPanel

```bash
docker compose up --build
```

No EasyPanel: app Compose apontando para este repositório, arquivo `docker-compose.yml`. Guia: `docs/EASYPANEL.md`.

Identidade visual: azul-marinho `#01033E`, azul `#0033FF`, lilás `#817EFF`.
