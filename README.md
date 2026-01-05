# Santa Group

## Objectif

Santa Group est une application web simple et légère pour organiser des échanges de cadeaux (Secret Santa). Elle permet de créer des tirages au sort, d'organiser les participants en groupes, et d'effectuer automatiquement l'attribution des paires de manière équitable.

L'originalité est de permettre de définir les contraintes en groupant les personnes : l'algo choisit alors de ne pas choisir des cibles dans le même groupe.

Retrouve la [doc utilisateurs complète ici](./content/README.mdx)

> **ATTENTION : Ne pas prendre ce projet comme exemple !**
> 
> Il s'agit d'un projet réalisé en une 1/2 journée pour tester l'utilisation d'agents sur une base de code vierge… Il est bourré de défauts, comme :
> - énorme latence du fait que l'interface n'est mise à jour qu'à la suite de l'appel tRPC,
> - on aspire tout par tRPC au lieu de faire les requêtes dans les React Server Components,
> - accessibilité,
> - pas de traduction,
> - ...
>
> mais il **est fonctionnel** sans que j'aie à écrire/modifier plus de 100 lignes de code moi-même (par contre, j'ai beaucoup guidé les agents).
