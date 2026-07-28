---
name: Artesanal Moderno
colors:
  surface: '#fbf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#fbf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ef'
  surface-container: '#efeeea'
  surface-container-high: '#eae8e4'
  surface-container-highest: '#e4e2de'
  on-surface: '#1b1c1a'
  on-surface-variant: '#504442'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f0ed'
  outline: '#827472'
  outline-variant: '#d3c3c0'
  surface-tint: '#745853'
  primary: '#271310'
  on-primary: '#ffffff'
  primary-container: '#3e2723'
  on-primary-container: '#ae8d87'
  inverse-primary: '#e3beb8'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fdaa33'
  on-secondary-container: '#6b4200'
  tertiary: '#051d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#133406'
  on-tertiary-container: '#789f65'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#e3beb8'
  on-primary-fixed: '#2b1613'
  on-primary-fixed-variant: '#5b403c'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#c5efad'
  tertiary-fixed-dim: '#a9d293'
  on-tertiary-fixed: '#062100'
  on-tertiary-fixed-variant: '#2d4f1e'
  background: '#fbf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2de'
  coffee-roast: '#3E2723'
  honey-amber: '#D48806'
  plantation-green: '#2D4F1E'
  paper-offwhite: '#FDFBF7'
  bean-shell: '#6D4C41'
  error-red: '#B00020'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is crafted for an artisanal coffee e-commerce experience from Pernambuco, blending the heritage of local production with a premium, modern digital interface. The brand personality is **warm, professional, and grounded**. It should evoke the comforting aroma of freshly roasted coffee while maintaining the precision of a high-end specialty product.

The chosen style is **Minimalism with Tactile Accents**. We prioritize heavy whitespace and high-quality typography to convey a "clean" and "modern" feel, but integrate organic color tones and soft shadows to maintain an "approachable and welcoming" atmosphere. This balance ensures the product feels like a specialty boutique rather than a cold corporate utility.

Target Audience: Coffee enthusiasts who value origin, sensory notes (SCA scores), and the ritual of brewing, but expect a seamless, friction-less mobile shopping experience.

## Colors

The palette is inspired by the lifecycle of coffee and the landscape of Pernambuco:
- **Primary (Coffee Roast):** A deep, rich brown used for primary actions, headings, and high-emphasis elements. It provides the "premium" weight.
- **Secondary (Honey Amber):** An inviting amber used for highlights, special call-outs (like SCA scores or roast dates), and interactive hover states.
- **Tertiary (Plantation Green):** A natural, deep green representing the coffee plants. Used sparingly for success states, "In Stock" indicators, and organic brand accents.
- **Neutral (Paper Off-white):** A clean, warm background that prevents the "clinical" feel of pure white, providing an artisanal, parchment-like quality.

Error states must use a clear, high-contrast red (`#B00020`) that remains legible against the off-white background to ensure functional clarity during the checkout process.

## Typography

The typography strategy creates a tension between traditional elegance and modern utility:
- **Serif (Playfair Display):** Used for all major headlines and product names. It suggests the "premium" and "literary" aspect of specialty coffee.
- **Sans-Serif (Inter):** Chosen for its exceptional legibility on mobile devices. It handles all functional text, including brewing instructions, checkout forms, and sensory notes.

**Scaling Rules:**
- On mobile, reduce `display` and `headline-lg` sizes as defined in the tokens to ensure text doesn't wrap awkwardly.
- Use `label-sm` (uppercase) for technical data points like "SCA SCORE" or "PESO" to create a distinct visual hierarchy against body text.

## Layout & Spacing

The layout follows a **Fluid Grid** model based on an 8px rhythm. 

- **Desktop:** A 12-column grid with a maximum width of 1200px. This keeps the e-commerce experience feeling curated rather than "infinite."
- **Mobile:** A single-column flow with 16px side margins. 
- **Spacing Philosophy:** Use generous vertical padding (`section` spacing of 64px-80px) to give the brand a "premium" breathing room. Elements within cards or form groups should use tighter 8px/16px increments.

The product list should reflow from 1 column on mobile to 2 columns on tablet and 3 or 4 columns on desktop depending on the screen width.

## Elevation & Depth

We avoid heavy shadows to maintain the minimalist aesthetic. Depth is communicated through **Tonal Layers** and **Soft Ambient Shadows**:

1.  **Level 0 (Base):** Background color (`paper-offwhite`).
2.  **Level 1 (Cards/Surface):** Pure white (`#FFFFFF`) surfaces with a very subtle, diffused shadow (Blur: 12px, Opacity: 4%, Color: Primary). This makes product cards feel like they are resting lightly on a surface.
3.  **Level 2 (Interaction):** When hovering or selecting an item, the shadow deepens slightly (Opacity: 8%) to provide tactile feedback.
4.  **Flat Outlines:** For input fields and secondary buttons, use a 1px border in a low-opacity version of the Primary color instead of shadows.

## Shapes

The shape language is **Soft**. We avoid sharp 90-degree corners to keep the brand "welcoming," but we also avoid pill-shapes to maintain a "modern and structured" professional look.

- **Standard Elements:** Buttons, Input fields, and Product Cards use a `0.25rem` (4px) radius.
- **Large Containers:** Modals or large image containers use a `rounded-lg` (8px) radius to emphasize softness in larger surface areas.

## Components

### Buttons
- **Primary:** Solid `Coffee Roast` background with `Off-white` text. Subtle 4px rounded corners.
- **Secondary:** `Coffee Roast` 1px border with transparent background.
- **States:** Hover should slightly lighten the background or shift to `Honey Amber` for high-action items like "Finalizar Pedido."

### Product Cards
- Clean white background.
- Top-aligned image with no border.
- Content area includes: Product Name (Playfair), Sensory Notes (Inter, smaller), and Price (Inter, Bold).
- The "Add to Cart" or "View Detail" button should only appear or gain prominence on hover/focus.

### Input Fields
- Background: Pure White.
- Border: 1px subtle gray or low-opacity Primary.
- **Error State:** Border becomes `error-red` (2px thickness) with a small helper text below the field in the same color.
- Focus State: Border color shifts to `Honey Amber`.

### Chips / Badges
- Used for "SCA Score" or "Esgotado."
- Rounded-sm (2px).
- Low-saturation background tints of the brand colors (e.g., light amber for scores, light green for "In Stock").

### Lists & Navigation
- Simple, borderless list items for "Meus Pedidos." 
- Use horizontal dividers (1px, 5% Primary opacity) to separate items without creating visual clutter.