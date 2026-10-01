---
trigger: always_on
---

# PREMIUM FUTURISTIC LIQUID-METAL LANDING PAGE HERO

## Production-Grade UI/UX Implementation Prompt

Act as a **principal frontend engineer, senior UI/UX designer, creative technologist, motion designer, accessibility specialist, and performance engineer**.

Your task is to design and implement a **premium, original landing-page hero section** inspired by the visual language of futuristic liquid metal, chrome sculpture, mercury, luxury technology, and high-fashion editorial design.

The result must feel **cinematic, tactile, experimental, minimal, confident, and extremely polished**.

Do **NOT** reproduce or closely imitate any specific website, brand, wording, composition, proprietary artwork, logo, or exact layout from a reference.

Use the reference only as broad inspiration for the **material language and atmosphere**.

---

# 1. PRIMARY OBJECTIVE

Build a **full-viewport hero experience** that immediately communicates:

* Premium quality
* Futuristic technology
* Confidence
* Precision
* Innovation
* Tactile physicality
* Editorial sophistication

The hero should look like a combination of:

> **Luxury fashion campaign + futuristic hardware advertisement + experimental digital sculpture + premium AI/technology product.**

The design should be visually impressive without becoming noisy.

The metallic forms are supporting elements—not the main content.

The headline must remain the dominant visual element.

---

# 2. CORE VISUAL ART DIRECTION

## Canvas

Use an extremely clean:

* Bright white background
* Near-white secondary surfaces
* Deep black typography
* Subtle neutral-gray tonal transitions

Avoid excessive gradients in the UI itself.

The page should feel almost like a high-end printed editorial spread that happens to contain interactive 3D objects.

---

# 3. TYPOGRAPHY

Use a modern **neo-grotesk / contemporary grotesk** typeface.

Preferred characteristics:

* Geometric but human
* Extremely clean
* Strong black weight
* Large x-height
* Tight letterforms
* Premium editorial appearance

Possible font families:

* Inter
* Geist
* Helvetica Neue
* Arial as fallback
* Another high-quality open-source grotesk if already available

Do not introduce a decorative display font.

## Headline

The headline is the visual anchor.

Use:

```text
font-weight: 800–950;
letter-spacing: -0.055em to -0.075em;
line-height: 0.88–0.95;
```

Use a very large desktop size.

Target:

```text
clamp(4.5rem, 9vw, 10rem)
```

Adjust based on viewport and actual visual balance.

The headline should occupy approximately the central visual region without touching decorative objects.

---

# 4. HERO CONTENT STRUCTURE

Create a semantic structure similar to:

```html
<header>
  <main>
    <section aria-labelledby="hero-title">
      <div class="hero-content">

        <div class="eyebrow">
          ...
        </div>

        <h1 id="hero-title">
          ...
        </h1>

        <p>
          ...
        </p>

        <div class="hero-actions">
          ...
        </div>

      </div>

      <div class="hero-visuals">
        ...
      </div>
    </section>
  </main>
</header>
```

Do not use unnecessary navigation in this hero.

The experience should begin immediately with the product statement.

---

# 5. EYEBROW / PILL

Place a centered pill above the headline.

Characteristics:

* Compact
* Rounded capsule
* Thin neutral border
* White or slightly off-white background
* Black typography
* Small uppercase or sentence-case text
* Slight letter spacing

Example structure:

```text
● NEW EXPERIENCE
```

or:

```text
INTRODUCING THE FUTURE
```

The actual copy must be appropriate to the product.

Do not use generic filler if the project already has product messaging.

## Dimensions

Desktop target:

```text
height: 36–44px
padding-inline: 18–24px
border-radius: 999px
```

Mobile:

```text
height: 32–38px
```

Add a very subtle entrance animation.

---

# 6. HERO HEADLINE

Create an oversized two-line headline.

Structure:

```text
[POWERFUL WORD / PHRASE]
[SECOND POWERFUL WORD / PHRASE]
```

