# Unified Cross-Platform UI Kit

This document describes the unified UI kit that guarantees visual consistency across iOS and Android platforms.

## Overview

The UI kit provides:
- **Design Tokens**: Typography, colors, spacing, shadows, and more
- **Reusable Components**: Button, Card, Input, Badge, Avatar, and more
- **Platform-Agnostic Styling**: Consistent appearance on iOS and Android
- **Theme Support**: Light and dark mode support

## Design Tokens

### Colors

The color system provides semantic colors that adapt to light/dark mode:

```typescript
import { useDesignSystem } from '@/hooks/use-design-system';

const { colors } = useDesignSystem();

// Available colors:
// - primary, primaryDark, primaryLight
// - success, warning, error, info
// - background, surface, surfaceElevated
// - text, textSecondary, textTertiary, textPlaceholder
// - border, borderLight, divider
// - overlay, overlayLight
// - online, offline
```

### Typography

Consistent typography system with predefined sizes and weights:

```typescript
import { useDesignSystem } from '@/hooks/use-design-system';

const { typography } = useDesignSystem();

// Font sizes: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl
// Font weights: regular, medium, semibold, bold
// Line heights: Automatically matched to font sizes
```

### Spacing

4px-based spacing system for consistent layouts:

```typescript
import { spacing } from '@/constants/designTokens';

// Available spacing: xs (4), sm (8), md (12), base (16), lg (20), 
// xl (24), 2xl (32), 3xl (40), 4xl (48), 5xl (64)
```

### Shadows

Platform-specific shadows that look consistent:

```typescript
import { shadows } from '@/constants/designTokens';

// Available: none, sm, base, md, lg, xl
// Automatically uses elevation on Android and shadow on iOS
```

## UI Components

### Button

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" onPress={handlePress}>
  Click Me
</Button>

// Variants: primary, secondary, outline, ghost, danger
// Sizes: sm, md, lg
// Props: loading, disabled, fullWidth
```

### Card

```tsx
import { Card } from '@/components/ui';

<Card variant="elevated" padding="base">
  <Text>Card Content</Text>
</Card>

// Variants: default, elevated, outlined
// Padding: Any spacing key (xs, sm, md, base, lg, etc.)
```

### Input

```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  placeholder="Enter your email"
  error={errors.email}
  helperText="We'll never share your email"
  leftIcon={<Icon name="mail" />}
/>
```

### Badge

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success" size="md">
  Active
</Badge>

// Variants: default, primary, success, warning, error, info
// Sizes: sm, md, lg
```

### Text

```tsx
import { UIText } from '@/components/ui';

<UIText variant="h1" weight="bold" color="primary">
  Heading
</UIText>

// Variants: h1, h2, h3, h4, body, bodySmall, caption, label, button
// Weights: regular, medium, semibold, bold
// Colors: primary, secondary, tertiary, error, success, warning
```

### Avatar

```tsx
import { Avatar } from '@/components/ui';

<Avatar
  source={{ uri: 'https://...' }}
  size="md"
  variant="circular"
/>

// Sizes: xs, sm, md, lg, xl
// Variants: circular, rounded
// Can also use label prop for initials
```

### Divider

```tsx
import { Divider } from '@/components/ui';

<Divider orientation="horizontal" spacing="base" />
```

### Container

```tsx
import { Container } from '@/components/ui';

<Container padding="base" paddingHorizontal="xl">
  <Text>Content</Text>
</Container>
```

## Usage Examples

### Example 1: Form with Inputs

```tsx
import { View } from 'react-native';
import { Button, Input, Card, UIText } from '@/components/ui';
import { spacing } from '@/constants/designTokens';

function LoginForm() {
  return (
    <Card variant="elevated" padding="xl">
      <UIText variant="h2" style={{ marginBottom: spacing.base }}>
        Login
      </UIText>
      
      <Input
        label="Email"
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ marginBottom: spacing.md }}
      />
      
      <Input
        label="Password"
        placeholder="Enter your password"
        secureTextEntry
        style={{ marginBottom: spacing.lg }}
      />
      
      <Button variant="primary" size="lg" fullWidth>
        Sign In
      </Button>
    </Card>
  );
}
```

