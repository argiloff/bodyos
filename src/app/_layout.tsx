import { Stack } from "expo-router";
import { DataProvider } from "../db/DataProvider";
import { useThemePalette } from "../theme";

export default function RootLayout() {
  const theme = useThemePalette();

  return (
    <DataProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: "Profil" }} />
        <Stack.Screen
          name="import"
          options={{ title: "Import & Zurücksetzen" }}
        />
        <Stack.Screen name="settings" options={{ title: "Einstellungen" }} />
        <Stack.Screen name="plan/[id]" options={{ title: "Plan-Details" }} />
        <Stack.Screen name="cook/[recipeId]" options={{ title: "Kochmodus" }} />
      </Stack>
    </DataProvider>
  );
}
