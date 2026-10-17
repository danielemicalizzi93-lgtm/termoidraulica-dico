import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { ActivityIndicator, LogBox, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { LockScreen } from "@/src/components/lock-screen";
import { LockProvider, useLock } from "@/src/local/lock-context";
import { queryClient } from "@/src/query-client";
import { useTheme } from "@/src/theme";

LogBox.ignoreAllLogs(true);

function RootGate() {
  const { ready, locked } = useLock();
  const { colors } = useTheme();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  if (locked) {
    return <LockScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="wizard/dico" options={{ presentation: "card" }} />
      <Stack.Screen name="wizard/diri" options={{ presentation: "card" }} />
      <Stack.Screen name="document/[id]" />
      <Stack.Screen name="schema" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="client/[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="installation/[id]" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <KeyboardProvider>
              <LockProvider>
                <RootGate />
              </LockProvider>
            </KeyboardProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
