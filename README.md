# Tiny Birthday Builder

Static birthday landing page, party builder, and custom cake catalogue for Tiny Healthy Cafe (Berawa, Bali).

**Repository:** https://github.com/gm298/Birthdaybuilder

## Live preview (GitHub Pages)

After Pages is enabled (see below):

- [Birthday landing](https://gm298.github.io/Birthdaybuilder/birthdays/)
- [Party builder](https://gm298.github.io/Birthdaybuilder/birthdays/builder/)
- [Build a cake](https://gm298.github.io/Birthdaybuilder/cakes/)

### Enable GitHub Pages (one-time)

1. Open [Repository Settings → Pages](https://github.com/gm298/Birthdaybuilder/settings/pages)
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**
3. Choose **Branch:** `main`, **Folder:** `/ (root)`
4. Save — the site is live in 1–2 minutes at https://gm298.github.io/Birthdaybuilder/

## Local preview

From the repository root:

```bash
python -m http.server 8777
```

Then open `http://127.0.0.1:8777/birthdays/`

## Structure

| Path | Purpose |
|------|---------|
| `birthdays/` | Landing page |
| `birthdays/builder/` | All-in-one party builder |
| `cakes/` | Standalone cake builder & gallery |
| `shared/` | Shared site header and footer |
