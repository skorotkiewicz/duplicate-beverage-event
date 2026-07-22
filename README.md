# Moved to https://github.com/skorotkiewicz/x

# Duplicate Beverage Event

A single-page story site about a low-priority temporal incident, one impossible coffee, and the first useful miracle.

The page includes:

- the source story
- synchronized narration from `resources/audio/story.m4a`
- paragraph highlighting and click-to-seek timing from `resources/audio/story.vtt`
- a music/video section and lyrics archive
- a small SVG favicon

## Use

```sh
just serve
```

## Build

```sh
just build
```

This writes the minified page to `index.html` from:

```text
resources/Duplicate-Beverage-Event.html
```

## Check

```sh
just check
```

For the Docker-based validator:

```sh
just check-vnu
```

## Notes

`resources/aligned.js` is the small helper used to bake VTT timings into the story HTML. The site does not need it at runtime.
