import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import {
  getMyProfile,
  updateMyProfile,
  deleteMyProfile,
  type UserProfileResponse,
} from "../services/profileService";

const { height } = Dimensions.get("window");

const COLORS = {
  background: "#F5F3EE",
  white: "#FFFFFF",
  darkGreen: "#1B4332",
  mediumGreen: "#2D6A4F",
  lightGreen: "#40916C",
  accentGold: "#C89A2E",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  cardBg: "#FFFFFF",
  rarePink: "#FDF2F8",
  progressBg: "#D1FAE5",
  progressFill: "#C89A2E",
  danger: "#DC2626",
  inputBg: "#F9FAFB",
};

type BadgeVariant = "outline" | "gold" | "pink";

type ProfileData = {
  name: string;
  title: string;
  bio: string;
  location: string;
  email: string;
  username: string;
  level: number;
  levelName: string;
  currentXp: number;
  nextLevelXp: number;
  stats: {
    species: number;
    recordings: number;
    rareFinds: number;
  };
};

type SettingsData = {
  notifications: boolean;
  soundAlerts: boolean;
  locationTracking: boolean;
  autoSave: boolean;
  darkMode: boolean;
  publicProfile: boolean;
  emailUpdates: boolean;
};

type FieldNote = {
  id: string;
  commonName: string;
  scientificName: string;
  timeAgo: string;
  location: string;
  iconName: keyof typeof Icon.glyphMap;
  imageBg: string;
};

type Achievement = {
  id: string;
  iconName: keyof typeof Icon.glyphMap;
  label: string;
  variant: BadgeVariant;
};

const EMPTY_PROFILE: ProfileData = {
  name: "",
  title: "OBSERVADOR INICIANTE",
  bio: "Nenhuma bio cadastrada ainda.",
  location: "Localização não informada",
  email: "",
  username: "",
  level: 1,
  levelName: "Iniciante",
  currentXp: 0,
  nextLevelXp: 1000,
  stats: {
    species: 0,
    recordings: 0,
    rareFinds: 0,
  },
};

const FIELD_NOTES: FieldNote[] = [
  {
    id: "1",
    commonName: "Nenhuma espécie registrada",
    scientificName: "Registre uma ave para começar",
    timeAgo: "AGUARDANDO",
    location: "PIU",
    iconName: "feather",
    imageBg: "#D1FAE5",
  },
];

const ACHIEVEMENTS: Achievement[] = [
  { id: "1", iconName: "eye", label: "FIRST SIGHTING", variant: "outline" },
  { id: "2", iconName: "sunrise", label: "DAWN CHORUS\nMASTER", variant: "gold" },
  { id: "3", iconName: "award", label: "RARE FINDER", variant: "pink" },
  { id: "4", iconName: "target", label: "EAGLE EYE", variant: "outline" },
  { id: "5", iconName: "music", label: "SONG MASTER", variant: "gold" },
];

function getLevelName(level: number) {
  if (level <= 1) return "Iniciante";
  if (level <= 5) return "Observador";
  if (level <= 10) return "Experiente";
  if (level <= 20) return "Especialista";
  return "Mestre de Campo";
}

function mapApiProfileToScreen(data: UserProfileResponse): ProfileData {
  const level = data.level || 1;
  const nextLevelXp = level * 1000;

  return {
    name: data.name || "Usuário PIU",
    title: data.title || "OBSERVADOR INICIANTE",
    bio: data.bio || "Nenhuma bio cadastrada ainda.",
    location: data.location || "Localização não informada",
    email: data.email || "",
    username: data.username || "",
    level,
    levelName: getLevelName(level),
    currentXp: data.xp || 0,
    nextLevelXp,
    stats: {
      species: data.species_count || 0,
      recordings: data.recordings_count || 0,
      rareFinds: data.rare_count || 0,
    },
  };
}

const VerifiedBadge = () => (
  <View style={styles.verifiedBadge}>
    <Icon name="check" size={13} color={COLORS.white} />
  </View>
);

const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const pct = Math.min(current / total, 1);

  return (
    <View style={styles.progressOuter}>
      <View style={[styles.progressInner, { width: `${pct * 100}%` }]} />
    </View>
  );
};

