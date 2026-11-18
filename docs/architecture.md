# Architecture et exploitation

## Structure

- `src/App.tsx` définit les routes ; `src/main.tsx` initialise React Router et un `QueryClient` partagé (données fraîches pendant cinq minutes, une nouvelle tentative).
- `src/features/` regroupe les domaines `auth`, `recipes`, `shopping-lists`, `loyalty-cards` et `profile` avec pages, hooks et logique propre.
- `src/shared/` contient les composants communs, le client Supabase et les types de base de données. Les stories documentent des composants dans Storybook.
- `supabase/migrations/` contient le schéma, les politiques RLS, le stockage, Realtime et les cartes. `supabase/tests/rls_tests.sql` fournit des scénarios SQL manuels nécessitant une base et des utilisateurs de test.

React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form et Zod composent le client. Supabase fournit Auth, PostgreSQL, Storage et Realtime. Les hooks communiquent directement avec Supabase et invalident les requêtes après mutation. Les écrans de listes utilisent des abonnements Realtime et des mises à jour du cache.

## Données et accès

Les recettes, groupes, ingrédients et étapes appartiennent à un utilisateur. Les listes contiennent articles et membres ; les cartes contiennent des membres. Les migrations activent la RLS : propriétaire pour les recettes ; propriétaire et membres pour les listes et articles selon les politiques ; propriétaire pour les écritures sur les cartes. La fonction `lookup_user_by_email` permet à un utilisateur authentifié de retrouver l'identifiant d'un compte pour le partage de carte.

Le bucket `recipe-images` est public en lecture ; l'écriture est limitée au préfixe de l'utilisateur. Ainsi, une recette privée n'implique pas que son image soit privée pour quiconque possède son URL. Les migrations décrivent l'état attendu, pas nécessairement celui de l'instance distante.

## Développement et livraison

Installer avec `npm install`, configurer `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` à partir de `.env.example`, appliquer les migrations sur une instance adaptée, puis lancer `npm run dev`. `VITE_LOGO_DEV_TOKEN` est facultatif pour les logos d'enseignes. Ne pas placer de clé secrète serveur dans une variable `VITE_`, intégrée au client.

Commandes : `npm run build`, `npm run lint`, `npm test -- --run`, `npm run storybook`. Le déploiement statique doit rediriger les routes inconnues vers `index.html` et servir l'application en HTTPS pour les fonctions PWA et caméra. `vite.config.ts` définit le manifeste et le service worker. Le workflow GitHub de keep-alive dépend de secrets et de l'activation des actions.

## Vérifications effectuées

Le 18 novembre 2026 : compilation de production réussie ; 15 fichiers et 183 tests Vitest réussis ; lint sans erreur, avec cinq avertissements. Le build signale un bundle JavaScript principal de 1 308 kB minifiés (369 kB gzip). Les tests frontend utilisent un client Supabase simulé : ils ne démontrent pas le fonctionnement des politiques RLS, de Realtime ou de Storage sur une instance réelle. Les tests SQL et les parcours sur navigateur/appareil n'ont pas été exécutés pour cet état des lieux.
