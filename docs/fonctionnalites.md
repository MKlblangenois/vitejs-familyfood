# Fonctionnalités

Inventaire fondé sur les pages, hooks et migrations du dépôt. Une fonctionnalité implémentée n'implique pas que sa configuration ou ses données en production ont été vérifiées.

## Compte et navigation

L'inscription et la connexion utilisent un e-mail et un mot de passe via Supabase Auth. Les pages de mot de passe oublié et de réinitialisation sont présentes. Les routes métier sont protégées par `AuthGuard`, qui redirige vers `/login` en l'absence de session. La page `/profile` est pour l'instant un écran « arrive bientôt » : elle ne permet pas de gérer son profil. Un hook de déconnexion existe, mais aucun contrôle de déconnexion n'est relié à l'interface dans le code actuel.

| Route | Contenu |
| --- | --- |
| `/login`, `/register` | Connexion, inscription |
| `/forgot-password`, `/reset-password` | Récupération du mot de passe |
| `/`, `/recipes` | Catalogue personnel des recettes |
| `/recipes/new`, `/recipes/:id`, `/recipes/:id/edit` | Création, détail et modification d'une recette |
| `/shopping-lists`, `/shopping-lists/:id` | Listes de courses et détail |
| `/loyalty-cards` | Portefeuille de cartes |
| `/profile` | Page d'attente |

## Recettes

Une recette personnelle comprend titre, description, photo facultative, portions, temps de préparation et de cuisson, groupes d'ingrédients ordonnés et étapes. Le catalogue propose une recherche locale par titre. On peut créer, modifier et supprimer une recette, consulter ses étapes et ajuster le nombre de portions affiché ; les quantités sont recalculées proportionnellement. Les images JPEG, PNG et WebP sont compressées côté client avant stockage, avec une limite de 5 Mo pour le fichier source.

Depuis le détail, on peut choisir une liste, sélectionner des ingrédients et les ajouter pour un nombre de portions donné. La correspondance avec les articles existants utilise le nom et l'unité normalisés ; les quantités correspondantes sont additionnées. Voir les limites de cette opération dans l'[audit](audit.md).

## Courses collaboratives

Les listes sont créées, recherchées par titre et supprimées depuis leur catalogue. Leur détail permet de renommer la liste, ajouter, modifier, cocher ou supprimer des articles, et visualiser la progression. Un propriétaire peut ajouter ou retirer des membres ; l'ajout demande actuellement leur **identifiant utilisateur**, pas leur adresse e-mail. Les membres peuvent manipuler les articles. Les modifications des listes et articles sont synchronisées via Supabase Realtime ; la résolution des modifications concurrentes d'un article suit une logique de dernière écriture, pas une fusion des champs.

## Cartes de fidélité

Le portefeuille permet de rechercher, créer, afficher, modifier et supprimer ses cartes. Une carte possède une enseigne, une couleur et une valeur de code facultative ; elle peut être saisie ou scannée avec la caméra, puis affichée en grand. Les formats déclarés sont EAN-13, EAN-8, Code 128, Code 39, UPC-A, UPC-E et QR code. L'accès caméra et le maintien de l'écran allumé dépendent du navigateur et de ses permissions. Un service de logos est utilisé si `VITE_LOGO_DEV_TOKEN` est configuré.

Le propriétaire peut partager une carte avec un compte existant par e-mail et retirer un membre. Les rôles `editor` et `viewer` existent dans le modèle, mais les politiques SQL actuelles réservent la modification et la suppression de la carte au propriétaire ; ils ne confèrent donc pas de droits d'édition distincts.

## Installation et connexion réseau

L'application est une PWA : manifeste, service worker, interface adaptable et indicateur de connexion sont présents. Le shell et des ressources statiques peuvent être mis en cache. Les appels Supabase ne sont pas mis en cache par le service worker et aucune file d'écriture hors ligne n'est implémentée : ne pas considérer les recettes, listes ou cartes comme utilisables de manière fiable hors connexion. L'icône 192 px déclarée dans le manifeste est absente du répertoire `public/icons/`.
