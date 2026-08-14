# WhenIsDue Visual & Calculator Design System
## Version 1.0 — extracted from the approved Homepage, Return Window, Business Days, and Invoice Due Date experiences
**Status:** Product/design baseline  
**Date:** 14 August 2026

---

## 1. North Star

### User-facing principle
**The answer should be simple. The experience does not have to be plain.**

### Portfolio-facing principle
**The craftsmanship should be obvious before someone understands how much work is underneath it.**

### Operating rule
**Expressive surroundings + brutally clear utility.**

The visual treatment may be editorial, conceptual, architectural, tactile, or photographic. The calculation itself must remain immediate, legible, trustworthy, and easy to operate.

---

## 2. What every calculator page must accomplish

Every major calculator page should answer these questions in this order:

1. **What is this page for?**
2. **What is the answer right now?**
3. **What inputs produced that answer?**
4. **What rule is being used?**
5. **Can I change the inputs quickly?**
6. **Can I act on or save the result?**
7. **What caveats or related questions matter?**

A visual concept must never delay or obscure these answers.

---

## 3. Shared page anatomy

Approved calculator pages should generally use this hierarchy:

### A. Compact brand header
- Current WhenIsDue logo on the left.
- Primary navigation on the right.
- Mobile: logo remains visible; redundant `Home` text may be removed.
- Avoid duplicate logo rows, legacy checkmark marks, or oversized navigation.
- Header must consume as little vertical space as practical on mobile.

### B. Answer-first editorial hero
The hero should combine:
- page eyebrow / calculator label
- short question-style H1
- current calculated answer
- weekday or secondary result context
- one page-specific conceptual visual

The image is **environment**, not the answer.

### C. Primary calculation workspace
- Inputs grouped clearly.
- Presets exposed when useful.
- Result displayed beside inputs on desktop and directly after inputs on mobile.
- Changes update immediately wherever deterministic calculation makes that safe.

### D. Related exact-answer / shortcut surface
Examples:
- Net 7 / 15 / 30 / 45 / 60 / 90
- 3 / 5 / 7 / 10 business days
- relevant rule pages
- related calculator routes

This should look like intentional navigation, not a link dump.

### E. Supporting explanation
- answer caveats
- worked examples
- interpretation rules
- FAQ
- internal links

On mobile, supporting content should generally become a **clean reading flow with separators**, not a long tower of oversized white cards.

### F. Compact footer
- About / Privacy / Terms / Contact
- short, context-specific planning disclaimer
- avoid unnecessary mobile paragraphs

---

## 4. Hero rules

### The hero must be answer-first
The hero should make the calculated result discoverable before the user has to understand the image.

### H1
Use plain-language questions whenever practical:
- `When is this invoice due?`
- `Business days from today`
- `Find your last day to return an item`

Avoid:
- clever slogans
- vague marketing copy
- overly technical wording

### Result hierarchy
Preferred hierarchy:
1. due/result date
2. weekday
3. selected rule/term
4. short contextual sentence

The result should visually outweigh explanatory text.

### Mobile
Aim for the user to see the answer in the first viewport or immediately after minimal scroll.

Hero photography must not consume mobile space simply because it is beautiful.

---

## 5. Visual concept system

Each major calculator can own a distinct conceptual world.

The page should feel like a chapter of WhenIsDue rather than a duplicate template.

### Approved archetype A — Return Window
**Visual language:** warm editorial / lifestyle / consumer object  
**Concept:** possession remains temporary until the final return point  
**Best for:** consumer, shopping, ownership, expiry-type questions

### Approved archetype B — Business Days
**Visual language:** architecture / natural light / rhythm / absence  
**Concept:** COUNT → SKIP → CONTINUE  
**Best for:** rules involving exclusions, working days, schedules, interruptions

### Approved archetype C — Invoice Due Date
**Visual language:** precision industrial design / crafted endpoints / controlled span  
**Concept:** ISSUED → TERMS → DUE  
**Best for:** professional, transactional, contractual, fixed-interval questions

### Visual concept selection test
Before producing a new image ask:

1. Can the concept be explained in one sentence?
2. Does it relate to the calculation rather than merely to its industry?
3. Is it different from imagery already used?
4. Would the image still look good in an art/design publication without the calculator?
5. Does it leave calm space for UI?
6. Does the metaphor survive a mobile crop?
7. Is the image subordinate to the answer?

If the answer to any critical item is no, do not produce the image yet.

---

## 6. Image rules