The exact copy should be generated from the actual product context.

Do NOT use placeholder text such as:

```text
Your Product Here
Amazing Product
The Future Is Here
```

unless explicitly required.

The headline should communicate the product's strongest value proposition in the fewest possible words.

## Layout

Desktop:

```text
max-width: 1100–1300px
text-align: center
margin-inline: auto
```

Use:

```text
line-height: 0.9
letter-spacing: -0.06em
```

Avoid excessive wrapping.

Target exactly two lines on common desktop widths.

---

# 7. SUPPORTING DESCRIPTION

Place a short paragraph beneath the headline.

Maximum:

```text
2–3 lines
```

Desktop width:

```text
max-width: 620–720px
```

Style:

```text
font-size: 1rem–1.2rem
line-height: 1.5–1.7
color: #555–#666
```

The paragraph should explain:

1. What the product does
2. Why it matters
3. What makes the experience distinctive

Avoid marketing fluff.

---

# 8. CTA SYSTEM

Create two large pill-shaped CTA buttons.

## Primary CTA

Black filled button.

Characteristics:

```text
background: #000
color: #fff
border-radius: 999px
```

Target desktop:

```text
height: 58–66px
padding-inline: 30–40px
font-size: 1rem–1.05rem
font-weight: 600–700
```

Potential label:

```text
Get Started
```

or another product-specific action.

## Secondary CTA

White / transparent button.

Characteristics:

```text
background: #fff
color: #000
border: 1px solid #d0d0d0
border-radius: 999px
```

Possible label:

```text
Explore
```

or:

```text
See How It Works
```

---

# 9. CTA INTERACTIONS

Buttons must feel physical and responsive.

## Primary hover

Use a subtle transformation:

```text
transform: translateY(-2px);
```

Add:

* slight shadow
* subtle background transition
* extremely small scale increase

Do NOT use excessive bounce.

## Pressed

Use:

```text
transform: translateY(0) scale(0.98);
```

## Secondary hover

Transition toward:

* slightly darker border
* very light gray background
* subtle upward movement

## Focus

Provide a clearly visible keyboard focus ring.

Example concept:

```text
outline: 2px solid #000;
outline-offset: 4px;
```

Never remove focus indicators.

---

# 10. LIQUID-METAL ART DIRECTION

The defining visual element is a collection of **abstract chrome / mercury-like 3D sculptures**.

They should feel:

* Heavy
* Fluid
* Reflective
* Sculptural
* Organic
* Premium
* Slightly alien
* Physically plausible

Avoid generic spheres.

Create forms with irregular silhouettes such as:

* stretched blobs
* folded chrome ribbons
* rounded liquid masses
* melted geometric forms
* distorted metallic droplets
* soft tubular sculptures
* abstract chrome membranes

The shapes should appear as if molten metal froze in motion.

---

# 11. METALLIC MATERIAL

Metal should have:

* bright white highlights
* deep graphite reflections
* smooth black gradients
* soft environmental reflections
* subtle distorted reflections
* realistic specular highlights

Avoid:

* gold
* colorful neon
* rainbow chrome
* excessive blue tint
* plastic-looking materials
* flat gray circles

The primary material should read as:

> **polished liquid chrome / mercury**

---

# 12. COMPOSITION OF 3D OBJECTS

Do not place all objects in the center.

Frame the content.

Possible arrangement:

```text
             [small chrome object]

        ┌───────────────────────┐
        │       EYEBROW         │
        │                       │
 [blob] │     HEADLINE          │ [blob]
        │                       │
        │    DESCRIPTION        │
        │                       │
        │      CTA  CTA         │
        └───────────────────────┘

             [partial sculpture]
```

Objects may:

* enter from viewport edges
* partially leave the viewport
* sit behind content
* overlap empty whitespace
* appear cropped by the viewport

However:

**Never obscure important text.**

---

# 13. DEPTH HIERARCHY

Create at least three visual depth levels.

