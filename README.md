# IG Comment-to-DM — kit d'automatisation Instagram

> Remplaçant maison de la fonction « commente un mot-clé → reçois un DM avec une ressource » de ManyChat, pour **un compte Instagram Pro**.
> Pensé pour être **construit par un agent Claude Code** en suivant le plan fourni.

## ⚠️ À lire AVANT de te lancer (le « gratuit » a un astérisque)

L'API Meta est gratuite et l'hébergement tient dans les free tiers (Vercel + Supabase). **Mais** ~70 % de la difficulté de ce projet n'est **pas du code** — donc ni ce repo ni l'agent ne peuvent la faire à ta place :

1. **App Review Meta** — pour envoyer des DM au *public* (pas juste tes comptes de test), Meta doit valider ton app à la main (vidéo de démo + politique de confidentialité + description du cas d'usage). C'est le plus gros mur. Voir `docs/SETUP-META.md`.
2. **Clickops dans le dashboard Meta** — créer l'app, passer le compte en Pro, configurer les webhooks, récupérer les tokens. Que des clics, pas du code.
3. **Tokens à rafraîchir tous les 60 jours** — sinon l'automatisation s'arrête en silence.
4. **Maintenance** — l'API Meta change régulièrement ; quand ça casse, c'est toi (ou ton agent) qui débugges.

**Le calcul honnête :** ManyChat coûte ~15 $/mois et absorbe *tout* ça. Son free tier ne suffit plus depuis mars 2026 (25 contacts actifs → un seul reel qui marche bien l'épuise en un jour). Donc ce kit a du sens si tu veux **maîtriser la techno / ne pas dépendre d'un SaaS**, pas pour « économiser 15 $ sans effort ».

## Ce que fait l'automatisation

```
Un follower commente le mot-clé (ex. "GUIDE") sous un reel
        │
        ▼  (webhook Meta)
Ton app reçoit l'événement « comment »
        │
        ▼  (si le texte matche un mot-clé configuré)
Envoi d'un DM privé (Private Reply API) avec le lien de la ressource
```

Règles Meta intégrées : 1 DM par commentaire, dans une fenêtre de 7 jours, max 200 DM/h/compte.

## Stack

- **Next.js 16** (App Router) — webhook = un route handler `app/api/webhook/route.ts`
- **Bun** — package manager + runtime de dev
- **Supabase** (free) — stockage des tokens, des règles mot-clé→ressource, et log des leads
- **Vercel** (free) — hébergement du webhook + cron de refresh des tokens

## Comment construire ce projet avec ton agent Claude Code

1. Ouvre ce dossier dans Claude Code.
2. Dis à l'agent : **« Lis `CLAUDE.md`, `docs/ARCHITECTURE.md` et `plan.md`, puis exécute les tâches du plan une par une. »**
3. L'agent codera la partie technique. **Quand il te dira de faire une action dans le dashboard Meta** (créer l'app, App Review…), suis `docs/SETUP-META.md` — c'est toi qui cliques.

## Structure

| Chemin | Rôle |
|---|---|
| `CLAUDE.md` | Règles pour l'agent (stack, conventions, sécurité) |
| `.claude/rules/` | Pièges Meta, cycle de vie des tokens, sécurité |
| `docs/SETUP-META.md` | ⭐ Runbook pas-à-pas du dashboard Meta (pour toi, l'humain) |
| `docs/ARCHITECTURE.md` | Le flux technique détaillé |
| `plan.md` | Tâches découpées pour l'agent |
| `src/` `app/` | Squelette de code à compléter |
