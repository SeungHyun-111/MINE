# Worklog 260722

## Done Today

- Updated the exercise routine muscle map behavior.
- Routine target muscles now stay visible while the routine panel is open.
- Selecting a routine exercise highlights that exercise target more strongly.
- Clicking the same routine exercise again clears the exercise selection.
- Muscle map clicks now toggle extra muscles on and off when they are not part of the active routine.
- Routine muscles cannot be toggled off from the muscle map.
- Scraped MuscleWiki public exercise pages into local JSON data.
- Added `src/data/musclewikiExercises.json` for local exercise recommendations.
- Added `scripts/scrape-musclewiki.mjs` to regenerate the scraped MuscleWiki JSON.
- Replaced the 3-item recommendation list with full local JSON-backed exercise lists.

## Notes

- MuscleWiki API requires an API key, so this uses public HTML scraping instead of runtime API integration.
- `adductors` default MuscleWiki route returned unrelated global exercise results, so adductor-related app muscles currently fall back to the existing local exercise list.
- `npm run build` passes.
- Vite still warns that the exercise page chunk is over 500 kB because the JSON is imported into the page bundle.

## Next

- Decide whether to lazy-load `musclewikiExercises.json` to reduce the exercise page bundle size.
- Find a clean MuscleWiki source route for adductors, or manually curate adductor JSON.
- Review MuscleWiki muscle slug mappings for any other broad or duplicated categories.
- Improve the recommendation list UI for long lists, possibly with search, equipment filters, or difficulty filters.
- Optionally translate scraped exercise names or add Korean aliases.
