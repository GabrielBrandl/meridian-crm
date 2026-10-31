# Deploy Meridian no EasyPanel

Repositório: https://github.com/GabrielBrandl/meridian-crm

1. Crie um projeto **meridian**.
2. App tipo **Compose**, repositório Git acima, arquivo `docker-compose.yml`. Para repo privado, cole a chave SSH do serviço como deploy key no GitHub.
3. Variáveis:
   - `JWT_SECRET` — chave longa e exclusiva
   - `EVOLUTION_API_KEY` — mesma chave no app e na Evolution
   - `EVOLUTION_URL` = `http://evolution:8080`
   - `EVOLUTION_SERVER_URL` = URL pública do serviço `evolution` (https://...)
   - `APP_PUBLIC_URL` = URL pública do painel Meridian (https://...)
   - `POSTGRES_PASSWORD`
4. Domínios:
   - `meridian` → painel (ex: `meridian.SEUDOMINIO.easypanel.host`)
   - `evolution` → API WhatsApp
5. O webhook de cada cliente é gravado automaticamente ao gerar o QR:
   `https://SEU-MERIDIAN/api/webhooks/evolution`

## Como a GB Systems cadastra clientes

1. Entre com a conta da plataforma.
2. Em **Clientes**, preencha empresa, responsável, e-mail, senha e plano.
3. **Criar e liberar acesso** já deixa o workspace ativo.
4. Pedidos feitos em `/cadastro` aparecem como `pending`. Use **Aprovar**.

## Como o cliente conecta o WhatsApp

1. Entra no painel da empresa.
2. Abre **WhatsApp**.
3. Clica em **Gerar QR Code**.
4. No celular: WhatsApp → Aparelhos conectados → Conectar um aparelho.
5. Lê o QR. O status vira **Conectado**.

## Acessos iniciais

- GB Systems: `admin@gbsystems.com` / `meridian123`
- Cliente demo: `cliente@demo.com` / `demo123`

Troque as senhas depois do primeiro login.
