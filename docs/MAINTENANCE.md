# Maintenance — modèle « agent autonome »

> Ce service est maintenu par **l'agent Claude Code de Manu**, pas par un dev. Ce fichier + `.claude/rules/maintenance.md` sont ce qui rend ça possible. Quand quelque chose casse, Manu ouvre son agent et lui dit « le service Insta ne marche plus, suis `docs/MAINTENANCE.md` ».

## Comment ça tient en vie (les 3 organes vivants)

| Organe | Ce qui le maintient | Ce qui le tue |
|---|---|---|
| **Token** (`ig_tokens`) | Le cron `refresh-token` (refresh < J-10 expiry) | Cron en panne 60j → token expiré → plus aucun DM |
| **Webhook** | L'abonnement Meta + l'URL Vercel stable | App désactivée, URL changée, verify token modifié |
| **App Review** | Statut « Live » + permissions accordées | Meta révoque/durcit → repasse en dev → DM public bloqués |

## Le linchpin : l'alerting (sans lui, « autonome » ne marche pas)

L'agent ne tourne **pas** en continu — il n'agit que quand Manu l'invoque. Donc le système doit **crier tout seul** quand ça va mal, sinon Manu ne saura jamais qu'il faut ouvrir l'agent. Alertes obligatoires (vers `ALERT_WEBHOOK_URL`, ex. Telegram) :

- ❗ échec du refresh de token (le plus critique)
- ❗ échec d'envoi de DM répété (erreur Meta)
- ❗ pic d'échecs de signature (webhook attaqué ou app secret changé)
- ❗ change `comments` qui ne matche plus le schéma (contrat Meta modifié)

**Chaque alerte doit dire quoi faire** : « ouvre ton agent → MAINTENANCE.md » ou « → appelle un humain technique ».

## Runbook : symptôme → diagnostic → action

| Symptôme | Diagnostic | Action |
|---|---|---|
| Plus aucun DM ne part | `GET /api/healthz` → token expiré ? absent ? | Token expiré → lancer le cron refresh. Absent → re-bootstrap (`/api/auth/callback`). |
| Alerte « token refresh failed » | Le refresh a échoué (token déjà mort ? secret changé ?) | Si refresh impossible → re-bootstrap manuel. Vérifier `META_APP_SECRET`. |
| Webhook ne reçoit plus rien | Abonnement Meta cassé / URL changée | Dashboard Meta → re-vérifier l'URL webhook + l'abonnement `comments`. |
| DM partent à toi mais pas au public | App repassée en mode Development | Vérifier statut « Live » + permissions ; possible re-App Review. |
| Erreur Meta inconnue dans les logs | Pas au catalogue ci-dessous | **NE PAS improviser** → escalader (voir plus bas). |

## Catalogue d'erreurs Meta (codes fréquents)

> Toujours **vérifier le code contre la doc live** avant d'agir — ils évoluent.

- **190** (token invalide/expiré) → refresh, ou re-bootstrap si refresh échoue.
- **10 / 200** (permission manquante) → l'App Review n'est pas/plus accordée pour ce scope. Escalader si inattendu.
- **613** (rate limit) → tu dépasses ~200/h. Activer/ralentir la queue durable (voir ARCHITECTURE.md).
- **100** (param invalide) → souvent un endpoint/version périmé après un changement Meta. Re-vérifier la doc live.

## Quand escalader à un humain technique (Teina)

L'agent **s'arrête et alerte un humain** si :
- le symptôme n'est **pas** dans le runbook/catalogue ci-dessus,
- l'erreur Meta est inédite ou implique un **changement de contrat d'API** (shape, scope, version dépréciée),
- l'App Review a été **révoquée**,
- un fix nécessiterait de **deviner** sur un service en production.

Règle d'or : sur un service live, **ne pas improviser**. Un mauvais « fix » à l'aveugle est pire que l'attente d'un humain.
