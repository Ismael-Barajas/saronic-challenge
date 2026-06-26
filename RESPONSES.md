# Written Responses

## 1. Walk us through your decisions.

> What did you prioritize and why? What did you leave out? If Tara
> were sitting next to you, what would you ask her before building the next version?

### What I prioritized, and why.

The part I treated as the real product is the go/no-go logic, so
that got most of the attention. I pull the four conditions Tara mentioned, score every hour against
her thresholds, and then take each day down to its most conservative hour inside a demo window. That
window piece is the main decision I made. I made some assumptions that a demo can't run in the dark and nobody runs one
overnight, so I set the window to daylight (sunrise to sunset) overlapped with roughly 8am to 5pm,
and I only score those hours (I'd ask for operation hours as a non-fuctional requirement). This handles both ways she got "burned". I wrote this part test first and kept it as a plain, framework-free module
with the thresholds as named constants, since it's the piece most likely to need tuning and the
piece a future app could reuse as is.

The other thing I prioritized was being honest about what the tool is. Tara was clear that she wants
the information in one place, not a machine deciding for her. So the verdict never shows up on its
own. It sits next to the actual numbers and the reason behind it (something like "wind 22 kn
at 2pm"), and the hourly strip shows how conditions move through the day instead of hiding that
behind one label. The colored read is just a quick way into her own rules, and the call stays hers.
I also leaned into the dockside reality. The last forecast is cached and shown right away, and if a
refresh fails the app keeps that data on screen with a clear "offline, from 2h ago" note instead of
an error. It installs and opens with no signal.

### What I left out.

A few things I left out were: a configurable window, a
"best window" finder, the other sites, a native app, historical data, logins, and notifications. I
also decided not to pull in Serwist for the offline piece, since its Next 16 support is very new,
and wrote a small service worker I understand fully instead. All of these are fair next steps, but
none of them is the thing that makes or breaks the tool, which is whether the screen is easy to scan.

### What I'd ask Tara.

Mostly I'd want to check the rules I had to guess at. Are 20 kn and 4 ft hard
limits or just rough guidance, and do they change by customer or by vessel? Should wind be the
sustained speed or the gusts? Does she care about how choppy the water is (swell period) separately
from the wave height number, since short, steep swell is harder on a small boat than the height
alone suggests? What hours does she actually run demos, and does setup and teardown stretch that
window? Another question I'd ask is what contributes to the captain's "gut feel" on the sea state, what is he
reading that the data isn't? I'd if a perfect weather day could still be ruined by crowded water, which is the idea I get into in question 2.

## 2. How would you evolve this tool?

> Tara wants to add the other demo sites (Panama City, Norfolk, San
> Diego). The boat captains want a mobile version. PMs want to pull in historical weather patterns so
> Tara can push back on leadership scheduling demos during storm season. How do you prioritize? What
> would you build next?

### How I'd prioritize.

I'd first ask which change prevents the most bad scheduling calls for the least effort,
and whether it helps the daily job. By that measure the order I'd prioritize is: multi-site first, then mobile, then historical patterns. First, I'd focuse on multi-site: the scoring, data layer, and UI are already site-agnostic, so it's really just a list of coordinates, a picker, and parallel fetches, and since I request with timezone=auto, each site already comes back in its own local time. Then mobile, but only after a conversation. It's already a PWA that runs fine on a phone, and a true native app mostly repeats that, so I'd only build one for a requirement the PWA can't meet, like app-store distribution or native hardware, knowing the portable scoring logic lets us go native later. Finally historical patterns, It's a new feature, where I'd replay the existing scoring over archive data to show how often a given week has historically been a no-go and surface it as a seasonal risk calendar.

### What I'd build next.

If there were time, is how much other traffic is on the water at that time. A demo needs clear water,
not just clear skies. A clear Saturday might be a worse day to run one than an overcast Saturday
if the water around it are full of recreational boats, fishing traffic, or commercial
vessels. That's partly because it's harder for the customer to actually watch the vessel, and partly
because running an autonomous boat through a crowd is a safety and optics problem on its own. Folded into the same
model it becomes a second axis next to weather, so a day could read weather-GO but traffic-CAUTION,
and Tara would see both.
