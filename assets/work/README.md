# Work grid media

Each folder holds the media for one card in the home-page work grid:

- `poster.jpg` — static poster frame, 1280×720 JPEG. Always visible; the
  only thing shown on reduced-motion or if the loop fails.
- `loop.mp4` — muted hover-preview loop, 3–6 s, 1280×720, no audio track.
  Keep it under ~1.5 MB.

**The current files are generated placeholders** (graded gradient loops).
Replace them with real frames/clips from each project — filenames must stay
the same; no code changes needed.

## Exporting a real loop

Pick the best 3–6 seconds of the piece, then:

```sh
# loop: seek to the in-point (-ss), take 5s, scale to 720p, strip audio
ffmpeg -ss 00:00:12 -t 5 -i source.mov \
  -vf "scale=1280:-2,fps=24" -an \
  -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p \
  -movflags +faststart loop.mp4

# poster: first frame of the loop, so hover crossfades seamlessly
ffmpeg -i loop.mp4 -frames:v 1 -q:v 2 poster.jpg
```

If a project has no usable clip yet, delete its `loop.mp4` and keep only a
real `poster.jpg` — the card degrades to a static poster automatically.
