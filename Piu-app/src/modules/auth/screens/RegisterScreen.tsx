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

type Nav = NativeStackNavigationProp<AuthStackParamList, "Register">;

// ─── Design tokens (idênticos ao LoginScreen) ─────────────────
const C = {
  bg: "#EDEAE0",
  bgCard: "#F5F2EA",
  forest: "#1A4D2E",
  forestDeep: "#0F2E1A",
  yellow: "#E8B84B",
  white: "#FFFFFF",
  inputBg: "#E4E0D5",
  inputBorder: "#CCC8BC",
  muted: "#6B7B68",
  mutedLight: "#9AAA97",
  error: "#B03A2E",
  errorBg: "#F9EDEC",
  success: "#1A4D2E",
  successBg: "#E8F0EA",
  separator: "#D4D0C4",
};

// ─── Indicador de força de senha ──────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const score = [hasLength, hasNumber, hasLetter].filter(Boolean).length;

  const labels = ["", "Fraca", "Razoável", "Forte"];
  const colors = ["", "#B03A2E", "#C07A1A", C.forest];
  const barColors = ["#E4E0D5", "#E4E0D5", "#E4E0D5"];

  for (let i = 0; i < score; i++) barColors[i] = colors[score];

  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: "row", gap: 5 }}>
        {barColors.map((color, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              backgroundColor: color,
            }}
          />
        ))}
      </View>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: colors[score],
          marginTop: 5,
          fontFamily: "sans-serif",
        }}
      >
        {labels[score]}
      </Text>
    </View>
  );
}

// ─── Componente de campo reutilizável ─────────────────────────
interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "words" | "sentences";
  hasError?: boolean;
  rightElement?: React.ReactNode;
  bottomElement?: React.ReactNode;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  hasError = false,
  rightElement,
  bottomElement,
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
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightElement}
      </View>
      {bottomElement}
    </View>
  );
}

// ─── Tela de Registro ─────────────────────────────────────────
export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

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

  const handleRegister = async () => {
    clearError();
    setLocalError("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setLocalError("Preencha todos os campos.");
      shake();
      return;
    }
    if (password.length < 8) {
      setLocalError("A senha deve ter ao menos 8 caracteres.");
      shake();
      return;
    }
    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      setLocalError("A senha deve conter letras e números.");
      shake();
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("As senhas não coincidem.");
      shake();
      return;
    }

    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      // RootNavigator detecta isAuthenticated e redireciona automaticamente
    } catch {
      shake();
    }
  };

  const displayError = localError || error;
  const hasError = !!displayError && !isLoading;
  const confirmMismatch = !!confirmPassword && confirmPassword !== password;

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
          {/* ── Cabeçalho compacto ── */}
          <View style={st.hero}>
            <View style={st.logoBox}>
              <Text style={st.logoEmoji}>📖</Text>
            </View>
            <Text style={st.appName}>PIU</Text>
            <Text style={st.appSub}>DIGITAL FIELD GUIDE</Text>
            <View style={st.titleDivider} />
            <Text style={st.tagline}>Comece sua coleção de aves</Text>
          </View>

          {/* ── Formulário ── */}
          <Animated.View
            style={[st.card, { transform: [{ translateX: shakeAnim }] }]}
          >
            <Text style={st.cardTitle}>Criar conta</Text>

            {/* Progresso em steps — visual como nas telas de onboarding */}
            <View style={st.steps}>
              <View style={st.stepDot} />
              <View style={[st.stepLine, st.stepLineInactive]} />
              <View style={[st.stepDot, st.stepDotInactive]} />
              <View style={[st.stepLine, st.stepLineInactive]} />
              <View style={[st.stepDot, st.stepDotInactive]} />
            </View>
            <Text style={st.stepLabel}>PASSO 01 DE 01 — DADOS DA CONTA</Text>

            {/* Banner de erro */}
            {displayError ? (
              <View style={st.errorBanner}>
                <Text style={st.errorText}>{displayError}</Text>
              </View>
            ) : null}

            {/* Nome */}
            <Field
              label="NOME COMPLETO"
              value={name}
              onChangeText={setName}
              placeholder="João Silva"
              autoCapitalize="words"
              hasError={hasError && !name.trim()}
            />

            {/* E-mail */}
            <Field
              label="E-MAIL"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              keyboardType="email-address"
              hasError={hasError && !email.trim()}
            />

            {/* Senha com indicador de força */}
            <Field
              label="SENHA"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry={!showPassword}
              hasError={hasError && !password}
              rightElement={
                <TouchableOpacity
                  style={st.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={st.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              }
              bottomElement={<PasswordStrength password={password} />}
            />

            {/* Confirmar senha */}
            <Field
              label="CONFIRMAR SENHA"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repita a senha"
              secureTextEntry={!showPassword}
              hasError={confirmMismatch}
            />
            {confirmMismatch && (
              <Text style={st.inlineError}>As senhas não coincidem.</Text>
            )}

            {/* Botão principal */}
            <TouchableOpacity
              style={[st.btnPrimary, isLoading && st.btnDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator color={C.white} size="small" />
              ) : (
                <Text style={st.btnPrimaryText}>Criar conta →</Text>
              )}
            </TouchableOpacity>

            {/* Termos */}
            <Text style={st.terms}>
              Ao criar sua conta você concorda com os{" "}
              <Text style={st.termsLink}>Termos de Uso</Text> e a{" "}
              <Text style={st.termsLink}>Política de Privacidade</Text>.
            </Text>
          </Animated.View>

          {/* ── Rodapé ── */}
          <View style={st.footer}>
            <Text style={st.footerText}>Já tem uma conta? </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={st.footerLink}>Fazer login</Text>
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
    paddingTop: Platform.OS === "ios" ? 72 : 48,
    paddingBottom: 48,
    justifyContent: "center",
  },

  // Hero
  hero: { alignItems: "center", marginBottom: 28 },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: C.forest,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoEmoji: { fontSize: 26 },
  appName: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 34,
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
    marginBottom: 10,
    fontFamily: "sans-serif",
  },
  titleDivider: {
    width: 36,
    height: 2,
    backgroundColor: C.yellow,
    borderRadius: 2,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 14,
    color: C.forestDeep,
    fontFamily: "sans-serif",
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
    marginBottom: 14,
  },

  // Steps (inspirado no onboarding "STEP 01 OF 03" das telas)
  steps: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.forest,
  },
  stepDotInactive: {
    backgroundColor: C.inputBorder,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: C.forest,
  },
  stepLineInactive: {
    backgroundColor: C.inputBorder,
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: C.muted,
    marginBottom: 20,
    fontFamily: "sans-serif",
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
  inlineError: {
    fontSize: 11,
    color: C.error,
    marginTop: -10,
    marginBottom: 12,
    fontFamily: "sans-serif",
  },

  // Campo
  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    color: C.muted,
    marginBottom: 7,
    fontFamily: "sans-serif",
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

  // Botão primário
  btnPrimary: {
    backgroundColor: C.forest,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: {
    color: C.white,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
    fontFamily: "sans-serif",
  },

  // Termos
  terms: {
    fontSize: 11,
    color: C.mutedLight,
    textAlign: "center",
    lineHeight: 17,
    marginTop: 16,
    fontFamily: "sans-serif",
  },
  termsLink: { color: C.forest, fontWeight: "600" },

  // Rodapé
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: { fontSize: 14, color: C.muted, fontFamily: "sans-serif" },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
    color: C.forest,
    fontFamily: "sans-serif",
  },
});
