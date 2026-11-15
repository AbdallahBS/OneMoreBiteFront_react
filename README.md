# One More Bite — Frontend (React + Vite)

Frontend React de la plateforme **One More Bite**. Il reprend les maquettes du dossier
[`design/`](./design) et les relie à l'API Java du dossier `../BackEnd`.

## Fonctionnalités

- **Landing page** responsive (hero, recherche, 3 étapes, paniers du jour, impact, avantages,
  témoignages, CTA) fidèle aux maquettes.
- **Authentification unifiée** pour les 3 rôles :
  - Client (`Gourmet / Citoyen`) → `POST /auth/client/login`
  - Commerçant (`Artisan`) → `POST /auth/commercant/login`
  - Administrateur → `POST /auth/login`
- **Inscription** client (`POST /auth/client/register`) et commerçant
  (`POST /auth/commercant/register`, compte créé avec le statut `EN_ATTENTE`).
- **Session JWT persistée** dans le navigateur, restaurée via `GET /auth/me`, déconnexion via
  `POST /auth/logout`.
- **Routes protégées** par rôle : `/client`, `/commercant`, `/admin`.
- **Landing page connectée à l'API** : les paniers du jour viennent de
  `GET /produits?disponible=true` (recherche et filtres inclus). Un mode démo s'affiche si l'API
  n'est pas joignable.
- **Réservation** d'un panier depuis la landing page pour un client connecté
  (`POST /reservations`).
- **Tableaux de bord** : réservations du client, produits/réservations du commerçant,
  statistiques produits et validation des comptes commerçants pour l'admin.

## Prérequis

- Node.js 18+ (testé avec Node 24)
- Le backend Java démarré sur `http://localhost:8081` (voir `../BackEnd/README.md`)
- MySQL initialisé avec `BackEnd/src/main/resources/database/database.sql`

## Installation

```bash
cd FronEnd
npm install
```

## Configuration

L'URL de l'API se configure via `VITE_API_BASE_URL` (valeur par défaut :
`http://localhost:8081`).

```bash
copy .env.example .env
```

```dotenv
VITE_API_BASE_URL=http://localhost:8081
```

Le backend autorise déjà le CORS (`Access-Control-Allow-Origin: *`), aucun proxy n'est nécessaire.

## Lancer le projet

```bash
npm run dev
```

Ouvrir <http://localhost:5173>.

Build de production :

```bash
npm run build
npm run preview
```

## Comptes de démonstration

Ils sont créés par le script SQL du backend et préremplissables depuis l'écran de connexion
(section « Comptes de démonstration ») :

| Rôle | Email | Mot de passe |
| --- | --- | --- |
| Admin | `admin@enicar.com` | `admin` |
| Commerçant | `contact@benali.tn` | `pass123` |
| Client | `sami@gmail.com` | `client123` |

## Structure

```text
FronEnd/
├─ design/                 # maquettes HTML d'origine (conservées)
├─ public/
├─ src/
│  ├─ api/                 # client HTTP + endpoints auth/produits/réservations
│  ├─ components/          # Header, Footer, DealCard, FeaturedDeals, DashboardShell…
│  ├─ context/AuthContext  # session JWT, login/logout, restauration /auth/me
│  ├─ data/                # paniers de démonstration (fallback hors-ligne)
│  ├─ lib/                 # rôles, formatage dates/prix
│  ├─ pages/               # Landing, Auth, dashboards Client/Commerçant/Admin
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
├─ index.html
├─ tailwind.config.js      # palette et typographie issues des maquettes
└─ vite.config.js
```

## Notes

- Les comptes commerçants créés via l'inscription doivent être validés par un administrateur
  (statut `ACTIF`) avant de pouvoir se connecter.
- Le paiement reste effectué directement auprès du commerçant lors du retrait ; aucune étape de
  paiement en ligne n'est gérée par l'API.
