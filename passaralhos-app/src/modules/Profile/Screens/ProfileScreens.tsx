import React, { useState } from 'react';
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
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// ─── Paleta de Cores ─────────────────────────────────────────────────────────
const COLORS = {
  background: '#F5F3EE',
  white: '#FFFFFF',
  darkGreen: '#1B4332',
  mediumGreen: '#2D6A4F',
  lightGreen: '#40916C',
  accentGold: '#C89A2E',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  cardBg: '#FFFFFF',
  rarePink: '#FDF2F8',
  progressBg: '#D1FAE5',
  progressFill: '#C89A2E',
  tabActive: '#1B4332',
  tabInactive: '#9CA3AF',
  danger: '#DC2626',
  inputBg: '#F9FAFB',
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
type TabId = 'record' | 'collection' | 'map' | 'ranking' | 'profile';
type BadgeVariant = 'outline' | 'gold' | 'pink';

type FieldNote = {
  id: string;
  commonName: string;
  scientificName: string;
  timeAgo: string;
  location: string;
  imageEmoji: string;
  imageBg: string;
};

type ProfileData = {
  name: string;
  title: string;
  bio: string;
  location: string;
  email: string;
  username: string;
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

// ─── Ícones SVG-style (View-based) ───────────────────────────────────────────
const EyeIcon = ({ color = COLORS.mediumGreen, size = 22 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size, height: size * 0.6, borderRadius: size * 0.3, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15, backgroundColor: color }} />
    </View>
  </View>
);

const MicIcon = ({ color = COLORS.mediumGreen, size = 22 }) => (
  <View style={{ width: size, height: size * 1.2, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.45, height: size * 0.65, borderRadius: size * 0.22, backgroundColor: color }} />
    <View style={{ width: size * 0.75, height: size * 0.35, borderBottomLeftRadius: size * 0.4, borderBottomRightRadius: size * 0.4, borderWidth: 2, borderColor: color, borderTopWidth: 0, marginTop: -2 }} />
    <View style={{ width: 2, height: size * 0.15, backgroundColor: color, marginTop: 1 }} />
    <View style={{ width: size * 0.4, height: 2, backgroundColor: color }} />
  </View>
);

const StarIcon = ({ color = COLORS.mediumGreen, size = 22 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: size * 0.9, color, lineHeight: size }}>★</Text>
  </View>
);

const LocationIcon = ({ size = 14 }) => (
  <Text style={{ fontSize: size, color: COLORS.textSecondary }}>📍</Text>
);

const ChevronIcon = () => (
  <Text style={{ fontSize: 16, color: COLORS.textMuted }}>›</Text>
);

const GearIcon = () => (
  <Text style={{ fontSize: 22, color: COLORS.darkGreen }}>⚙</Text>
);

const MenuIcon = () => (
  <View style={{ gap: 4, paddingVertical: 4 }}>
    {[0, 1, 2].map(i => (
      <View key={i} style={{ width: 22, height: 2, backgroundColor: COLORS.darkGreen, borderRadius: 1 }} />
    ))}
  </View>
);



// ─── Sub-componentes ──────────────────────────────────────────────────────────
const VerifiedBadge = () => (
  <View style={styles.verifiedBadge}>
    <Text style={{ fontSize: 11, color: COLORS.white }}>✓</Text>
  </View>
);

const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const pct = Math.min(current / total, 1);
  return (
    <View style={styles.progressOuter}>
      <View style={[styles.progressInner, { width: `${pct * 100}%` as any }]} />
    </View>
  );
};

const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <View style={styles.statCard}>
    <View style={styles.statIcon}>{icon}</View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const AchievementBadge = ({ icon, label, variant = 'outline' }: { icon: string; label: string; variant?: BadgeVariant }) => {
  const bgMap: Record<BadgeVariant, string> = { outline: COLORS.white, gold: '#FEF9C3', pink: COLORS.rarePink };
  const borderMap: Record<BadgeVariant, string> = { outline: COLORS.border, gold: '#FDE68A', pink: '#FBCFE8' };
  return (
    <View style={[styles.achievementBadge, { backgroundColor: bgMap[variant], borderColor: borderMap[variant] }]}>
      <View style={[styles.achievementIconCircle, { backgroundColor: bgMap[variant] }]}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <Text style={styles.achievementLabel}>{label}</Text>
    </View>
  );
};

