# Language Management System

This document explains the comprehensive language management system implemented in the Trovio app.

## Features

✅ **Instant Updates**: Language changes update immediately across all pages and components  
✅ **Persistence**: Language preference persists across app restarts and navigation  
✅ **User Profiles**: Language syncs with Supabase user profiles  
✅ **Global State**: Centralized language state management with React Context  
✅ **Type Safety**: Full TypeScript support with proper type definitions

## Architecture

### 1. LanguageContext (`context/LanguageContext.tsx`)

- **Global State Management**: Centralized language state using React Context
- **AsyncStorage Persistence**: Language preference saved locally
- **Supabase Integration**: Syncs language with user profile
- **Instant Updates**: Uses i18next for immediate UI updates

### 2. LanguageProvider

- Wraps the entire app in `app/_layout.tsx`
- Provides language context to all components
- Handles language loading and persistence

### 3. Custom Hooks

- `useLanguage()`: Access current language and change function
- `useProfileLanguage()`: Load language from user profile on login

## Usage

### Basic Language Switching

```tsx
import { useLanguage } from "../context/LanguageContext";

function MyComponent() {
  const { currentLanguage, changeLanguage } = useLanguage();

  const handleLanguageChange = async (language: string) => {
    await changeLanguage(language);
  };

  return (
    <TouchableOpacity onPress={() => handleLanguageChange("az")}>
      <Text>Switch to Azerbaijani</Text>
    </TouchableOpacity>
  );
}
```

### Using Translations

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();

  return <Text>{t("Hello World")}</Text>;
}
```

### Loading Profile Language on Login

```tsx
import { useProfileLanguage } from "../context/LanguageContext";

function LoginComponent() {
  const { loadProfileLanguage } = useProfileLanguage();

  useEffect(() => {
    // This is automatically called when user logs in
    loadProfileLanguage();
  }, []);
}
```

## Database Schema

Add this column to your `profiles` table in Supabase:

```sql
ALTER TABLE profiles ADD COLUMN language VARCHAR(2) DEFAULT 'en';
```

## Supported Languages

Currently supported languages are defined in `LanguageContext.tsx`:

- `en`: English
- `az`: Azerbaijani

To add more languages:

1. Add language files to `locales/` directory
2. Update `languageResources` in `services/i18next.js`
3. Add language code to `SUPPORTED_LANGUAGES` array in `LanguageContext.tsx`

## File Structure

```
context/
├── LanguageContext.tsx    # Main language management
├── AuthContext.tsx        # Auth with language integration
services/
├── i18next.js            # i18next configuration
├── languagesList.json    # Language metadata
locales/
├── en.json              # English translations
├── az.json              # Azerbaijani translations
```

## Best Practices

### 1. Always Use the Context

```tsx
// ✅ Good
const { changeLanguage } = useLanguage();
await changeLanguage("az");

// ❌ Bad - Don't use i18next directly
i18next.changeLanguage("az");
```

### 2. Handle Loading States

```tsx
const { isLoading } = useLanguage();

if (isLoading) {
  return <LoadingSpinner />;
}
```

### 3. Error Handling

The system includes built-in error handling:

- Falls back to default language on errors
- Logs errors to console for debugging
- Gracefully handles network issues

### 4. Performance

- Language changes are instant (no re-renders needed)
- AsyncStorage operations are non-blocking
- Supabase updates happen in background

## Implementation Details

### Language Persistence Flow

1. **App Start**: Load language from AsyncStorage
2. **User Login**: Load language from user profile
3. **Language Change**: Update i18next → AsyncStorage → Supabase profile
4. **App Restart**: Restore from AsyncStorage

### Error Recovery

- If AsyncStorage fails: Use system/default language
- If Supabase fails: Continue with local storage
- If i18next fails: Fallback to English

### Type Safety

All language operations are fully typed:

- Language codes are validated against `SUPPORTED_LANGUAGES`
- Context provides proper TypeScript types
- Error handling includes type checking

## Testing

To test the language system:

1. **Change Language**: Use the language button in auth screens
2. **Navigate**: Switch between login/signup - language persists
3. **Restart App**: Language preference is maintained
4. **Login**: User's profile language loads automatically
5. **Cross-Device**: Login on different device - language syncs

## Troubleshooting

### Common Issues

1. **Language not persisting**: Check AsyncStorage permissions
2. **Profile not syncing**: Verify Supabase connection and user authentication
3. **Translations not updating**: Ensure i18next is properly configured
4. **TypeScript errors**: Check import paths and type definitions

### Debug Mode

Enable debug logging by adding to your app:

```tsx
// In development only
if (__DEV__) {
  console.log("Current language:", currentLanguage);
}
```

## Future Enhancements

- [ ] Add more languages (Spanish, French, etc.)
- [ ] Implement RTL language support
- [ ] Add language-specific date/time formatting
- [ ] Create language-specific number formatting
- [ ] Add language detection from device settings