### Preferred
- highly photorealistic
- editorial photography
- art-gallery / catalogue / design-publication quality
- tactile materials
- strong negative space
- controlled asymmetry
- restrained saturation
- believable natural/studio light

### Avoid
- calendar clichés
- clocks / watches
- generic office imagery
- stock business people
- fake dashboards
- floating UI
- floating 3D icons
- neon AI imagery
- obvious SaaS illustration
- decorative images with no conceptual connection

### Responsive crop
Important visual information should generally survive within the central 55–70% of the source image.

A mobile 4:5 / portrait crop must retain the metaphor.

### File format
Use optimized WebP for production whenever practical.

---

## 7. Brand color roles

### Deep navy
Use for:
- brand identity
- dominant answers
- high-confidence result panels
- strong editorial contrast

Navy should communicate certainty.

### Restrained green
Use for:
- actions
- selected presets
- confirmation
- navigation arrows
- eyebrows / subtle editorial cues

Green should communicate action or successful selection, not decoration.

### Amber
Use for:
- caveats
- ambiguity
- counting-rule warnings
- interpretive caution

Amber should mean “pay attention to the rule,” not general emphasis.

### Warm ivory
Primary canvas / background.

### Pale blue / cool mineral surfaces
Useful for:
- quick-answer chapters
- secondary navigational surfaces
- professional utility sections

Do not introduce a new category color just to make a section feel different.

---

## 8. Typography hierarchy

### Page eyebrow
- uppercase
- restrained green or context color
- high weight
- increased tracking
- short

### H1 / main question
- bold
- high contrast
- tight tracking
- short enough to scan quickly
- allowed to break dramatically on mobile if still readable

### Primary date/result
- largest functional type on the page
- avoid typewriter/monospace styling unless it adds functional meaning
- do not let typography overflow narrow devices

### Section H2
Strong but visibly below the result hierarchy.

### Supporting body
Comfortable reading size, but mobile body copy should not be so large that explanatory content becomes endless scrolling.

### No squinting
Nothing important should require zooming or close inspection.

---

## 9. Calculator control rules

### Inputs
- obvious labels
- 44px+ touch targets
- generous but not wasteful padding
- use native date controls where practical
- preserve deterministic immediate updates

### Presets
Use when they remove typing:
- 1 / 3 / 5 / 7 / 10
- Net 7 / 15 / 30 / 45 / 60 / 90

Selected state:
- restrained green border/background
- visually obvious without excessive saturation

### Mobile
Presets should use one compact row when practical.
If there are too many choices, use a tidy 2-row grid.

### Do not create redundant controls
If selecting a preset and choosing from a select menu perform the same operation, both may exist only when they serve different speed/accessibility needs.

---

## 10. Result panel rules

The result panel is the primary functional centerpiece after the hero.

### Preferred structure
- small result eyebrow: `DUE DATE`, `LAST DAY TO RETURN`, etc.
- dominant date
- weekday
- selected rule / term chip
- one concise interpretation sentence
- expandable receipt / calculation explanation
- action controls
- optional `More options`

### Desktop
Inputs and result may sit side-by-side.

### Mobile
Result should follow the input block directly.

### Result actions
Preferred actions where relevant:
- Favorite
- Copy result
- Copy link
- Share
- Add to calendar

Mobile actions should not become five huge full-width rows.
Use compact grids where possible.

---

## 11. Calculation receipt

Receipts are trust infrastructure.

Use them to expose:
- starting date
- selected rule
- skipped days / counting method
- resulting date

Default presentation can be collapsed to keep the initial experience clean.

Do not make users read the calculation receipt to understand the answer.

---

## 12. Progressive disclosure

Mobile should demonstrate breadth without forcing users to scroll through the entire product.

Use progressive disclosure for:
- additional tasks
- additional exact answers
- counting settings
- FAQs / optional detail
- save options
- advanced calculation details

Button language should be plain:
- `Show more tasks`
- `More counting questions`
- `Explore more answers`
- `Counting settings`
- `More options`

Avoid ambiguous jargon such as `Snooze` where plain wording is available.

---

## 13. Supporting editorial content

The lower informational section should support:
- search intent
- trust
- machine extractability
- internal linking
- edge cases

It should not visually compete with the calculator.

### Desktop
A limited card/grid treatment may be used when it improves scanning.

### Mobile
Prefer:
- flat reading flow
- thin separators
- strong question headings
- moderate body text
- minimal card chrome

