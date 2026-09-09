# React + Vite

## Backend Supabase

Le projet fonctionne en mode démo sans configuration Supabase. Pour activer l'authentification et la base de données :

1. Créez un projet sur Supabase.
2. Dans le SQL Editor, exécutez [supabase/schema.sql](supabase/schema.sql).
3. Copiez `.env.example` vers `.env.local` et renseignez l'URL du projet et la clé `anon`.
4. Activez l'authentification email dans Supabase.
5. Lancez l'application avec `npm run dev`.

Les données métier sont isolées par `federation_id` et protégées par les règles RLS. Ne mettez jamais la clé `service_role` dans le frontend.

### Déploiement GitHub Pages

Le déploiement est automatique à chaque push sur `main`. Dans GitHub, ajoutez ces secrets dans **Settings > Secrets and variables > Actions** :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Puis activez **Settings > Pages > Source: GitHub Actions**. L'application sera disponible à `https://<organisation>.github.io/sportshield/`.

### Invitations de membres

Les invitations utilisent la fonction Supabase `supabase/functions/invite-member/index.ts`, car l'envoi via `auth.admin.inviteUserByEmail` nécessite la clé `service_role` côté serveur.

Après avoir exécuté le SQL de migration, déployez la fonction avec la CLI Supabase :

```bash
supabase functions deploy invite-member
supabase secrets set APP_URL=http://localhost:5173
```

La fonction reçoit automatiquement `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` dans Supabase. En production, remplacez `APP_URL` par l'URL publique de l'application.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
