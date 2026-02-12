# BacTunis - Plateforme Éducative Baccalauréat Tunisien

<div align="center">

![BacTunis Logo](https://via.placeholder.com/200x200?text=BacTunis)

**Plateforme cross-platform pour accompagner les élèves tunisiens du baccalauréat**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-e0234e.svg)](https://nestjs.com/)

</div>

## 🎯 Fonctionnalités

- **📅 Planification intelligente** - Gestion emploi du temps et révisions
- **🤖 Assistant IA** - Support textuel et vocal en dialecte tunisien
- **📚 Contenu pédagogique** - Programme officiel du bac tunisien
- **📊 Suivi personnalisé** - Recommandations adaptées à chaque élève
- **💪 Support motivationnel** - Check-in émotionnel quotidien

## 🏗️ Architecture

```
bactunis/
├── apps/
│   ├── web/          # React + Vite
│   ├── mobile/       # React Native + Expo
│   └── api/          # NestJS Backend
├── packages/
│   ├── shared/       # Types partagés
│   ├── ui/           # Composants UI
│   └── ai-client/    # Client IA
└── prisma/           # Schéma BDD
```

## 🚀 Démarrage

```bash
# Installation des dépendances
npm install

# Configuration environnement
cp .env.example .env

# Lancer en développement
npm run dev
```

## 📝 Variables d'environnement

Créez un fichier `.env` à partir de `.env.example` avec vos clés API.

## 🛠️ Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance tous les services en dev |
| `npm run build` | Build production |
| `npm run test` | Lance les tests |
| `npm run db:studio` | Ouvre Prisma Studio |

## 📜 Licence

MIT © BacTunis Team
