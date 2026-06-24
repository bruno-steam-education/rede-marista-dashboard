# REDE MARISTA - Dashboard Interativo

Dashboard web dos Resultados de Atendimento 2026 da Rede Marista, com identidade visual inspirada no Brandbook ZOOM.

## Design

- Titulos e numeros em Bungee.
- Interface em portugues.
- Paleta baseada no brandbook: azul ZOOM, verde, amarelo, laranja e cinza.
- Elementos circulares animados, KPIs, ranking de escolas, evolucao mensal e painel interativo por unidade.

## Desenvolvimento

```bash
npm install
npm run dev
npm run build
```

O app e estatico e pode ser publicado em GitHub Pages a partir do build Vite.

## ZET

O assistente usa a rota serverless `/api/zet`.

Configure uma destas variaveis no ambiente da Vercel:

- `GROQ_API_KEY` e opcionalmente `GROQ_MODEL`
- `OPENROUTER_API_KEY` e opcionalmente `OPENROUTER_MODEL`

Se as duas chaves existirem, o projeto usa Groq primeiro.
