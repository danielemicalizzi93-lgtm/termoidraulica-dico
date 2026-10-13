import { Image } from "expo-image";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth/auth-context";
import { Button, TextField } from "@/src/components/ui";
import { makeStyles, radius, spacing } from "@/src/theme";

const HERO =
  "https://images.unsplash.com/photo-1754666104638-d814f4baaf88?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxodmFjJTIwdG9vbHMlMjBmbGF0JTIwbGF5fGVufDB8fHx8MTc5MTkyMzEzMXww&ixlib=rb-4.1.0&q=85";

export default function Login() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { signInEmail, signUpEmail, signInGoogle } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!email.trim() || !password.trim() || (mode === "register" && !name.trim())) {
      setError("Compila tutti i campi");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") await signInEmail(email.trim(), password);
      else await signUpEmail(name.trim(), email.trim(), password);
    } catch (e: any) {
      setError(e?.message || "Errore. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInGoogle();
    } catch (e: any) {
      setError(e?.message || "Accesso Google non riuscito");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Image source={{ uri: HERO }} style={styles.hero} contentFit="cover" />
      <View style={styles.heroOverlay} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandWrap}>
            <Text style={styles.brandTitle}>DiCo Pro</Text>
            <Text style={styles.brandSub}>Dichiarazioni di Conformità e Rispondenza{"\n"}DM 37/2008 — termoidraulica, gas, clima</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.tabs}>
              <Pressable
                testID="tab-login"
                style={[styles.tab, mode === "login" && styles.tabActive]}
                onPress={() => setMode("login")}
              >
                <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>Accedi</Text>
              </Pressable>
              <Pressable
                testID="tab-register"
                style={[styles.tab, mode === "register" && styles.tabActive]}
                onPress={() => setMode("register")}
              >
                <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>Registrati</Text>
              </Pressable>
            </View>

            {mode === "register" ? (
              <TextField
                testID="name-input"
                label="Nome e cognome"
                value={name}
                onChangeText={setName}
                placeholder="Mario Rossi"
                autoCapitalize="words"
              />
            ) : null}
            <TextField
              testID="email-input"
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="nome@esempio.it"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextField
              testID="password-input"
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            {error ? (
              <Text testID="auth-error" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <Button
              testID="submit-button"
              title={mode === "login" ? "Accedi" : "Crea account"}
              onPress={submit}
              loading={loading}
            />

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>oppure</Text>
              <View style={styles.line} />
            </View>

            <Button
              testID="google-button"
              title="Continua con Google"
              variant="ghost"
              onPress={google}
              loading={googleLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  hero: { position: "absolute", top: 0, left: 0, right: 0, height: 320 },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: "rgba(28,28,26,0.35)",
  },
  scroll: { flexGrow: 1, justifyContent: "flex-end", padding: spacing.lg },
  brandWrap: { paddingHorizontal: spacing.sm, marginBottom: spacing.lg },
  brandTitle: { fontSize: 34, fontWeight: "800", color: colors.onBrandPrimary },
  brandSub: { fontSize: 13, color: colors.onBrandPrimary, opacity: 0.92, marginTop: spacing.xs, lineHeight: 19 },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    padding: spacing.xs,
    marginBottom: spacing.sm,
  },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: "center", borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.surfaceSecondary },
  tabText: { fontSize: 15, fontWeight: "600", color: colors.muted },
  tabTextActive: { color: colors.onSurface },
  error: { color: colors.error, fontSize: 13 },
  divider: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginVertical: spacing.xs },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.muted, fontSize: 12 },
}));