const FieldNoteItem = ({ note }: { note: FieldNote }) => (
  <TouchableOpacity style={styles.fieldNoteItem} activeOpacity={0.7}>
    <View style={[styles.fieldNoteImage, { backgroundColor: note.imageBg }]}>
      <Text style={{ fontSize: 28 }}>{note.imageEmoji}</Text>
    </View>
    <View style={styles.fieldNoteContent}>
      <Text style={styles.fieldNoteName}>{note.commonName}</Text>
      <Text style={styles.fieldNoteSci}>{note.scientificName}</Text>
      <Text style={styles.fieldNoteMeta}>{note.timeAgo} • {note.location}</Text>
    </View>
    <ChevronIcon />
  </TouchableOpacity>
);

// ─── TabItem (idêntico ao da HomeScreen) ─────────────────────────────────────
function TabItem({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tabItem, active && styles.tabActive]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Icon name={icon as any} size={19} color={active ? '#065F46' : '#B0ACA8'} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Modal: Editar Perfil ─────────────────────────────────────────────────────
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

  React.useEffect(() => {
    if (visible) setForm(profile);
  }, [visible]);

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert('Campo obrigatório', 'O nome não pode estar vazio.');
      return;
    }
    onSave(form);
  };

  const Field = ({
    label,
    field,
    placeholder,
    multiline = false,
    keyboardType = 'default' as any,
  }: {
    label: string;
    field: keyof ProfileData;
    placeholder: string;
    multiline?: boolean;
    keyboardType?: any;
  }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
        value={form[field]}
        onChangeText={val => setForm(prev => ({ ...prev, [field]: val }))}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
        autoCapitalize={field === 'email' ? 'none' : 'sentences'}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={styles.modalSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.modalCloseTxt}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity onPress={handleSave} style={styles.modalSaveBtn}>
              <Text style={styles.modalSaveTxt}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.avatarPickerRow}>
              <View style={styles.avatarCircleSm}>
                <Text style={{ fontSize: 38 }}>🌿</Text>
              </View>
              <View>
                <TouchableOpacity style={styles.changePhotoBtn} activeOpacity={0.75}>
                  <Text style={styles.changePhotoTxt}>📷  Alterar foto</Text>
                </TouchableOpacity>
                <Text style={styles.changePhotoHint}>JPG ou PNG, máx. 5 MB</Text>
              </View>
            </View>

            <View style={styles.sectionDivider}>
              <Text style={styles.sectionDividerTxt}>INFORMAÇÕES PESSOAIS</Text>
            </View>
            <Field label="Nome completo *" field="name" placeholder="Seu nome completo" />
            <Field label="Nome de usuário" field="username" placeholder="@usuario" />
            <Field label="E-mail" field="email" placeholder="email@exemplo.com" keyboardType="email-address" />

            <View style={styles.sectionDivider}>
              <Text style={styles.sectionDividerTxt}>PERFIL PÚBLICO</Text>
            </View>
            <Field label="Título / Especialidade" field="title" placeholder="Ex: Ornitólogo de Elite" />
            <Field label="Sobre mim" field="bio" placeholder="Fale um pouco sobre você e suas observações..." multiline />
            <Field label="Localização" field="location" placeholder="Cidade, Estado" />

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Modal: Configurações ─────────────────────────────────────────────────────
const SettingsModal = ({
  visible,
  settings,
  onClose,
  onSave,
}: {
  visible: boolean;
  settings: SettingsData;
  onClose: () => void;
  onSave: (data: SettingsData) => void;
}) => {
  const [form, setForm] = useState<SettingsData>(settings);

  React.useEffect(() => {
    if (visible) setForm(settings);
  }, [visible]);

  const toggle = (key: keyof SettingsData) =>
    setForm(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => onSave(form);

  const ToggleRow = ({
    label, subtitle, field, icon,
  }: {
    label: string; subtitle?: string; field: keyof SettingsData; icon: string;
  }) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIconWrap}>
        <Text style={{ fontSize: 17 }}>{icon}</Text>
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
    label, icon, color = COLORS.textPrimary, onPress,
  }: {
    label: string; icon: string; color?: string; onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.actionRowItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.toggleIconWrap, { marginRight: 12 }]}>
        <Text style={{ fontSize: 17 }}>{icon}</Text>
      </View>
      <Text style={[styles.actionRowLabel, { color }]}>{label}</Text>
      <ChevronIcon />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.modalCloseTxt}>Fechar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Configurações</Text>
            <TouchableOpacity onPress={handleSave} style={styles.modalSaveBtn}>
              <Text style={styles.modalSaveTxt}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>

            <View style={styles.sectionDivider}>
              <Text style={styles.sectionDividerTxt}>NOTIFICAÇÕES</Text>
            </View>
            <View style={styles.settingsCard}>
              <ToggleRow icon="🔔" label="Notificações push" subtitle="Alertas de atividade e novidades" field="notifications" />
              <View style={styles.settingsDivider} />
              <ToggleRow icon="🔊" label="Alertas sonoros" subtitle="Sons ao identificar espécies" field="soundAlerts" />
              <View style={styles.settingsDivider} />
              <ToggleRow icon="📧" label="Atualizações por e-mail" subtitle="Resumos semanais e dicas" field="emailUpdates" />
            </View>

            <View style={styles.sectionDivider}>
              <Text style={styles.sectionDividerTxt}>PRIVACIDADE</Text>
            </View>
            <View style={styles.settingsCard}>
              <ToggleRow icon="🌍" label="Perfil público" subtitle="Outros usuários podem ver seu perfil" field="publicProfile" />
              <View style={styles.settingsDivider} />
              <ToggleRow icon="📍" label="Rastreamento de localização" subtitle="Salvar localização das observações" field="locationTracking" />
            </View>

            <View style={styles.sectionDivider}>
              <Text style={styles.sectionDividerTxt}>APLICATIVO</Text>
            </View>
            <View style={styles.settingsCard}>
              <ToggleRow icon="💾" label="Salvamento automático" subtitle="Salvar gravações automaticamente" field="autoSave" />
              <View style={styles.settingsDivider} />
              <ToggleRow icon="🌙" label="Modo escuro" subtitle="Tema escuro para uso noturno" field="darkMode" />
            </View>

            <View style={styles.sectionDivider}>
              <Text style={styles.sectionDividerTxt}>CONTA</Text>
            </View>
            <View style={styles.settingsCard}>
              <ActionRow
                icon="🔒"
                label="Alterar senha"
                onPress={() => Alert.alert('Alterar senha', 'Um e-mail de redefinição será enviado para seu endereço cadastrado.')}
              />
              <View style={styles.settingsDivider} />
              <ActionRow
                icon="📤"
                label="Exportar meus dados"
                onPress={() => Alert.alert('Exportar dados', 'Seus dados serão enviados por e-mail em até 24 horas.')}
              />
              <View style={styles.settingsDivider} />
              <ActionRow
                icon="🗑️"
                label="Excluir conta"
                color={COLORS.danger}
                onPress={() =>
                  Alert.alert(
                    'Excluir conta',
                    'Tem certeza? Todos os seus dados serão apagados permanentemente e não poderão ser recuperados.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Excluir', style: 'destructive', onPress: () => {} },
                    ]
                  )
                }
              />
            </View>

            <Text style={styles.versionTxt}>Field Journal v2.4.1 • © 2025 Anthropic</Text>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Dados Mock ───────────────────────────────────────────────────────────────
