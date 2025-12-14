# Quick Start: Unified UI Kit

## What's New

A comprehensive cross-platform UI kit has been added to ensure visual consistency across iOS and Android.

## Quick Usage

### 1. Import Components

```tsx
import { Button, Card, Input, UIText, Badge, Avatar } from '@/components/ui';
```

### 2. Use Design System Hook

```tsx
import { useDesignSystem } from '@/hooks/use-design-system';

function MyComponent() {
  const { colors, spacing, typography } = useDesignSystem();
  
  return (
    <View style={{ 
      backgroundColor: colors.surface,
      padding: spacing.base 
    }}>
      <Text style={{ 
        color: colors.text,
        fontSize: typography.fontSize.lg 
      }}>
        Hello
      </Text>
    </View>
  );
}
```

### 3. Example: Simple Form

```tsx
import { View } from 'react-native';
import { Button, Card, Input, UIText } from '@/components/ui';
import { spacing } from '@/constants/designTokens';

function LoginForm() {
  return (
    <Card variant="elevated" padding="xl">
      <UIText variant="h2" style={{ marginBottom: spacing.base }}>
        Login
      </UIText>
      <Input
        label="Email"
        placeholder="Enter email"
        style={{ marginBottom: spacing.md }}
      />
      <Button variant="primary" size="lg" fullWidth>
        Sign In
      </Button>
    </Card>
  );
}
```

## Key Features

✅ **Design Tokens**: Colors, typography, spacing, shadows  
✅ **8 UI Components**: Button, Card, Input, Badge, Text, Avatar, Divider, Container  
✅ **Theme Support**: Automatic light/dark mode  
✅ **Platform Agnostic**: Consistent on iOS and Android  
✅ **Type Safe**: Full TypeScript support  

## Files Created

- `constants/designTokens.ts` - All design tokens
- `hooks/use-design-system.ts` - Design system hook
- `components/ui/*` - UI components
- `utils/styleUtils.ts` - Style utilities
- `docs/UI_KIT.md` - Full documentation

## Next Steps

1. Read the full documentation: `docs/UI_KIT.md`
2. Check the example component: `components/ui/Example.tsx`
3. Start migrating existing components to use the UI kit

## Migration Tip

Replace hardcoded values with design tokens:

```tsx
// ❌ Before
<View style={{ padding: 16, backgroundColor: '#007AFF' }}>

// ✅ After
const { colors, spacing } = useDesignSystem();
<View style={{ padding: spacing.base, backgroundColor: colors.primary }}>
```


