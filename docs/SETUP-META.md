# Setup Meta — runbook pas-à-pas (pour toi, l'humain)

> Ces étapes se font **à la main** dans le dashboard Meta. Ton agent Claude ne peut pas cliquer à ta place — il te dira « fais l'étape X de ce fichier » au bon moment.
>
> ⚠️ L'interface Meta change souvent. Les libellés exacts peuvent différer — cherche l'intention de chaque étape. Réf. officielle : https://developers.facebook.com/docs/instagram-platform

## Vue d'ensemble des étapes

```
1. Compte Insta en Pro          ──┐
2. App Meta créée                 │  Setup de base (mode développement)
3. Produit Instagram ajouté       │  → tu peux déjà tester sur TON compte
4. Webhook branché (comments)   ──┘
5. App Review                     ──  Le mur : pour DM le PUBLIC
6. Passage en Live                ──  C'est en prod
```

---

## 1. Passer le compte Instagram en Professionnel

Dans l'app Instagram : **Paramètres → Type de compte → Passer en compte professionnel** (Business ou Creator). Obligatoire — l'API ne marche pas sur un compte perso.

## 2. Créer l'app Meta

1. Va sur https://developers.facebook.com → connexion → **Mes apps → Créer une app**.
2. Type d'app : **Business**.
3. Donne un nom (ex. « IG Comment to DM »), associe ton compte business si demandé.

## 3. Ajouter le produit Instagram

1. Dans l'app → **Ajouter un produit → Instagram → Configurer**.
2. Choisis **« Instagram API with Instagram Login »** (pas la version « avec Facebook Login » — plus de Page Facebook à gérer).
3. **Connecte ton compte Instagram Pro** à l'app.
4. Note les identifiants : **App ID**, **App Secret** (Paramètres → De base). → ils iront dans `.env.local` (`META_APP_ID`, `META_APP_SECRET`).
5. Récupère l'**Instagram User ID** (numérique) du compte connecté. → `IG_USER_ID`.

## 4. Générer un token + brancher le webhook

> ⚠️ **Ordre important** : ton app doit déjà être déployée sur Vercel pour avoir une URL de webhook publique. Si l'agent ne l'a pas encore déployée, fais-le d'abord (`vercel deploy`) — l'URL sera du type `https://ton-app.vercel.app/api/webhook`.

1. **Permissions** : dans la config Instagram, active les scopes :
   - `instagram_business_basic`
   - `instagram_business_manage_messages`
   - `instagram_business_manage_comments`
2. **Génère le premier token (bootstrap)** : c'est l'étape que les gens ratent. Le webhook a besoin d'un token déjà présent en base (`ig_tokens`) pour pouvoir envoyer des DM. Deux façons :
   - **Via la route OAuth** `app/api/auth/callback/route.ts` (fournie en squelette) : tu autorises l'app via le dialogue Instagram Login, Meta redirige vers cette route avec un `code`, le code l'échange en token longue durée et l'insère en base.
   - **Ou un script de seed local** one-off qui fait le même échange.
   Tant que `ig_tokens` est vide, **rien ne part** — même si le webhook reçoit bien les commentaires. C'est le premier truc à vérifier si « ça ne marche pas ».
3. **Webhooks** : section Webhooks de l'app →
   - **Callback URL** : `https://ton-app.vercel.app/api/webhook`
   - **Verify token** : la chaîne aléatoire que tu as mise dans `META_VERIFY_TOKEN`
   - Clique **Vérifier et enregistrer** (Meta appelle ton endpoint en GET — s'il répond bien, c'est validé).
   - **Abonne-toi au champ `comments`** (et `messages` si tu veux gérer les réponses dans le DM plus tard).

✅ **À ce stade, en mode développement, tu peux déjà tester** : commente le mot-clé sous un de **tes** posts (ton compte a un rôle sur l'app) → tu dois recevoir le DM. Si ça marche, la techno est validée. Le reste, c'est de l'administratif.

## 5. App Review — LE mur (pour DM le public)

En mode développement, l'app ne peut DM que les comptes ayant un rôle sur l'app (toi). Pour que **n'importe quel follower** reçoive le DM, il faut l'**Advanced Access** sur les permissions messaging/comments, débloqué par l'**App Review**.

### Checklist des livrables (prépare TOUT avant de soumettre)

- [ ] **Description du cas d'usage**, précise : « Quand un utilisateur commente un mot-clé sous un de nos reels, on lui envoie un message privé contenant une ressource gratuite qu'il a explicitement demandée en commentant. Aucun message à froid. »
- [ ] **Vidéo de démo (screencast)** — LE critère le plus regardé. Montre le parcours complet, sans coupure : (1) le reel avec l'appel à commenter, (2) un commentaire avec le mot-clé depuis un autre compte, (3) le DM qui arrive. Montre aussi où l'utilisateur consent.
- [ ] **Politique de confidentialité** hébergée à une URL publique (l'agent peut générer une page `/privacy`). Doit dire quelles données tu traites (commentaires, identifiant Insta) et pourquoi.
- [ ] **Instructions de suppression de données** (souvent exigées) : une URL ou un callback de *data deletion* indiquant comment un utilisateur fait supprimer ses données.
- [ ] **Comptes testeurs** : ajoute dans l'app (rôles) les comptes qui serviront à la démo, pour que le reviewer Meta puisse reproduire.
- [ ] Éventuelle **vérification business** (pièces justificatives de l'entreprise) selon le type d'app.

### Si c'est refusé (ça arrive au 1er passage)

Meta renvoie un motif. Les plus fréquents : vidéo pas assez claire, privacy policy incomplète, ou parcours de consentement pas montré. Corrige le point cité, garde la même app, re-soumets. Prévois **1 à 2 allers-retours** — ce n'est pas un échec, c'est le process.

## 6. Passer l'app en Live

Une fois l'Advanced Access accordé : bascule l'app de **Development** à **Live** (interrupteur en haut du dashboard). À partir de là, le public reçoit les DM.

---

## Récap des secrets à coller dans `.env.local` (et dans Vercel)

| Variable | D'où ça vient |
|---|---|
| `META_APP_ID` | Étape 3.4 |
| `META_APP_SECRET` | Étape 3.4 |
| `META_VERIFY_TOKEN` | Une chaîne aléatoire choisie par toi (étape 4.3) |
| `IG_USER_ID` | Étape 3.5 |
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Dashboard Supabase |
| `CRON_SECRET` | Une chaîne aléatoire choisie par toi |
