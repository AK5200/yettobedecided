# Typography System

## Heading Font Pattern

### Primary Pattern (Used for all headings)
- **Main text**: Inter, Regular (font-weight: 400)
- **Emphasized words**: Libre Baskerville Italic
- **Font size**: 56px (for hero), adjust as needed for other headings

### Example Usage
```tsx
<h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '56px', fontWeight: 400 }}>
  The <span className="italic font-normal" style={{ fontFamily: 'var(--font-libre-baskerville), serif' }}>simplest</span> way to collect feedback
</h1>
```

### Font Stack
- **Inter**: Main heading text
- **Libre Baskerville**: Italic for emphasized key words
- **Helvetica Neue**: Alternative for main text (fallback)

### CTA Buttons
- **Font**: Inter, Regular
- **Size**: text-xl (or as specified)

### Eyebrow Text
- **Font**: System default, semibold
- **Size**: text-xs
- **Color**: text-gray-600

## Implementation Notes
- Use Inter for all main heading text
- Use Libre Baskerville Italic to highlight key words/phrases
- Maintain consistent font sizes across similar heading levels
- Keep the italic serif font for emphasis only, not for entire headings
