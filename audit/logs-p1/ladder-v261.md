# Difficulty ladder (v2.61)

audit/sim/ladder.js --n=200: AI vs AI, mixed factions (match i: side A plays faction i mod 3, side B faction floor(i/3) mod 3), A on the left on even matches, seeds 8000–8199, to 27:00. Share = (wins + draws/2) / 200. No fight = both sides dealt under 1,000 damage.

| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| hard vs normal | 152–21–27 | 82.8% | 8:00 | 83.0% | 13.5% | 0.0% |
| normal vs easy | 138–40–22 | 74.5% | 12:24 | 86.0% | 11.0% | 0.0% |
| normal vs normal | 90–66–44 | 56.0% | 14:43 | 74.5% | 22.0% | 0.0% |
| easy vs easy | 99–88–13 | 52.8% | 13:09 | 79.0% | 6.5% | 0.0% |

Targets: Hard beats Normal 70–80%; Normal beats Easy 70–80%; Normal vs Normal and Easy vs Easy draws under 25% and no-fight under 5%.