Avoid a 10-card mobile tower.

### Content principle
**Answer first. Explain only as much as necessary.**

Do not pad text to hit word counts.

---

## 14. Related-navigation rules

Related pages should be chosen because the user is likely to need them next.

Good examples:
- exact Net term pages from Invoice Due Date
- exact business-day counts from Business Days
- start-date / weekend / holiday guides from deadline calculators

Avoid generic “You may also like” lists.

Each related link should represent a clear next question.

---

## 15. Desktop vs mobile design philosophy

### Desktop
Can show:
- more horizontal composition
- multiple controls at once
- richer imagery
- 2-column input/result systems
- broader related-navigation grids

### Mobile
Must prioritize:
1. brand
2. question
3. answer
4. controls
5. next useful actions

Reduce:
- decorative height
- oversized cards
- repeated explanatory boxes
- one-button-per-row action stacks
- secondary copy above the answer

Mobile is not a shrunken desktop layout.

---

## 16. Accessibility and interaction

- 44px minimum practical touch targets
- semantic labels for inputs
- visible focus states
- selected states cannot rely on color alone where avoidable
- sufficient text/background contrast
- image alt text describes the physical image, not the hidden metaphor
- decorative visual overlays must not block keyboard or screen-reader interaction
- result updates should remain understandable to assistive technology

---

## 17. What may vary by calculator

The following may change freely if conceptually justified:
- hero photography
- image palette
- metaphor
- hero composition
- section accent surface
- terminology
- shortcut presets
- relevant action set
- supporting questions

---

## 18. What should stay consistent

Across major calculators, retain:
- current WhenIsDue logo/header
- warm ivory base canvas
- navy result authority
- restrained green interaction language
- amber for caveats
- answer-first hierarchy
- rounded but restrained geometry
- plain-language controls
- immediate recalculation
- strong mobile behavior
- calculation receipt pattern
- result-action vocabulary
- compact footer
- editorial but non-gimmicky photography

---

## 19. Rollout decision framework

A calculator deserves a bespoke hero image when:
- it has meaningful search/portfolio importance
- a strong visual metaphor exists
- the image improves perceived craftsmanship
- the page is likely to be a major entry point

A calculator can inherit an archetype when:
- its logic is close to an existing archetype
- a bespoke image would add little conceptual value
- the page is secondary
- speed/consistency matter more than visual novelty

Not every route needs a new photoshoot.

---

## 20. Recommended archetype mapping for remaining calculator families

### Use / adapt the Business Days archetype
- Business Days Between Dates
- SLA / Business Hours
- Shipping Delivery Range where working-day logic is central

### Use / adapt the Invoice archetype
- Net 7 / 15 / 30 / 45 / 60 / 90
- 2/10 Net 30
- Notice Period where a fixed interval is the dominant idea

### Use / adapt the Return / lifecycle archetype
- Free Trial End Date
- Subscription Renewal
- Return-window variations

### Bespoke only if justified
- Next Payday
- Deadline Calculator / ambiguous wording
- other future high-traffic gateway products

---

## 21. Freeze rules

A page may be frozen when:
- answer hierarchy is obvious
- mobile first screen works
- no major overflow/crop issue exists
- page has a clear conceptual identity
- controls are easy to operate
- lower content no longer visually dominates
- desktop and mobile both feel intentional
- further changes are primarily taste/pixel preference

Once frozen, do not revisit without:
- user evidence
- Search Console evidence
- accessibility problem
- functionality regression
- clear system-level improvement

---

## 22. Current frozen references

### Homepage
Reference for:
- brand header
- visual chapters
- mobile progressive disclosure
- brand color balance

### Return Window Calculator
Reference for:
- warm lifestyle/editorial archetype
- answer overlay over photography
- consumer/lifecycle questions

### Business Days Calculator
Reference for:
- abstract rule-based archetype
- architectural imagery
- compact mobile controls
- flat supporting-content rhythm

### Invoice Due Date Calculator
Reference for:
- professional precision archetype
- input/result side-by-side desktop composition
- exact-term navigation
- fixed-interval transactional questions

---

## 23. Next product-design step

Use this system to **standardize the remaining high-value calculator pages without inventing a new design language for every route**.

Priority should be based on:
1. Search Console opportunity
2. gateway potential
3. portfolio value
4. reuse of an approved archetype

Once the major calculator surface is visually coherent, move into the WhenIsDue Editorial & Search Studio and apply the same visual/content hierarchy to answer pages and guides.
