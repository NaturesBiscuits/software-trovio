# UI Kit Components

This directory contains reusable UI components that ensure visual consistency across iOS and Android.

## Available Components

- **Button**: Interactive button with multiple variants and sizes
- **Card**: Container component with elevation and variants
- **Input**: Text input with label, error, and icon support
- **Badge**: Status indicator with color variants
- **Text**: Typography component with semantic variants
- **Avatar**: User avatar with image or initials
- **Divider**: Horizontal or vertical divider line
- **Container**: Layout container with consistent padding

## Quick Start

```tsx
import { Button, Card, Input, UIText } from '@/components/ui';

function MyComponent() {
  return (
    <Card variant="elevated" padding="lg">
      <UIText variant="h2">Welcome</UIText>
      <Input label="Name" placeholder="Enter your name" />
      <Button variant="primary" onPress={handlePress}>
        Submit
      </Button>
    </Card>
  );
}
```

## Design System Integration

All components automatically use the design system:
- Colors adapt to light/dark mode
- Typography uses consistent font sizes and weights
- Spacing follows the 4px-based system
- Shadows use platform-appropriate styles

See [UI_KIT.md](../../docs/UI_KIT.md) for complete documentation.


