# Card artwork structure

This folder contains visual rigs and animation styles only. Gameplay values remain in the root `cards.js` file.

## Structure

```text
card-art/
├── registry.js
├── styles.css
└── archer/
    ├── rig.js
    └── styles.css
```

For a new card, create a folder named after the card ID from `cards.js`:

```text
card-art/new-card/
├── rig.js
├── styles.css
└── assets/          Optional WebP, PNG, SVG or audio files
```

Then:

1. Import and register its rig in `card-art/registry.js`.
2. Import its stylesheet in `card-art/styles.css`.
3. Keep the standard visual states: `idle`, `pose`, `walk`, `attack`, and `die`.
4. Keep SVG rigs inside a `100 × 118` local coordinate box, with the feet near `y=118`.