### Background

Very subtle atmospheric gradients or shadows.

### Midground

Large chrome sculptures.

### Foreground

Main typography and CTAs.

Typography must always remain visually dominant.

---

# 14. 12-COLUMN GRID

Use a proper desktop grid.

```text
display: grid;
grid-template-columns: repeat(12, minmax(0, 1fr));
```

Recommended:

```text
padding-inline: clamp(24px, 5vw, 80px);
gap: clamp(12px, 2vw, 32px);
```

Hero content should occupy the central columns.

Example:

```text
Columns 1–2     Decorative object
Columns 3–10    Main hero content
Columns 11–12   Decorative object
```

Do not make the grid visually obvious.

It should be an invisible layout system.

---

# 15. HERO HEIGHT

Desktop:

```text
min-height: 100svh;
```

Prefer:

```text
min-height: 100svh;
```

rather than hardcoded `100vh` to better handle mobile browser UI.

The composition should remain vertically balanced.

Use flexible spacing rather than fixed positioning wherever possible.

---

# 16. SPACING SYSTEM

Use generous whitespace.

Suggested scale:

```text
4px
8px
12px
16px
24px
32px
48px
64px
96px
128px
160px
```

Hero hierarchy:

```text
Eyebrow
↓
24–32px
↓
Headline
↓
28–40px
↓
Description
↓
32–44px
↓
CTAs
```

Do not compress the hero.

Luxury design requires breathing room.

---

# 17. MOTION DESIGN

Motion should feel expensive and physical.

Avoid:

* aggressive animations
* constant rotations
* bouncing objects
* distracting particles
* flashy transitions
* excessive scroll effects

## Floating motion

Each major metallic object should have slightly different movement.

Example:

```text
Object A:
8–14 second floating cycle

Object B:
11–18 second cycle

Object C:
14–22 second cycle
```

Use:

```text
transform: translate3d(...)
```

rather than layout-affecting properties.

Movement should be subtle.

---

# 18. PARALLAX

Implement lightweight pointer-based or scroll-based parallax.

Example:

```text
Foreground object:
small movement

Midground:
medium movement

Background:
very subtle movement
```

Never make parallax interfere with reading.

Use GPU-friendly transforms.

Avoid:

```text
top
left
width
height
```

for continuous animation.

Prefer:

```text
transform
opacity
```

---

# 19. ENTRANCE ANIMATION

On initial page load:

### Eyebrow

Fade + translate upward slightly.

### Headline

Fade + subtle upward movement.

### Description

Slight delayed fade.

### CTAs

Fade + upward movement.

### Metallic objects

Slow reveal with opacity and scale.

Suggested timing:

```text
0ms       background
150ms     eyebrow
300ms     headline
500ms     description
650ms     CTA
800ms     decorative sculptures
```

Keep the entire introduction under approximately 1.2 seconds.

---

# 20. REDUCED MOTION

Mandatory.

Implement:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Disable:

* floating loops
* parallax
* large transforms
* decorative motion

when reduced motion is requested.

The page should remain visually complete without animation.

---

# 21. RESPONSIVE DESIGN

## Desktop — 1440px+

Full cinematic composition.

Use:

* giant headline
* multiple metallic objects
* generous whitespace
* 12-column grid
* subtle parallax

---

## Laptop — 1024–1439px

Reduce:

* headline scale
* object scale
* object displacement

Maintain:

* central composition
* CTA visibility
* whitespace

---

## Tablet — 768–1023px

Reduce decorative complexity.

Use approximately:

```text
headline: clamp(3.5rem, 8vw, 6rem)
```

Objects should move farther toward the edges.

---

# 22. MOBILE DESIGN

Do NOT simply shrink the desktop layout.

Recompose it.

Use:

```text
min-height: 100svh;
padding: 24px;
```

Headline:

```text
font-size: clamp(3rem, 14vw, 5rem);
```

Maintain:

* two-line hierarchy where practical
* centered align