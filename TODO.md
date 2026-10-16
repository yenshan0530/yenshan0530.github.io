# TODO

Running list of things to come back to. Not published — excluded from the Jekyll build.

## Travel

- [ ] **Domestic (Taiwan) travel.** Right now every trip is international, so there is no
      Taiwan/domestic region in the filters and Taipei exists only as the home-base pin.
      When domestic trips get written up, add `region: Taiwan` (or `Domestic`) to them —
      the region filter is generated from the data, so the button appears automatically.
      Decide then whether the home pin should stay separate or become a regular trip.
- [ ] Yunnan is pinned to Kunming only. Add the real stops (Dali, Lijiang, Shangri-La, ...)
      as extra `places` and they will draw as a route.
- [ ] Confirm exact dates — every trip currently uses day 01 of the month, since only
      month/year were known. Only matters if you want day-level precision displayed.
- [ ] Decide if Bavaria should be `purpose: [program]` only, rather than `[program, travel]`.
- [ ] Trip covers and galleries: paths are commented out in each `_trips/*.md`.
      Drop images under `/assets/img/trips/<slug>/` and uncomment.

## Photography

- [ ] Replace the two placeholder albums in `_data/photography.yaml` with real ones.
- [ ] Add images under `/assets/img/photos/<album-slug>/`. Paths must start with `/`.

## Research

- [ ] Paper figures: each entry in `_data/research.yaml` points at
      `assets/img/<slug>.gif` — drop in the real figures.
- [x] `Expected Harm` accepted to NeurIPS 2026 (E&D Track, Spotlight).
- [ ] `Latent-Mark` arXiv v3 is retitled "...Robust to Neural Codec Compression".
      Decide which title to display.

## Site-wide

- [ ] Confirm the `info:` line in `_config.yml` — currently
      "Yen-Shan (Lily) Chen — CS & Economics @ NTU". It only shows in the homepage
      browser-tab title. Add CyCraft AI Lab if you want it there too.
- [ ] `_data/updates.yaml` has one real entry (site launch). Add more as things happen.
- [ ] `_data/about.yaml` has no `first-paragraph` / `second-paragraph` /
      `research-introduction` / `research-interests` yet, so the homepage bio is blank.
- [ ] `_data/misc.yaml` groups are placeholders.
- [ ] Nothing is committed to git yet.
- [ ] Change COLM website to https://colm.eventhosts.cc

## Ideas

- [ ] Writing: more categories beyond academic journey / random thoughts /
      philosophy / event recording?
- [ ] Travel: a stats line (countries visited, conferences attended, km travelled)?
