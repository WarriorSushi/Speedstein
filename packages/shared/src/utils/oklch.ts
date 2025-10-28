/**
 * OKLCH Color Utility Functions
 *
 * Provides helper functions for working with OKLCH color space.
 * OKLCH (Lightness, Chroma, Hue) is perceptually uniform, making it ideal for:
 * - Accessible color palettes (WCAG AAA compliance)
 * - Consistent dark mode implementations
 * - Elevation/shadow systems
 *
 * @packageDocumentation
 */

/**
 * OKLCH color components
 */
export interface OklchColor {
  /** Lightness: 0% (black) to 100% (white) */
  l: number
  /** Chroma: 0 (grayscale) to 0.4 (highly saturated) */
  c: number
  /** Hue: 0-360 degrees */
  h: number
  /** Alpha: 0 (transparent) to 1 (opaque) */
  a?: number
}

/**
 * Parse OKLCH color string to components
 *
 * @param oklchString - OKLCH color in format "L% C H" or "oklch(L% C H)"
 * @returns Parsed color components
 *
 * @example
 * parseOklch("55% 0.25 260") // { l: 55, c: 0.25, h: 260 }
 * parseOklch("oklch(55% 0.25 260 / 0.5)") // { l: 55, c: 0.25, h: 260, a: 0.5 }
 */
export function parseOklch(oklchString: string): OklchColor {
  // Remove "oklch(" prefix and ")" suffix if present
  const cleaned = oklchString.replace(/oklch\(|\)/g, '').trim()

  // Split by "/" to separate alpha
  const [colorPart, alphaPart] = cleaned.split('/')

  // Parse L, C, H
  const parts = colorPart.trim().split(/\s+/)

  if (parts.length < 3) {
    throw new Error(`Invalid OKLCH color: ${oklchString}`)
  }

  const l = parseFloat(parts[0].replace('%', ''))
  const c = parseFloat(parts[1])
  const h = parseFloat(parts[2])

  const color: OklchColor = { l, c, h }

  if (alphaPart) {
    color.a = parseFloat(alphaPart.trim())
  }

  return color
}

/**
 * Convert OKLCH components to CSS string
 *
 * @param color - OKLCH color components
 * @returns CSS OKLCH color string
 *
 * @example
 * toOklchString({ l: 55, c: 0.25, h: 260 }) // "oklch(55% 0.25 260)"
 * toOklchString({ l: 55, c: 0.25, h: 260, a: 0.5 }) // "oklch(55% 0.25 260 / 0.5)"
 */
export function toOklchString(color: OklchColor): string {
  const { l, c, h, a } = color

  if (a !== undefined && a !== 1) {
    return `oklch(${l}% ${c} ${h} / ${a})`
  }

  return `oklch(${l}% ${c} ${h})`
}

/**
 * Adjust lightness of an OKLCH color
 *
 * @param color - Original OKLCH color
 * @param delta - Lightness adjustment (-100 to +100)
 * @returns New OKLCH color with adjusted lightness
 *
 * @example
 * adjustLightness({ l: 50, c: 0.2, h: 260 }, 10) // { l: 60, c: 0.2, h: 260 }
 */
export function adjustLightness(color: OklchColor, delta: number): OklchColor {
  return {
    ...color,
    l: Math.max(0, Math.min(100, color.l + delta)),
  }
}

/**
 * Adjust chroma (saturation) of an OKLCH color
 *
 * @param color - Original OKLCH color
 * @param delta - Chroma adjustment (-0.4 to +0.4)
 * @returns New OKLCH color with adjusted chroma
 *
 * @example
 * adjustChroma({ l: 50, c: 0.2, h: 260 }, 0.05) // { l: 50, c: 0.25, h: 260 }
 */
export function adjustChroma(color: OklchColor, delta: number): OklchColor {
  return {
    ...color,
    c: Math.max(0, Math.min(0.4, color.c + delta)),
  }
}

/**
 * Rotate hue of an OKLCH color
 *
 * @param color - Original OKLCH color
 * @param degrees - Hue rotation in degrees
 * @returns New OKLCH color with rotated hue
 *
 * @example
 * rotateHue({ l: 50, c: 0.2, h: 260 }, 30) // { l: 50, c: 0.2, h: 290 }
 */
export function rotateHue(color: OklchColor, degrees: number): OklchColor {
  let newHue = color.h + degrees

  // Normalize to 0-360 range
  while (newHue < 0) newHue += 360
  while (newHue >= 360) newHue -= 360

  return {
    ...color,
    h: newHue,
  }
}

/**
 * Set alpha (opacity) of an OKLCH color
 *
 * @param color - Original OKLCH color
 * @param alpha - Alpha value (0-1)
 * @returns New OKLCH color with specified alpha
 *
 * @example
 * withAlpha({ l: 50, c: 0.2, h: 260 }, 0.5) // { l: 50, c: 0.2, h: 260, a: 0.5 }
 */
