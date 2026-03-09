# TCG Live Logs

A React app for visualizing Pokemon TCG match logs. Paste a game log and get a turn-by-turn timeline, statistics, and deck analysis.

## Features

- Turn-by-turn timeline view of a match
- Statistics breakdown (prize cards, energy, attacks, etc.)
- Deck reconstruction and card analysis
- 4270+ local card images
- Optional account system to save and revisit past games (AWS Cognito + DynamoDB)

## Tech Stack

- React 19 + TypeScript, built with Vite
- AWS Amplify (auth via Cognito)
- Backend: AWS Lambda + DynamoDB via SAM/CloudFormation
- Hosted on S3 + CloudFront

## Getting Started

```bash
npm install
cp .env.example .env  # fill in your AWS config values
npm run dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run test` | Run tests |
| `npm run lint` | Lint source files |
| `npm run format` | Format with Prettier |
| `npm run deploy` | Build and deploy to AWS |
| `npm run upload:images` | Upload card images to S3 |

## Card Images

Card images live in `public/card-images/`. To download images for specific sets:

```bash
npm run download:recent        # download images for recent sets
npm run download:set -- sv10   # download a specific set
npm run rebuild:manifest       # rebuild the image manifest after changes
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full deployment guide.

Quick deploy:
```bash
npm run deploy           # deploys app to S3 + CloudFront via SAM
npm run upload:images    # upload card images (first time or when images change)
```

## Backend

Lambda functions in `lambda/` handle log storage and retrieval. They're deployed automatically as part of `npm run deploy` via `template.yaml`.

See [lambda/README.md](lambda/README.md) for API details.
