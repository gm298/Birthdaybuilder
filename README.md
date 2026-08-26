# Tiny Birthday Builder

Static birthday landing page, party builder, and custom cake catalogue for Tiny Healthy Cafe (Berawa, Bali).

## Live preview (GitHub Pages)

- [Birthday landing](https://gm298.github.io/Birthdaybuilder/birthdays/)
- [Party builder](https://gm298.github.io/Birthdaybuilder/birthdays/builder/)
- [Build a cake](https://gm298.github.io/Birthdaybuilder/cakes/)

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