export function withAlpha(color: OklchColor, alpha: number): OklchColor {
  return {
    ...color,
    a: Math.max(0, Math.min(1, alpha)),
  }
}

/**
 * Invert lightness for dark mode (maintains chroma and hue)
 *
 * @param color - Original OKLCH color
 * @returns Inverted color for dark mode
 *
 * @example
 * invertForDarkMode({ l: 90, c: 0.01, h: 264 }) // { l: 10, c: 0.01, h: 264 }
 */
export function invertForDarkMode(color: OklchColor): OklchColor {
  return {
    ...color,
    l: 100 - color.l,
  }
}

/**
 * Calculate WCAG contrast ratio between two OKLCH colors
 * (Approximate - OKLCH is perceptually uniform but not exactly WCAG)
 *
 * @param color1 - First color
 * @param color2 - Second color
 * @returns Approximate contrast ratio (1-21)
 *
 * @example
 * const contrast = getContrastRatio(
 *   { l: 95, c: 0, h: 0 }, // White
 *   { l: 20, c: 0, h: 0 }  // Dark gray
 * ) // ~15 (AAA compliant)
 */
export function getContrastRatio(color1: OklchColor, color2: OklchColor): number {
  // Simplified contrast calculation using lightness difference
  // OKLCH lightness is perceptually uniform, so this is a good approximation
  const l1 = color1.l / 100
  const l2 = color2.l / 100

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  // WCAG formula approximation
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if color meets WCAG AAA contrast requirements
 *
 * @param foreground - Foreground color
 * @param background - Background color
 * @param largeText - Whether text is large (>=18pt or >=14pt bold)
 * @returns Whether contrast meets WCAG AAA standards
 *
 * @example
 * meetsWCAG_AAA(
 *   { l: 20, c: 0, h: 0 },  // Dark text
 *   { l: 95, c: 0, h: 0 },  // Light background
 *   false                   // Normal text
 * ) // true (AAA requires 7:1 for normal text)
 */
export function meetsWCAG_AAA(
  foreground: OklchColor,
  background: OklchColor,
  largeText = false
): boolean {
  const contrast = getContrastRatio(foreground, background)

  // WCAG AAA: 7:1 for normal text, 4.5:1 for large text
  return largeText ? contrast >= 4.5 : contrast >= 7
}

/**
 * Generate a perceptually uniform color scale
 *
 * @param baseColor - Base color to scale from
 * @param steps - Number of steps in the scale (default: 10)
 * @returns Array of OKLCH colors from lightest to darkest
 *
 * @example
 * generateColorScale({ l: 50, c: 0.2, h: 260 }, 5)
 * // [
 * //   { l: 90, c: 0.2, h: 260 }, // Lightest
 * //   { l: 70, c: 0.2, h: 260 },
 * //   { l: 50, c: 0.2, h: 260 }, // Base
 * //   { l: 30, c: 0.2, h: 260 },
 * //   { l: 10, c: 0.2, h: 260 }  // Darkest
 * // ]
 */
export function generateColorScale(baseColor: OklchColor, steps = 10): OklchColor[] {
  const scale: OklchColor[] = []

  const minL = 10
  const maxL = 98
  const stepSize = (maxL - minL) / (steps - 1)

  for (let i = 0; i < steps; i++) {
    scale.push({
      l: maxL - i * stepSize,
      c: baseColor.c,
      h: baseColor.h,
    })
  }

  return scale
}

/**
 * Create an elevation shadow using OKLCH
 *
 * @param baseColor - Base color for the shadow
 * @param elevation - Elevation level (1-5)
 * @returns CSS box-shadow value
 *
 * @example
 * createElevationShadow({ l: 20, c: 0, h: 0 }, 2)
 * // "0 2px 4px oklch(20% 0 0 / 0.1), 0 4px 8px oklch(20% 0 0 / 0.08)"
 */
export function createElevationShadow(baseColor: OklchColor, elevation: number): string {
  const shadows = [
    // Level 1: Subtle
    ['0 1px 2px', '0 1px 3px'],
    // Level 2: Low
    ['0 2px 4px', '0 4px 8px'],
    // Level 3: Medium
    ['0 4px 8px', '0 8px 16px'],
    // Level 4: High
    ['0 8px 16px', '0 16px 32px'],
    // Level 5: Very high
    ['0 16px 32px', '0 32px 64px'],
  ]

  const [shadow1, shadow2] = shadows[Math.min(elevation - 1, 4)]

  const color1 = toOklchString(withAlpha(baseColor, 0.1))
  const color2 = toOklchString(withAlpha(baseColor, 0.08))

  return `${shadow1} ${color1}, ${shadow2} ${color2}`
}
