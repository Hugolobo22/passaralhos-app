import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../../../store/authStore";
import type { AuthStackParamList } from "../../../navigation/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Login">;

// ─── Design tokens (extraídos das telas do Passaralhos) ───────
const C = {
  bg: "#EDEAE0",
  bgCard: "#F5F2EA",
  forest: "#1A4D2E",
  forestDeep: "#0F2E1A",
  forestLight: "#2D6B42",
  yellow: "#E8B84B",
  white: "#FFFFFF",
  inputBg: "#E4E0D5",
  inputBorder: "#CCC8BC",
  muted: "#6B7B68",
  mutedLight: "#9AAA97",
  error: "#B03A2E",
  errorBg: "#F9EDEC",
  separator: "#D4D0C4",
};

// ─── Componente de campo reutilizável ─────────────────────────
interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  hasError?: boolean;
  rightElement?: React.ReactNode;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  hasError = false,
  rightElement,
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={st.fieldGroup}>
      <Text style={st.fieldLabel}>{label}</Text>
      <View
        style={[
          st.inputWrap,
          focused && st.inputWrapFocused,
          hasError && st.inputWrapError,
        ]}
      >
        <TextInput
          style={st.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.mutedLight}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightElement}
      </View>
    </View>
  );
}

// ─── Tela de Login ────────────────────────────────────────────
export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    clearError();
    if (!email.trim() || !password) {
      shake();
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password);
    } catch {
      shake();
    }
  };

  const hasError = !!error && !isLoading;

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <KeyboardAvoidingView
        style={st.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={st.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero / Identidade visual ── */}
          <View style={st.hero}>
            <View style={st.logoBox}>
              <Text style={st.logoEmoji}>📖</Text>
            </View>

            <Text style={st.appName}>Passaralhos</Text>
            <Text style={st.appSub}>DIGITAL FIELD GUIDE</Text>

            <View style={st.titleDivider} />

            <Text style={st.tagline}>Ouça a natureza. Descubra o mundo.</Text>
            <Text style={st.aiPowered}>✦ AI-POWERED OBSERVATION ✦</Text>
          </View>

          {/* ── Formulário ── */}
          <Animated.View
            style={[st.card, { transform: [{ translateX: shakeAnim }] }]}
          >
            <Text style={st.cardTitle}>Entrar na conta</Text>

            {/* Banner de erro da API */}
            {error ? (
              <View style={st.errorBanner}>
                <Text style={st.errorText}>{error}</Text>
              </View>
            ) : null}

            <Field
              label="E-MAIL"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              keyboardType="email-address"
              hasError={hasError}
            />

            <Field
              label="SENHA"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              hasError={hasError}
              rightElement={
                <TouchableOpacity
                  style={st.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={st.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              }
            />

            <TouchableOpacity style={st.forgotRow} activeOpacity={0.7}>
              <Text style={st.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            {/* Botão principal */}
            <TouchableOpacity
              style={[st.btnPrimary, isLoading && st.btnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator color={C.white} size="small" />
              ) : (
                <Text style={st.btnPrimaryText}>Entrar →</Text>
              )}
            </TouchableOpacity>

            {/* Divisor */}
            <View style={st.divider}>
              <View style={st.dividerLine} />
              <Text style={st.dividerText}>ou continue com</Text>
              <View style={st.dividerLine} />
            </View>

            {/* Google (sem funcionalidade no protótipo) */}
            <TouchableOpacity style={st.btnOutline} activeOpacity={0.8}>
              <Text style={st.btnOutlineText}>Continuar com Google</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Rodapé ── */}
          <View style={st.footer}>
            <Text style={st.footerText}>Não tem uma conta? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Register")}
              activeOpacity={0.7}
            >
              <Text style={st.footerLink}>Criar conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 80 : 52,
    paddingBottom: 48,
    justifyContent: "center",
  },

  // Hero
  hero: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: C.forest,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logoEmoji: { fontSize: 28 },
  appName: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 38,
    fontStyle: "italic",
    fontWeight: "700",
    color: C.forest,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  appSub: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 3.5,
    color: C.muted,
    marginBottom: 12,
  },
  titleDivider: {
    width: 36,
    height: 2,
    backgroundColor: C.yellow,
    borderRadius: 2,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 15,
    color: C.forestDeep,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  aiPowered: {
    fontSize: 9,
    letterSpacing: 2.5,
    color: C.mutedLight,
    fontWeight: "600",
  },

  // Card
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 22,
    fontWeight: "700",
    color: C.forestDeep,
    marginBottom: 22,
  },

  // Erro
  errorBanner: {
    backgroundColor: C.errorBg,
    borderLeftWidth: 3,
    borderLeftColor: C.error,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  errorText: { fontSize: 13, color: C.error, lineHeight: 18 },

  // Campo
  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    color: C.muted,
    marginBottom: 7,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputWrapFocused: {
    borderColor: C.forest,
    backgroundColor: C.white,
  },
  inputWrapError: { borderColor: C.error },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 15,
    color: C.forestDeep,
  },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  eyeIcon: { fontSize: 16 },

  // Esqueci
  forgotRow: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 24,
    paddingVertical: 4,
  },
  forgotText: { fontSize: 13, color: C.forest, fontWeight: "500" },

  // Botão primário
  btnPrimary: {
    backgroundColor: C.forest,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: {
    color: C.white,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  // Divisor
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.separator },
  dividerText: { fontSize: 11, color: C.mutedLight, fontWeight: "500" },

  // Botão outline
  btnOutline: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: C.bgCard,
  },
  btnOutlineText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.forestDeep,
    letterSpacing: 0.2,
  },

  // Rodapé
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  footerText: { fontSize: 14, color: C.muted },
  footerLink: { fontSize: 14, fontWeight: "700", color: C.forest },
});