const FIELD_NOTES: FieldNote[] = [
  { id: '1', commonName: 'Tangará-dançarino', scientificName: 'Chiroxiphia caudata', timeAgo: 'VISTO HÁ 2 HORAS', location: 'PARQUE IBIRAPUERA', imageEmoji: '🦜', imageBg: '#D1FAE5' },
  { id: '2', commonName: 'Arapaçu-de-garganta-branca', scientificName: 'Xiphocolaptes albicollis', timeAgo: 'VISTO ONTEM', location: 'SERRA DA CANTAREIRA', imageEmoji: '🐦', imageBg: '#FEF3C7' },
  { id: '3', commonName: 'Saíra-sete-cores', scientificName: 'Tangara seledon', timeAgo: 'VISTO HÁ 3 DIAS', location: 'PARQUE ESTADUAL', imageEmoji: '🌈', imageBg: '#EDE9FE' },
];

// ─── Tela Principal ───────────────────────────────────────────────────────────
interface ProfileScreenProps {
  onNavigateToHome?: () => void;
  onNavigateToCollection?: () => void;
  onNavigateToMap?: () => void;
  onNavigateToRanking?: () => void;
}

export default function ProfileScreen({
  onNavigateToHome,
  onNavigateToCollection,
  onNavigateToMap,
  onNavigateToRanking,
}: ProfileScreenProps) {
  const [editVisible, setEditVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    name: 'Ricardo Silveira',
    title: 'ORNITÓLOGO DE ELITE',
    bio: 'Naturalista apaixonado pela Mata Atlântica. Em busca do uirapuru e documentando a biodiversidade urbana.',
    location: 'São Paulo, Brasil',
    email: 'ricardo.silveira@email.com',
    username: '@ricardosilv',
  });

  const [settings, setSettings] = useState<SettingsData>({
    notifications: true,
    soundAlerts: true,
    locationTracking: true,
    autoSave: false,
    darkMode: false,
    publicProfile: true,
    emailUpdates: false,
  });

  const handleSaveProfile = (data: ProfileData) => {
    setProfile(data);
    setEditVisible(false);
    Alert.alert('✅ Perfil atualizado!', 'Suas informações foram salvas com sucesso.');
  };

  const handleSaveSettings = (data: SettingsData) => {
    setSettings(data);
    setSettingsVisible(false);
    Alert.alert('✅ Configurações salvas!', 'Suas preferências foram atualizadas.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn}>
          <MenuIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Field Journal</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setSettingsVisible(true)}>
          <GearIcon />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Avatar + Nome */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={{ fontSize: 52 }}>🌿</Text>
            </View>
            <VerifiedBadge />
          </View>
          <Text style={styles.userName}>{profile.name}</Text>
          <Text style={styles.userTitle}>{profile.title}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.btnPrimary}
              activeOpacity={0.82}
              onPress={() => setEditVisible(true)}
            >
              <Text style={{ fontSize: 13, color: COLORS.white }}>✏️</Text>
              <Text style={styles.btnPrimaryText}> Editar Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSecondary}
              activeOpacity={0.82}
              onPress={() => setSettingsVisible(true)}
            >
              <Text style={styles.btnSecondaryText}>Configurações</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sobre */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Sobre</Text>
          <Text style={styles.aboutText}>{profile.bio}</Text>
          <View style={styles.locationRow}>
            <LocationIcon />
            <Text style={styles.locationText}>{profile.location}</Text>
          </View>
          <View style={styles.treeSilhouette}>
            <Text style={{ fontSize: 70, opacity: 0.07 }}>🌲</Text>
          </View>
        </View>

        {/* Nível de Campo */}
        <View style={styles.levelCard}>
          <Text style={styles.levelLabel}>Nível de Campo</Text>
          <View style={styles.levelRow}>
            <Text style={styles.levelNumber}>24</Text>
            <Text style={styles.levelName}>Experiente</Text>
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>PROGRESSO</Text>
            <Text style={styles.progressXP}>XP: 12.450 / 15.000</Text>
          </View>
          <ProgressBar current={12450} total={15000} />
          <Text style={styles.xpRemaining}>2.550 XP para o Nível 25</Text>
        </View>

        {/* Estatísticas */}
        <View style={styles.statsRow}>
          <StatCard icon={<EyeIcon />} value="142" label="ESPÉCIES" />
          <StatCard icon={<MicIcon />} value="843" label="GRAVAÇÕES" />
          <StatCard icon={<StarIcon />} value="12" label="RAROS" />
        </View>

        {/* Conquistas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Conquistas Recentes</Text>
          <TouchableOpacity><Text style={styles.seeAll}>VER TUDO</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsScroll}>
          <AchievementBadge icon="✨" label="FIRST SIGHTING" variant="outline" />
          <AchievementBadge icon="🌅" label={`DAWN CHORUS\nMASTER`} variant="gold" />
          <AchievementBadge icon="💎" label="RARE FINDER" variant="pink" />
          <AchievementBadge icon="🦅" label="EAGLE EYE" variant="outline" />
          <AchievementBadge icon="🎵" label="SONG MASTER" variant="gold" />
        </ScrollView>

        {/* Notas de Campo */}
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

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Bottom Navigation Bar (idêntico à HomeScreen) ── */}
      <View style={styles.bottomTab}>
        <TabItem icon="mic"   label="Gravar"  onPress={onNavigateToHome} />
        <TabItem icon="grid"  label="Coleção" onPress={onNavigateToCollection} />
        <TabItem icon="map"   label="Mapa"    onPress={onNavigateToMap} />
        <TabItem icon="award" label="Ranking" onPress={onNavigateToRanking} />
        <TabItem icon="user"  label="Perfil"  active />
      </View>

      {/* ── Modais ── */}
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
      />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.background },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.darkGreen, letterSpacing: 0.3, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  avatarSection: { alignItems: 'center', marginBottom: 20, paddingTop: 8 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.progressBg, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.mediumGreen, overflow: 'hidden' },
  verifiedBadge: { position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.accentGold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.white },
  userName: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  userTitle: { fontSize: 11, fontWeight: '700', color: COLORS.accentGold, letterSpacing: 2, marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 10 },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.darkGreen, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24 },
  btnPrimaryText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  btnSecondary: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, borderWidth: 1.5, borderColor: COLORS.textPrimary },
  btnSecondaryText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },

  card: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 14, position: 'relative', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, fontWeight: '500' },
  aboutText: { fontSize: 15, color: COLORS.textPrimary, lineHeight: 22, marginBottom: 10 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  treeSilhouette: { position: 'absolute', right: -10, bottom: -10 },

  levelCard: { backgroundColor: COLORS.darkGreen, borderRadius: 16, padding: 18, marginBottom: 14, shadowColor: COLORS.darkGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  levelLabel: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  levelRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 14 },
  levelNumber: { fontSize: 42, fontWeight: '800', color: COLORS.white, lineHeight: 50 },
  levelName: { fontSize: 18, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 1 },
  progressXP: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  progressOuter: { height: 8, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressInner: { height: '100%', backgroundColor: COLORS.progressFill, borderRadius: 4 },
  xpRemaining: { fontSize: 11, color: 'rgba(255,255,255,0.55)', textAlign: 'right', fontStyle: 'italic' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  statIcon: { marginBottom: 6 },
  statValue: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, lineHeight: 30 },
  statLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1, marginTop: 2 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  seeAll: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700', letterSpacing: 0.5 },

  achievementsScroll: { paddingRight: 16, gap: 10, marginBottom: 4 },
  achievementBadge: { width: 95, alignItems: 'center', borderRadius: 14, borderWidth: 1.5, padding: 12, gap: 8 },
  achievementIconCircle: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  achievementLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.5, textAlign: 'center' },

  fieldNoteItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  fieldNoteImage: { width: 58, height: 58, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fieldNoteContent: { flex: 1 },
  fieldNoteName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  fieldNoteSci: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic', marginBottom: 3 },
  fieldNoteMeta: { fontSize: 9, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 2 },

  // ── Bottom Navigation Bar (idêntico à HomeScreen) ──
  bottomTab: {
    height: 82,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDE3D8',
    backgroundColor: 'rgba(246,249,242,0.97)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.select({ ios: 0, android: 4 }),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 3,
  },
  tabActive: { backgroundColor: '#D4F0E3' },
  tabLabel: { fontSize: 10, color: '#B0ACA8', fontWeight: '500', letterSpacing: 0.3 },
  tabLabelActive: { color: '#065F46' },

  // ── Modal base ──
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.92, paddingTop: 8 },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalCloseBtn: { minWidth: 70 },
  modalCloseTxt: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  modalSaveBtn: { backgroundColor: COLORS.darkGreen, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, minWidth: 70, alignItems: 'center' },
  modalSaveTxt: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  modalScroll: { paddingHorizontal: 20, paddingTop: 4 },

  // ── Edit Profile ──
  avatarPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 20 },
  avatarCircleSm: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.progressBg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.mediumGreen },
  changePhotoBtn: { borderWidth: 1.5, borderColor: COLORS.darkGreen, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 6 },
  changePhotoTxt: { fontSize: 13, fontWeight: '600', color: COLORS.darkGreen },
  changePhotoHint: { fontSize: 11, color: COLORS.textMuted },

  sectionDivider: { paddingTop: 18, paddingBottom: 8 },
  sectionDividerTxt: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2 },

  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  fieldInput: { backgroundColor: COLORS.inputBg, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: COLORS.textPrimary },
  fieldInputMulti: { height: 90, paddingTop: 11 },

  // ── Settings ──
  settingsCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 4, overflow: 'hidden' },
  settingsDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  toggleIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.progressBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  toggleSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  actionRowItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  actionRowLabel: { flex: 1, fontSize: 14, fontWeight: '600' },

  versionTxt: { textAlign: 'center', fontSize: 11, color: COLORS.textMuted, marginTop: 24 },
});