const StatCard = ({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Icon.glyphMap;
  value: string;
  label: string;
}) => (
  <View style={styles.statCard}>
    <View style={styles.statIcon}>
      <Icon name={icon} size={24} color={COLORS.mediumGreen} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const AchievementBadge = ({
  iconName,
  label,
  variant = "outline",
}: {
  iconName: keyof typeof Icon.glyphMap;
  label: string;
  variant?: BadgeVariant;
}) => {
  const bgMap: Record<BadgeVariant, string> = {
    outline: COLORS.white,
    gold: "#FEF9C3",
    pink: COLORS.rarePink,
  };

  const borderMap: Record<BadgeVariant, string> = {
    outline: COLORS.border,
    gold: "#FDE68A",
    pink: "#FBCFE8",
  };

  return (
    <View
      style={[
        styles.achievementBadge,
        {
          backgroundColor: bgMap[variant],
          borderColor: borderMap[variant],
        },
      ]}
    >
      <View style={[styles.achievementIconCircle, { backgroundColor: bgMap[variant] }]}>
        <Icon name={iconName} size={24} color={COLORS.darkGreen} />
      </View>
      <Text style={styles.achievementLabel}>{label}</Text>
    </View>
  );
};

const FieldNoteItem = ({ note }: { note: FieldNote }) => (
  <TouchableOpacity style={styles.fieldNoteItem} activeOpacity={0.7}>
    <View style={[styles.fieldNoteImage, { backgroundColor: note.imageBg }]}>
      <Icon name={note.iconName} size={26} color={COLORS.darkGreen} />
    </View>

    <View style={styles.fieldNoteContent}>
      <Text style={styles.fieldNoteName}>{note.commonName}</Text>
      <Text style={styles.fieldNoteSci}>{note.scientificName}</Text>
      <Text style={styles.fieldNoteMeta}>
        {note.timeAgo} • {note.location}
      </Text>
    </View>

    <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
  </TouchableOpacity>
);

const EditProfileModal = ({
  visible,
  profile,
  onClose,
  onSave,
}: {
  visible: boolean;
  profile: ProfileData;
  onClose: () => void;
  onSave: (data: ProfileData) => void;
}) => {
  const [form, setForm] = useState<ProfileData>(profile);

  useEffect(() => {
    if (visible) setForm(profile);
  }, [visible, profile]);

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert("Campo obrigatório", "O nome não pode estar vazio.");
      return;
    }

    onSave(form);
  };

  const Field = ({
    label,
    field,
    placeholder,
    multiline = false,
    keyboardType = "default",
    editable = true,
  }: {
    label: string;
    field: keyof ProfileData;
    placeholder: string;
    multiline?: boolean;
    keyboardType?: "default" | "email-address";
    editable?: boolean;
  }) => {
    const value = String(form[field] ?? "");

    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={[
            styles.fieldInput,
            multiline && styles.fieldInputMulti,
            !editable && styles.fieldInputDisabled,
          ]}
          value={value}
          editable={editable}
          onChangeText={(val) =>
            setForm((prev) => ({
              ...prev,
              [field]: val,
            }))
          }
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlignVertical={multiline ? "top" : "center"}
          keyboardType={keyboardType}
          autoCapitalize={field === "email" ? "none" : "sentences"}
        />
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <View style={styles.modalSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseTxt}>Cancelar</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Editar Perfil</Text>

            <TouchableOpacity onPress={handleSave} style={styles.modalSaveBtn}>
              <Text style={styles.modalSaveTxt}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.avatarPickerRow}>
              <View style={styles.avatarCircleSm}>
                <Icon name="user" size={34} color={COLORS.darkGreen} />
              </View>

              <View>
                <TouchableOpacity style={styles.changePhotoBtn} activeOpacity={0.75}>
                  <Icon name="camera" size={14} color={COLORS.darkGreen} />
                  <Text style={styles.changePhotoTxt}>Alterar foto</Text>
                </TouchableOpacity>

                <Text style={styles.changePhotoHint}>JPG ou PNG, máx. 5 MB</Text>
              </View>
            </View>

            <View style={styles.sectionDivider}>
              <Text style={styles.sectionDividerTxt}>INFORMAÇÕES PESSOAIS</Text>
            </View>

            <Field label="Nome completo *" field="name" placeholder="Seu nome completo" />
            <Field label="Nome de usuário" field="username" placeholder="@usuario" />
            <Field
              label="E-mail"
              field="email"
              placeholder="email@exemplo.com"
              keyboardType="email-address"
              editable={false}
            />

            <View style={styles.sectionDivider}>
              <Text style={styles.sectionDividerTxt}>PERFIL PÚBLICO</Text>
            </View>

            <Field
              label="Título / Especialidade"
              field="title"
              placeholder="Ex: Observador de aves"
              editable={false}
            />
            <Field
              label="Sobre mim"
              field="bio"
              placeholder="Fale um pouco sobre você e suas observações..."
              multiline
            />
            <Field label="Localização" field="location" placeholder="Cidade, Estado" />

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const SettingsModal = ({
  visible,
  settings,
  onClose,
  onSave,
  onDeleteAccount,
}: {
  visible: boolean;
  settings: SettingsData;
  onClose: () => void;
  onSave: (data: SettingsData) => void;
  onDeleteAccount: () => void;
}) => {
  const [form, setForm] = useState<SettingsData>(settings);

  useEffect(() => {
    if (visible) setForm(settings);
  }, [visible, settings]);

  const toggle = (key: keyof SettingsData) =>
    setForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

  const ToggleRow = ({
    label,
    subtitle,
    field,
    iconName,
  }: {
    label: string;
    subtitle?: string;
    field: keyof SettingsData;
    iconName: keyof typeof Icon.glyphMap;
  }) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIconWrap}>
        <Icon name={iconName} size={17} color={COLORS.darkGreen} />
      </View>

      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {subtitle && <Text style={styles.toggleSubtitle}>{subtitle}</Text>}
      </View>

      <Switch
        value={form[field]}
        onValueChange={() => toggle(field)}
        trackColor={{ false: COLORS.border, true: COLORS.lightGreen }}
        thumbColor={form[field] ? COLORS.darkGreen : COLORS.white}
        ios_backgroundColor={COLORS.border}
      />
    </View>
  );

  const ActionRow = ({
    label,
    iconName,
    color = COLORS.textPrimary,
    onPress,
  }: {
    label: string;
    iconName: keyof typeof Icon.glyphMap;
    color?: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.actionRowItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.toggleIconWrap, { marginRight: 12 }]}>
        <Icon name={iconName} size={17} color={color} />
      </View>

      <Text style={[styles.actionRowLabel, { color }]}>{label}</Text>
      <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseTxt}>Fechar</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Configurações</Text>

            <TouchableOpacity onPress={() => onSave(form)} style={styles.modalSaveBtn}>
              <Text style={styles.modalSaveTxt}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionDividerTxt}>NOTIFICAÇÕES</Text>
            </View>

            <View style={styles.settingsCard}>
              <ToggleRow iconName="bell" label="Notificações push" subtitle="Alertas de atividade e novidades" field="notifications" />
              <View style={styles.settingsDivider} />
              <ToggleRow iconName="volume-2" label="Alertas sonoros" subtitle="Sons ao identificar espécies" field="soundAlerts" />
              <View style={styles.settingsDivider} />
              <ToggleRow iconName="mail" label="Atualizações por e-mail" subtitle="Resumos semanais e dicas" field="emailUpdates" />
            </View>

            <View style={styles.sectionDivider}>
              <Text style={styles.sectionDividerTxt}>PRIVACIDADE</Text>
            </View>

            <View style={styles.settingsCard}>
              <ToggleRow iconName="globe" label="Perfil público" subtitle="Outros usuários podem ver seu perfil" field="publicProfile" />
              <View style={styles.settingsDivider} />
              <ToggleRow iconName="map-pin" label="Rastreamento de localização" subtitle="Salvar localização das observações" field="locationTracking" />
            </View>

            <View style={styles.sectionDivider}>
              <Text style={styles.sectionDividerTxt}>APLICATIVO</Text>
            </View>

            <View style={styles.settingsCard}>
              <ToggleRow iconName="save" label="Salvamento automático" subtitle="Salvar gravações automaticamente" field="autoSave" />
              <View style={styles.settingsDivider} />
              <ToggleRow iconName="moon" label="Modo escuro" subtitle="Tema escuro para uso noturno" field="darkMode" />
            </View>

            <View style={styles.sectionDivider}>
              <Text style={styles.sectionDividerTxt}>CONTA</Text>
            </View>

            <View style={styles.settingsCard}>
              <ActionRow
                iconName="lock"
                label="Alterar senha"
                onPress={() =>
                  Alert.alert(
                    "Alterar senha",
                    "Um e-mail de redefinição será enviado para seu endereço cadastrado.",
                  )
                }
              />
              <View style={styles.settingsDivider} />
              <ActionRow
                iconName="upload"
                label="Exportar meus dados"
                onPress={() =>
                  Alert.alert(
                    "Exportar dados",
                    "Seus dados serão enviados por e-mail em até 24 horas.",
                  )
                }
              />
              <View style={styles.settingsDivider} />
              <ActionRow
                iconName="trash-2"
                label="Excluir conta"
                color={COLORS.danger}
                onPress={onDeleteAccount}
              />
            </View>

            <Text style={styles.versionTxt}>PIU v1.0.0 • © 2026</Text>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default function ProfileScreen() {
  const [editVisible, setEditVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);

  const [settings, setSettings] = useState<SettingsData>({
    notifications: true,
    soundAlerts: true,
    locationTracking: true,
    autoSave: false,
    darkMode: false,
    publicProfile: true,
    emailUpdates: false,
  });

  const loadProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);
      const data = await getMyProfile();
      setProfile(mapApiProfileToScreen(data));
    } catch (error) {
      console.log("[PROFILE_LOAD_ERROR]", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const handleSaveProfile = async (data: ProfileData) => {
    try {
      const updated = await updateMyProfile({
        name: data.name,
        username: data.username,
        bio: data.bio,
        location: data.location,
      });

      setProfile(mapApiProfileToScreen(updated));
      setEditVisible(false);

      Alert.alert("Perfil atualizado!", "Suas informações foram salvas.");
    } catch (error) {
      console.log("[PROFILE_UPDATE_ERROR]", error);
      Alert.alert("Erro", "Não foi possível atualizar o perfil.");
    }
  };

  const handleSaveSettings = (data: SettingsData) => {
    setSettings(data);
    setSettingsVisible(false);
    Alert.alert("Configurações salvas!", "Suas preferências foram atualizadas.");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Excluir conta",
      "Tem certeza? Seu perfil será desativado e você não conseguirá acessar a conta.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMyProfile();
              setSettingsVisible(false);
              Alert.alert("Conta excluída", "Sua conta foi desativada.");
            } catch (error) {
              console.log("[PROFILE_DELETE_ERROR]", error);
              Alert.alert("Erro", "Não foi possível excluir a conta.");
            }
          },
        },
      ],
    );
  };

  const remainingXp = Math.max(profile.nextLevelXp - profile.currentXp, 0);

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.darkGreen} size="large" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <View style={styles.headerBtn}>
          <Icon name="menu" size={22} color={COLORS.darkGreen} />
        </View>

        <Text style={styles.headerTitle}>Perfil</Text>

        <TouchableOpacity style={styles.headerBtn} onPress={() => setSettingsVisible(true)}>
          <Icon name="settings" size={22} color={COLORS.darkGreen} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Icon name="user" size={42} color={COLORS.darkGreen} />
            </View>
            <VerifiedBadge />
          </View>

          <Text style={styles.userName}>{profile.name}</Text>
          <Text style={styles.userTitle}>{profile.title}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnPrimary} activeOpacity={0.82} onPress={() => setEditVisible(true)}>
              <Icon name="edit-2" size={14} color={COLORS.white} />
              <Text style={styles.btnPrimaryText}>Editar Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSecondary} activeOpacity={0.82} onPress={() => setSettingsVisible(true)}>
              <Icon name="settings" size={14} color={COLORS.textPrimary} />
              <Text style={styles.btnSecondaryText}>Configurações</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Sobre</Text>
          <Text style={styles.aboutText}>{profile.bio}</Text>

          <View style={styles.locationRow}>
            <Icon name="map-pin" size={14} color={COLORS.textSecondary} />
            <Text style={styles.locationText}>{profile.location}</Text>
          </View>

          <View style={styles.treeSilhouette}>
            <Icon name="feather" size={72} color="rgba(27,67,50,0.08)" />
          </View>
        </View>

        <View style={styles.levelCard}>
          <Text style={styles.levelLabel}>Nível de Campo</Text>

          <View style={styles.levelRow}>
            <Text style={styles.levelNumber}>{profile.level}</Text>
            <Text style={styles.levelName}>{profile.levelName}</Text>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>PROGRESSO</Text>
            <Text style={styles.progressXP}>
              XP: {profile.currentXp.toLocaleString("pt-BR")} /{" "}
              {profile.nextLevelXp.toLocaleString("pt-BR")}
            </Text>
          </View>

          <ProgressBar current={profile.currentXp} total={profile.nextLevelXp} />

          <Text style={styles.xpRemaining}>
            {remainingXp.toLocaleString("pt-BR")} XP para o Nível {profile.level + 1}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="eye" value={String(profile.stats.species)} label="ESPÉCIES" />
          <StatCard icon="mic" value={String(profile.stats.recordings)} label="GRAVAÇÕES" />
          <StatCard icon="star" value={String(profile.stats.rareFinds)} label="RAROS" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Conquistas Recentes</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>VER TUDO</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsScroll}>
          {ACHIEVEMENTS.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              iconName={achievement.iconName}
              label={achievement.label}
              variant={achievement.variant}
            />
          ))}
        </ScrollView>

        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Últimas Notas de Campo</Text>
        </View>

        <View style={styles.card}>
          {FIELD_NOTES.map((note, idx) => (
            <View key={note.id}>
              <FieldNoteItem note={note} />
              {idx < FIELD_NOTES.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>

      <EditProfileModal
        visible={editVisible}
        profile={profile}
        onClose={() => setEditVisible(false)}
        onSave={handleSaveProfile}
      />

      <SettingsModal
        visible={settingsVisible}
        settings={settings}
        onClose={() => setSettingsVisible(false)}
        onSave={handleSaveSettings}
        onDeleteAccount={handleDeleteAccount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.darkGreen,
    letterSpacing: 0.3,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },

  avatarSection: { alignItems: "center", marginBottom: 20, paddingTop: 8 },
  avatarWrapper: { position: "relative", marginBottom: 12 },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.progressBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.mediumGreen,
    overflow: "hidden",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.accentGold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
  },
  userTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.accentGold,
    letterSpacing: 2,
    marginBottom: 16,
  },

  actionRow: { flexDirection: "row", gap: 10 },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.darkGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  btnPrimaryText: { color: COLORS.white, fontSize: 14, fontWeight: "600" },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.textPrimary,
  },
  btnSecondaryText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "600" },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, fontWeight: "500" },
  aboutText: { fontSize: 15, color: COLORS.textPrimary, lineHeight: 22, marginBottom: 10 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  treeSilhouette: { position: "absolute", right: -10, bottom: -10 },

  levelCard: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  levelLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  levelRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 14 },
  levelNumber: { fontSize: 42, fontWeight: "800", color: COLORS.white, lineHeight: 50 },
  levelName: { fontSize: 18, color: "rgba(255,255,255,0.85)", fontWeight: "500" },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "700",
    letterSpacing: 1,
  },
  progressXP: { fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: "600" },
  progressOuter: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressInner: { height: "100%", backgroundColor: COLORS.progressFill, borderRadius: 4 },
  xpRemaining: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    textAlign: "right",
    fontStyle: "italic",
  },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statIcon: { marginBottom: 6 },
  statValue: { fontSize: 26, fontWeight: "800", color: COLORS.textPrimary, lineHeight: 30 },
  statLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  seeAll: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  achievementsScroll: { paddingRight: 16, gap: 10, marginBottom: 4 },
  achievementBadge: {
    width: 95,
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 8,
  },
  achievementIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    textAlign: "center",
  },

  fieldNoteItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  fieldNoteImage: {
    width: 58,
    height: 58,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldNoteContent: { flex: 1 },
  fieldNoteName: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 2 },
  fieldNoteSci: { fontSize: 12, color: COLORS.textSecondary, fontStyle: "italic", marginBottom: 3 },
  fieldNoteMeta: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 2 },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.92,
    paddingTop: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCloseBtn: { minWidth: 70 },
  modalCloseTxt: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "500" },
  modalTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  modalSaveBtn: {
    backgroundColor: COLORS.darkGreen,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 70,
    alignItems: "center",
  },
  modalSaveTxt: { fontSize: 13, fontWeight: "700", color: COLORS.white },
  modalScroll: { paddingHorizontal: 20, paddingTop: 4 },

  avatarPickerRow: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 20 },
  avatarCircleSm: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.progressBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.mediumGreen,
  },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1.5,
    borderColor: COLORS.darkGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 6,
  },
  changePhotoTxt: { fontSize: 13, fontWeight: "600", color: COLORS.darkGreen },
  changePhotoHint: { fontSize: 11, color: COLORS.textMuted },

  sectionDivider: { paddingTop: 18, paddingBottom: 8 },
  sectionDividerTxt: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
  },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 6 },
  fieldInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  fieldInputDisabled: {
    opacity: 0.65,
  },
  fieldInputMulti: { height: 90, paddingTop: 11 },

  settingsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 4,
    overflow: "hidden",
  },
  settingsDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13 },
  toggleIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.progressBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  toggleSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  actionRowItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13 },
  actionRowLabel: { flex: 1, fontSize: 14, fontWeight: "600" },

  versionTxt: {
    textAlign: "center",
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 24,
  },
});