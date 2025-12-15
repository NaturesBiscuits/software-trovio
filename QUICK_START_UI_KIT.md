# Quick Start: UI Kit

Get started with the unified UI kit in 5 minutes.

## Installation

The UI kit is already set up. Just import components:

```tsx
import { Button, Card, Input, UIText, Badge, Avatar } from '@/components/ui';
```

## Essential Components

### Button

```tsx
<Button variant="primary" size="md" onPress={handlePress}>
  Click Me
</Button>

// Variants: primary, secondary, outline, ghost, danger
// Sizes: sm, md, lg
```

### Input

```tsx
<Input
  label="Email"
  placeholder="Enter your email"
  error={errors.email}
  leftIcon={<Icon name="mail" />}
/>
```

### Card

```tsx
<Card variant="elevated" padding="lg">
  <UIText variant="h2">Title</UIText>
  <Text>Content goes here</Text>
</Card>

// Variants: default, elevated, outlined
```

### Text (UIText)

```tsx
<UIText variant="h1" weight="bold" color="primary">
  Heading
</UIText>

// Variants: h1, h2, h3, h4, body, bodySmall, caption, label, button
```

### Badge

```tsx
<Badge variant="success" size="md">
  Active
</Badge>

// Variants: default, primary, success, warning, error, info
```

### Avatar

```tsx
<Avatar
  source={{ uri: 'https://...' }}
  size="md"
  variant="circular"
/>

// Or with initials
<Avatar label="JD" size="lg" />
```

## Design Tokens

### Colors

```tsx
import { useDesignSystem } from '@/hooks/use-design-system';

const { colors } = useDesignSystem();

// Use: colors.primary, colors.success, colors.error, colors.text, etc.
```

### Spacing

```tsx
import { spacing } from '@/constants/designTokens';

// Use: spacing.xs, spacing.sm, spacing.base, spacing.lg, spacing.xl, etc.
```

## Complete Example

```tsx
import { View } from 'react-native';
import { Button, Card, Input, UIText } from '@/components/ui';
import { spacing } from '@/constants/designTokens';

function LoginScreen() {
  return (
    <View style={{ padding: spacing.base }}>
      <Card variant="elevated" padding="xl">
        <UIText variant="h2" style={{ marginBottom: spacing.lg }}>
          Welcome Back
        </UIText>
        
        <Input
          label="Email"
          placeholder="Enter your email"
          keyboardType="email-address"
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
    </View>
  );
}
```

## Common Patterns

### Form Layout

```tsx
<Card variant="elevated" padding="xl">
  <UIText variant="h3" style={{ marginBottom: spacing.lg }}>Form Title</UIText>
  
  <Input label="Field 1" style={{ marginBottom: spacing.md }} />
  <Input label="Field 2" style={{ marginBottom: spacing.md }} />
  
  <Button variant="primary" size="lg" fullWidth>
    Submit
  </Button>
</Card>
```

### Profile Card

```tsx
<Card variant="elevated" padding="lg">
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Avatar source={{ uri: user.avatar }} size="lg" />
    <View style={{ marginLeft: spacing.base, flex: 1 }}>
      <UIText variant="h4">{user.name}</UIText>
      <UIText variant="bodySmall" color="tertiary">{user.email}</UIText>
    </View>
    <Badge variant="success">Active</Badge>
  </View>
</Card>
```

## Key Points

✅ **Always use UI components** instead of custom styled components  
✅ **Use design tokens** (colors, spacing) instead of hardcoded values  
✅ **Components adapt automatically** to light/dark mode  
✅ **Platform differences handled** automatically (shadows, fonts, etc.)

## Next Steps

- See [docs/UI_KIT.md](./docs/UI_KIT.md) for complete documentation
- Check [components/ui/README.md](./components/ui/README.md) for component details
- Explore components in `components/ui/` directory
