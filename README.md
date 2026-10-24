This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Pedidos: checkout y aviso al dueño por Telegram

Al tocar "Finalizar compra" el cliente va a `/checkout`, completa sus datos y al
confirmar ve su comprobante en `/checkout/listo` (lo puede guardar en PDF).
Al mismo tiempo, `/api/pedido` le manda el pedido al dueño por Telegram con un
botón para avisarle al cliente por WhatsApp que el pedido salió.

Alias/CBU para transferir y el cupón de la próxima compra se editan en
`src/data/config.ts`.

### Crear el bot (una sola vez)

1. En Telegram, abrí **@BotFather**, mandá `/newbot` y seguí los pasos. Te da un
   token parecido a `123456:ABC-...`.
2. Abrí el chat con tu bot nuevo y mandale cualquier mensaje.
3. Entrá a `https://api.telegram.org/bot<TOKEN>/getUpdates` y copiá el número
   de `"chat":{"id": ...}`.
4. En Vercel → Settings → Environment Variables agregá:
   - `TELEGRAM_BOT_TOKEN` = el token
   - `TELEGRAM_CHAT_ID` = el número del chat
5. Volvé a desplegar. Si las variables faltan, el cliente igual recibe su
   comprobante, pero al dueño no le llega el aviso.
