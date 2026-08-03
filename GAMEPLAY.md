# Gameplay

How Star Game plays. For setup and running the server, see [USAGE.md](USAGE.md).

## The idea

You are a wish, drawn as a shooting star. You have written the wish down, and now it has to climb through 75 seconds of crowded sky to reach the stars. Everything moving across the screen is in your way. Survive the climb and your wish joins the wish wall; run out of lives and it gets caught in the hustle and bustle.

## Starting

1. Type your wish into the box on the pink start screen. It can't be blank — the game will tell you to type a wish first.
2. Click **"Make your wish!"**
3. "Get Ready!" appears for 3 seconds. Obstacles start about 1 second after that, so you get roughly 4 seconds of calm to settle in.

## Controls

| Key | Effect |
| --- | --- |
| ← | Move left 30 px |
| → | Move right 30 px |
| ↑ | Move up 30 px |
| ↓ | Move down 30 px |

Movement is step-based, not held — each key press is one 30 px hop, and holding a key repeats at your OS key-repeat rate. There is no diagonal input; press two keys in quick succession instead.

You can range the full width of the 900 px play area and 400 px up or down from your starting height. You cannot leave the box — movement clamps at the edges.

## Lives

You start with **5**, shown in the counter beneath the play area.

Taking a hit costs one life, removes the obstacle that hit you, and makes your star flash for 2 seconds. The flash is a visual tell only — it does **not** make you invulnerable. Other obstacles already on screen can still hit you while you're flashing, so use those two seconds to move somewhere clear rather than to sit still.

At 0 lives the run ends immediately and the lose modal slides up.

## Obstacles

Obstacles enter from the left or right edge at a random height and cross the screen at a steady speed. A new one spawns every **2–6 seconds**, chosen at random, so the sky thickens and thins unpredictably rather than on a beat. Each one clears itself after 10 seconds if it hasn't already left the screen.

Two things worth knowing:

- **Sprites don't collide at their edges.** The hitbox is inset 120 px from every side of the 280 px sprite, so you can overlap a fair amount of a bad guy's picture without taking a hit. Near misses look much closer than they are — trust the gap, not the panic.
- **Direction is random per spawn.** Sprites flip to face the way they're travelling, so which way one is looking tells you which edge it's heading for.

### Difficulty tiers

The cast changes every **15 seconds**, cycling through five tiers of bad guy that get progressively more crowded and harder to read:

| Time | Tier |
| --- | --- |
| 0:00 – 0:15 | 1 |
| 0:15 – 0:30 | 2 |
| 0:30 – 0:45 | 3 |
| 0:45 – 1:00 | 4 |
| 1:00 – 1:15 | 5 |

Spawn rate doesn't change with tier — the escalation is in what shows up, not how often.

## Winning

Survive **75 seconds**. Spawning stops 5–10 seconds before the end, so the last stretch is a clear run once the stragglers pass — if you reach the final tier with lives left, you have almost certainly won.

Three seconds after the timer runs out, the win modal slides up and your wish is sent to the wish wall, where it floats up from the bottom of the screen and settles into the grid alongside everyone else's.

## Losing

Lose all 5 lives and the run ends wherever you are. The lose modal appears and the wish is discarded — it never reaches the wall.

## Playing again

Both modals have a **"Make Another Wish?"** button. It reloads the page and returns you to the start screen with an empty wish box. Everything resets: lives, timer, and the background scroll.

## Tactics

- **Height is your main lever.** Obstacles spawn between 100 and 600 px up, and you can range 400 px either side of centre. The extremes of your vertical range are the least contested space on the board.
- **Read the edges, not the middle.** By the time something is centre-screen, your options have narrowed. Watch which edge new sprites appear at and start drifting early.
- **Move in twos.** One 30 px hop rarely clears a 280 px sprite. Plan a two- or three-press path rather than reacting one key at a time.
- **After a hit, relocate.** The offending obstacle is gone but the rest of the screen isn't, and you have no grace period. Flashing is the cue to move, not to freeze.
- **Coast the ending.** Once spawning stops and the last stragglers clear, stop taking risks and let the timer run out.
