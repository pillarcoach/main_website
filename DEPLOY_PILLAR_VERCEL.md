# Pillar Vercel Deployment

Use two Vercel projects under the same Vercel account/team:

- `pillar-next`: the public landing page, assigned to `pillar.coach`
- `pillar-mvp-app`: the beta app, mounted behind the landing page at `pillar.coach/beta`

The landing page project owns the production domain. Its `next.config.ts` rewrites `/beta` traffic to the MVP project's Vercel URL through the `PILLAR_MVP_ORIGIN` environment variable.

## 1. Link and deploy the MVP app

```bash
cd pillar-mvp-app
vercel login
vercel link
vercel --prod
```

Copy the production URL from the deploy output, for example:

```text
https://pillar-mvp-app.vercel.app
```

In the MVP project's Vercel dashboard, add the app secrets it needs, including:

```text
ELEVENLABS_API_KEY
ELEVENLABS_VOICE_ID
```

## 2. Link and deploy the landing page

```bash
cd ../pillar-next
vercel link
vercel env add PILLAR_MVP_ORIGIN production
vercel --prod
```

When prompted for `PILLAR_MVP_ORIGIN`, paste the MVP production URL without a trailing slash:

```text
https://pillar-mvp-app.vercel.app
```

## 3. Assign the domain

In Vercel, assign `pillar.coach` to the landing page project, not the MVP project.

Set the landing page project's root directory to:

```text
pillar-next
```

After DNS is ready:

- `https://pillar.coach` serves the landing page
- `https://pillar.coach/beta` serves the MVP app

## Notes

The MVP app currently emits built assets under `/assets` and calls `/api/tts`. The landing page rewrites both paths to the MVP project so the proxied beta app can run unchanged.