### Example 2: Profile Card

```tsx
import { View } from 'react-native';
import { Card, Avatar, UIText, Badge, Divider, Button } from '@/components/ui';
import { spacing } from '@/constants/designTokens';

function ProfileCard({ user }) {
  return (
    <Card variant="elevated" padding="lg">
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
        <Avatar source={{ uri: user.avatar }} size="lg" />
        <View style={{ marginLeft: spacing.base, flex: 1 }}>
          <UIText variant="h4">{user.name}</UIText>
          <UIText variant="bodySmall" color="tertiary">{user.email}</UIText>
        </View>
        <Badge variant="success">Active</Badge>
      </View>
      
      <Divider spacing="md" />
      
      <Button variant="outline" size="md" fullWidth>
        Edit Profile
      </Button>
    </Card>
  );
}
```

### Example 3: Using Design System Directly

```tsx
import { View, StyleSheet } from 'react-native';
import { useDesignSystem } from '@/hooks/use-design-system';

function CustomComponent() {
  const { colors, spacing, typography, borderRadius, shadows } = useDesignSystem();
  
  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.surface,
        padding: spacing.base,
        borderRadius: borderRadius.md,
        ...shadows.md,
      }
    ]}>
      <Text style={{
        color: colors.text,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
      }}>
        Custom Content
      </Text>
    </View>
  );
}
```

## Style Utilities

Helper functions for common styling patterns:

```typescript
import { padding, margin, flex, createTypographyStyle } from '@/utils/styleUtils';

// Padding
const styles = padding('base'); // All sides
const styles = padding(undefined, 'xl', 'md'); // Horizontal and vertical

// Margin
const styles = margin('lg'); // All sides
const styles = margin(undefined, 'base', 'sm'); // Horizontal and vertical

// Flexbox
const styles = { ...flex.row, ...flex.center, ...flex.spaceBetween };

// Typography
const textStyle = createTypographyStyle('lg', 'semibold');
```

## Migration Guide

### Migrating Existing Components

1. **Replace hardcoded colors** with design tokens:
   ```tsx
   // Before
   backgroundColor: '#007AFF'
   
   // After
   backgroundColor: colors.primary
   ```

2. **Replace hardcoded spacing** with spacing tokens:
   ```tsx
   // Before
   padding: 16
   
   // After
   padding: spacing.base
   ```

3. **Use UI components** instead of custom styled components:
   ```tsx
   // Before
   <TouchableOpacity style={customButtonStyle}>
     <Text style={customTextStyle}>Click</Text>
   </TouchableOpacity>
   
   // After
   <Button variant="primary">Click</Button>
   ```

4. **Use UIText** for consistent typography:
   ```tsx
   // Before
   <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Title</Text>
   
   // After
   <UIText variant="h2">Title</UIText>
   ```

## Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Use UI components** for common patterns (buttons, cards, inputs)
3. **Leverage the theme system** - components automatically adapt to light/dark mode
4. **Use spacing tokens** for consistent layouts
5. **Test on both platforms** - the UI kit ensures consistency, but always verify

## Platform-Specific Considerations

The UI kit handles platform differences automatically:
- **Shadows**: Uses `elevation` on Android and `shadow*` properties on iOS
- **Fonts**: Uses system fonts appropriate for each platform
- **Colors**: Adapts to platform conventions while maintaining brand consistency

## Extending the UI Kit

To add new components:

1. Create the component in `components/ui/`
2. Use design tokens from `useDesignSystem()` hook
3. Export from `components/ui/index.ts`
4. Document in this file

## Support

For questions or issues with the UI kit, refer to:
- Design tokens: `constants/designTokens.ts`
- Hooks: `hooks/use-design-system.ts`
- Components: `components/ui/`


