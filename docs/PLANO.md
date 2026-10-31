# Plano — Meridian CRM (GB Systems)

## O que o mercado faz melhor

Pesquisa em Kommo, Wati, SendPulse, Clint, Chatwoot, DataCrazy e no CRM ABS/bot-wpp já existente:

| Fonte | O que vale a pena copiar |
|---|---|
| **Kommo** | Funil Kanban colado na conversa, broadcast a partir de segmento, Salesbot depois da resposta |
| **Wati** | Inbox compartilhada, campanha com template, métricas de entrega/leitura/resposta, retarget |
| **SendPulse / Clint** | Audiência por tag, agendamento, ritmo controlado, tarifa e limite explícitos |
| **Chatwoot** | Inbox self-hosted, roteamento, dados na sua infraestrutura |
| **Meta / AD PRO** | Opt-in obrigatório, template para início de conversa, descadastro, atendimento da resposta |

O que **não** entra neste produto: extensão de WhatsApp Web, QR “ilimitado”, disparo sem consentimento.

## Produto

**Meridian** é o CRM de disparo da GB Systems. O painel decide *quem*, *o quê* e *quando*. O **n8n** envia pelo WhatsApp (Evolution API ou Cloud API).

```
Contato + opt-in + segmento
        ↓
   Campanha Meridian
        ↓
  Fila com intervalo, horário e cota
        ↓
 POST webhook n8n  →  Evolution / Meta
        ↓
 callback status + inbound → inbox / opt-out
```

## Regras de negócio

1. Só entra na fila quem tem **opt-in** e não está bloqueado.
2. Telefone é normalizado para `55 + DDD + 9 + número`. Duplicata some.
3. Variáveis: `{{nome}}`, `{{primeiro_nome}}`, `{{empresa}}`, `{{cidade}}`, `{{telefone}}`.
4. Intervalo mínimo + mensagens/minuto + limite diário (padrão 250, aquecimento).
5. Só dispara no horário comercial configurado (fuso `America/Manaus`).
6. Se a taxa de erro passar do limite, a campanha **pausa sozinha**.
7. `sair`, `parar`, `stop`, `cancelar`, `descadastrar` geram opt-out imediato e tiram o contato das filas.
8. Sandbox ligado = simula envio sem chamar o n8n. Desligue só com webhook válido.
9. A resposta da campanha vira card no inbox e pode avançar no funil.

## Módulos entregues

- Autenticação
- Painel com métricas e funil
- Contatos, tags, importação CSV
- Pipeline de vendas
- Campanhas com prévia de audiência e métricas
- Inbox
- Modelos de mensagem
- Conexão n8n + regras de cadência
- Fluxo importável em `n8n/meridian-disparo.json`

## Deploy

1. Suba o app (Docker / EasyPanel) com volume em `/app/data`.
2. Importe o JSON no n8n.
3. Variáveis do n8n: `MERIDIAN_URL`, `MERIDIAN_SECRET`, `EVOLUTION_URL`, `EVOLUTION_INSTANCE`, `EVOLUTION_APIKEY`.
4. Cole o webhook `.../webhook/meridian-send` em **Conexões**.
5. Desligue o sandbox e dispare uma campanha de teste para um número próprio.
