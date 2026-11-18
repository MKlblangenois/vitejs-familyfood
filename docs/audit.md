# Audit initial

Audit statique du dépôt et vérifications locales le 18 novembre 2026. Les priorités ci-dessous sont des propositions, à confirmer selon l'usage réel. Les effets décrits sont déduits du code ; ils n'ont pas été reproduits sur une base distante. La revue visuelle et les tests d'usage restent à réaliser lors de la passe UI/UX.

## Priorité haute

1. **Isolation du cache entre comptes.** Le `QueryClient` est global, les clés de listes ne comportent pas l'identité et le hook de déconnexion ne vide pas le cache (`src/main.tsx`, `src/features/*/hooks/queryKeys.ts`, `src/features/auth/hooks/useSignOut.ts`). Si une déconnexion puis une connexion à un autre compte se produisent sans rechargement, des données du compte précédent peuvent rester visibles pendant la durée de fraîcheur du cache. Aucun bouton de déconnexion n'est actuellement relié à l'interface, mais le risque concerne aussi les changements de session. Isoler les clés par utilisateur et vider les données à la transition de session ; couvrir le scénario à deux comptes.
2. **Sauvegarde de recette non atomique.** La modification supprime les groupes et étapes avant de les recréer par plusieurs requêtes (`src/features/recipes/hooks/useUpdateRecipe.ts`). Une erreur intermédiaire peut laisser une recette incomplète. La création et la création de liste/carte utilisent aussi plusieurs requêtes avec nettoyage au mieux. Déplacer ces opérations dans des transactions côté base et tester les échecs intermédiaires.
3. **Ajout d'ingrédients non atomique et concurrence.** `useAddRecipeToShoppingList.ts` insère puis met à jour séparément à partir d'un instantané de la liste. Un échec peut produire un ajout partiel ; deux utilisateurs peuvent écraser leurs additions concurrentes. Un nouvel ingrédient répété dans la même sélection n'est pas fusionné avec un autre nouvel ingrédient (`recipeToShoppingList.ts`). Utiliser une opération transactionnelle côté serveur et tester doublons, reprises et concurrence.

## Priorité moyenne

4. **Partage à clarifier et sécuriser.** Le partage de liste exige un UUID alors que le partage de carte utilise l'e-mail. La fonction `lookup_user_by_email` retourne l'identifiant pour tout e-mail connu à tout utilisateur authentifié, ce qui permet de vérifier l'existence de comptes. Définir le modèle d'invitation, limiter l'énumération et harmoniser les parcours. Les rôles de carte `editor` et `viewer` ne sont pas différenciés par les politiques d'écriture : aligner les libellés, l'interface et la RLS.
5. **PWA et documentation incohérentes.** Le manifeste référence `/icons/icon-192.png`, absent ; le README parle de gestion de profil et d'une expérience hors ligne plus large que le code. Fournir l'icône, corriger le README et vérifier installation et rechargement hors ligne sur appareils. Les photos de recettes sont publiquement lisibles par URL : valider si ce choix est acceptable.
6. **Couverture d'intégration.** Les 183 tests passent, mais utilisent des mocks Supabase ; aucun test frontend de cartes de fidélité ne figure dans le dépôt et les tests SQL RLS n'ont pas été exécutés. Ajouter des tests ciblés sur une base locale : isolation entre utilisateurs, partage, rôles, stockage et synchronisation, puis les intégrer à la CI. Vérifier également les migrations sur une base vierge.
7. **Poids initial.** Le build produit un JS principal de 1 308 kB minifiés, et Vite signale un chunk supérieur à 500 kB. Mesurer le chargement sur mobile et découper notamment les pages et bibliothèques de scan au besoin.

## Priorité normale

8. **Compte incomplet.** La page profil est un placeholder et le hook de déconnexion n'est relié à aucun contrôle. Décider du périmètre du compte avant d'implémenter ces parcours.
9. **Qualité et maintenance.** Le lint remonte cinq avertissements (trois usages de l'API de formulaire signalés comme incompatibles avec la mémoïsation du compilateur React, deux mises à jour d'état dans des effets). Les pages de création et d'édition de recette dupliquent une partie importante de leur formulaire : réduire cette duplication après avoir sécurisé les comportements.

## Suite UI/UX proposée

Observer sur mobile puis desktop les parcours inscription, création de recette, transfert vers une liste, courses partagées et présentation d'une carte en caisse. Contrôler les états vides, erreurs, clavier, lecteurs d'écran, contraste, réseau faible et permissions caméra. Cette revue devra distinguer observations réelles et hypothèses et s'appuyer sur les priorités produit avant de modifier l'interface.
