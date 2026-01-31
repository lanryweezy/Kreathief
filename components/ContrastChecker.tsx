import React from 'react';

interface ContrastResult {
    ratio: number;
    level: 'AAA' | 'AA' | 'AA-Large' | 'Fail';
    isAccessible: boolean;
}

interface ContrastCheckerProps {
    foreground: string;
    background: string;
    fontSize?: number;
    showDetails?: boolean;
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(hexColor: string): number {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Parse RGB values
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    // Apply gamma correction
    const gamma = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if colors meet WCAG contrast requirements
 */
export function checkContrast(
    foreground: string,
    background: string,
    fontSize = 16
): ContrastResult {
    const ratio = getContrastRatio(foreground, background);
    const isLargeText = fontSize >= 18 || fontSize >= 14; // 14pt bold or 18pt

    let level: ContrastResult['level'];
    let isAccessible: boolean;

    if (ratio >= 7) {
        level = 'AAA';
        isAccessible = true;
    } else if (ratio >= 4.5) {
        level = 'AA';
        isAccessible = true;
    } else if (ratio >= 3 && isLargeText) {
        level = 'AA-Large';
        isAccessible = true;
    } else {
        level = 'Fail';
        isAccessible = false;
    }

    return { ratio, level, isAccessible };
}

/**
 * Suggest a better color with sufficient contrast
 */
export function suggestAccessibleColor(
    background: string,
    preferredColor: string,
    minRatio = 4.5
): string {
    const currentRatio = getContrastRatio(preferredColor, background);
    if (currentRatio >= minRatio) return preferredColor;

    // Parse the preferred color
    const hex = preferredColor.replace('#', '');
    let r = parseInt(hex.slice(0, 2), 16);
    let g = parseInt(hex.slice(2, 4), 16);
    let b = parseInt(hex.slice(4, 6), 16);

    // Determine if we should lighten or darken
    const bgLum = getLuminance(background);
    const shouldLighten = bgLum < 0.5;

    // Adjust color until we meet the ratio
    for (let i = 0; i < 100; i++) {
        if (shouldLighten) {
            r = Math.min(255, r + 5);
            g = Math.min(255, g + 5);
            b = Math.min(255, b + 5);
        } else {
            r = Math.max(0, r - 5);
            g = Math.max(0, g - 5);
            b = Math.max(0, b - 5);
        }

        const newColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        if (getContrastRatio(newColor, background) >= minRatio) {
            return newColor;
        }
    }

    // Fallback to black or white
    return shouldLighten ? '#ffffff' : '#000000';
}

/**
 * Contrast Checker UI Component
 */
export const ContrastChecker: React.FC<ContrastCheckerProps> = ({
    foreground,
    background,
    fontSize = 16,
    showDetails = true,
}) => {
    const result = checkContrast(foreground, background, fontSize);

    const levelColors = {
        'AAA': 'text-green-400 bg-green-400/10',
        'AA': 'text-green-400 bg-green-400/10',
        'AA-Large': 'text-yellow-400 bg-yellow-400/10',
        'Fail': 'text-red-400 bg-red-400/10',
    };

    return (
        <div className="flex items-center gap-2">
            {/* Preview */}
            <div
                className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold border border-gray-600"
                style={{ backgroundColor: background, color: foreground }}
                aria-label={`Preview: ${foreground} on ${background}`}
            >
                Aa
            </div>

            {/* Badge */}
            <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[result.level]}`}
                role="status"
                aria-label={`Contrast ratio ${result.ratio.toFixed(2)}, WCAG level ${result.level}`}
            >
                {result.level}
            </span>

            {/* Details */}
            {showDetails && (
                <span className="text-xs text-gray-500">
                    {result.ratio.toFixed(2)}:1
                </span>
            )}

            {/* Warning */}
            {!result.isAccessible && (
                <span className="text-xs text-red-400">
                    ⚠️ Low contrast
                </span>
            )}
        </div>
    );
};

export default ContrastChecker;
