# i18n Development Guidelines

All new features and components in this project must support internationalization (i18n) from the start. We use `next-intl` for localization.

## 1. Do Not Use Hardcoded Strings
Never use raw strings for UI text. Use the `useTranslations` hook.

```tsx
import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("Namespace");
  return <div>{t("key")}</div>;
}
```

## 2. Translation File Structure
Keep translation files in `messages/[locale].json`. Use logical namespaces.

- **Common**: Universal strings (Save, Cancel, Back).
- **Dashboard**: Dashboard specific text.
- **Tasks**: Task-related labels and messages.
- **Workspace**: Workspace management text.
- **Auth**: Login, Sign up, and user profile text.

## 3. Dynamic Values
Use placeholders for dynamic content.

**JSON:**
```json
"welcomeUser": "Welcome back, {name}!"
```

**React:**
```tsx
t("welcomeUser", { name: user.name })
```

## 4. Enum/Field Mapping
For database values (like Status or Priority), use a dedicated `TaskFields` namespace.

**JSON:**
```json
"TaskFields": {
  "Todo": "To Do",
  "Done": "Done"
}
```

**React:**
```tsx
const status = "Done";
return <span>{tFields(status)}</span>;
```

## 5. Adding New Keys
When adding a new key:
1. Add it to `messages/en.json` (English).
2. Add the translation to `messages/pt-BR.json` (Portuguese).
3. Ensure the key names are descriptive (e.g., `titleLabel` instead of just `title`).
