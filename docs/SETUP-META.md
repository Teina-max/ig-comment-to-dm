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
2. **Génère un token d'accès** via le bouton de connexion Instagram. → il sera échangé contre un token longue durée par le code (table `ig_tokens`).
3. **Webhooks** : section Webhooks de l'app →
   - **Callback URL** : `https://ton-app.vercel.app/api/webhook`
   - **Verify token** : la chaîne aléatoire que tu as mise dans `META_VERIFY_TOKEN`
   - Clique **Vérifier et enregistrer** (Meta appelle ton endpoint en GET — s'il répond bien, c'est validé).
   - **Abonne-toi au champ `comments`** (et `messages` si tu veux gérer les réponses dans le DM plus tard).

✅ **À ce stade, en mode développement, tu peux déjà tester** : commente le mot-clé sous un de **tes** posts (ton compte a un rôle sur l'app) → tu dois recevoir le DM. Si ça marche, la techno est validée. Le reste, c'est de l'administratif.

## 5. App Review — LE mur (pour DM le public)

En mode développement, l'app ne peut DM que les comptes ayant un rôle sur l'app (toi). Pour que **n'importe quel follower** reçoive le DM, il faut l'**Advanced Access** sur les permissions messaging/comments, débloqué par l'**App Review**.

Tu devras fournir :
- **Description du cas d'usage** : « Quand un utilisateur commente un mot-clé sous un reel, on lui envoie un message privé contenant une ressource gratuite qu'il a demandée. »
- **Une vidéo de démo (screencast)** montrant le parcours complet : commentaire → DM reçu. C'est le critère le plus regardé.
- **Une politique de confidentialité** hébergée (URL publique). L'agent peut t'en générer une page simple.
- Éventuellement une **vérification business** (pièces justificatives de l'entreprise).

Délais variables, parfois un refus au 1er passage (souvent : démo pas assez claire ou privacy policy manquante). Prévois 1 à 2 allers-retours.

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
