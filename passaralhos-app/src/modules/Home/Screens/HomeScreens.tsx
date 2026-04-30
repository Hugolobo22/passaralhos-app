import React, { useRef, useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Waveform bars original data (mesmo formato)
const BARS: { height: number; dark?: boolean; opacity?: number }[] = [
  { height: 18, opacity: 0.35 },
  { height: 28, opacity: 0.5 },
  { height: 42, opacity: 0.65 },
  { height: 60, dark: false },
  { height: 76, dark: true },
  { height: 52, dark: true },
  { height: 90, dark: true },
  { height: 64, dark: true },
  { height: 48, dark: true },
  { height: 60, dark: false },
  { height: 30, opacity: 0.55 },
  { height: 20, opacity: 0.38 },
];

// ========== TIPO DE AVISTAMENTO (compatível com ColectionScreen) ==========
type Category = 'Passerine' | 'Raptor' | 'Other';
interface Sighting {
  id: string;
  commonName: string;
  scientificName: string;
  date: string;       // ISO date YYYY-MM-DD
  timestamp: number;
  location: string;
  category: Category;
  recordingUri?: string; // URI do áudio gravado (opcional)
}

const STORAGE_KEY = '@BirdJournal:sightings';

// Lista de aves comuns para identificação simulada
const BIRD_SPECIES: { common: string; scientific: string; category: Category }[] = [
  { common: 'Sabiá-laranjeira', scientific: 'Turdus rufiventris', category: 'Passerine' },
  { common: 'Bem-te-vi', scientific: 'Pitangus sulphuratus', category: 'Passerine' },
  { common: 'Gavião-carijó', scientific: 'Rupornis magnirostris', category: 'Raptor' },
  { common: 'Beija-flor-tesoura', scientific: 'Eupetomena macroura', category: 'Other' },
  { common: 'João-de-barro', scientific: 'Furnarius rufus', category: 'Passerine' },
  { common: 'Coruja-buraqueira', scientific: 'Athene cunicularia', category: 'Raptor' },
  { common: 'Tucano-toco', scientific: 'Ramphastos toco', category: 'Other' },
  { common: 'Pica-pau-amarelo', scientific: 'Celeus flavus', category: 'Other' },
];

// Simula identificação (escolhe aleatoriamente uma ave)
const identifyBirdMock = () => {
  const randomIndex = Math.floor(Math.random() * BIRD_SPECIES.length);
  return BIRD_SPECIES[randomIndex];
};

// Formata data para YYYY-MM-DD
const getCurrentDate = () => new Date().toISOString().split('T')[0];

// ========== COMPONENTE PRINCIPAL ==========
interface HomeScreenProps {
  onNavigateToCollection?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToMap?: () => void;
  onNavigateToRanking?: () => void;
}

export default function HomeScreen({
  onNavigateToCollection,
  onNavigateToProfile,
  onNavigateToMap,
  onNavigateToRanking,
}: HomeScreenProps) {
  // Estados de gravação
  const [isListening, setIsListening] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [isProcessing, setIsProcessing] = useState(false);

  // Localização
  const [locationText, setLocationText] = useState('Obtendo localização...');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Animações
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // ========== Configuração inicial ==========
  useEffect(() => {
    // Configurar modo de áudio para gravação
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    // Solicitar permissão de microfone se necessário
    if (permissionResponse && !permissionResponse.granted) {
      requestPermission();
    }
    // Obter localização
    getCurrentLocation();
  }, []);

  // Animações do botão
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }).start();
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isListening]);

  // ========== FUNÇÕES DE LOCALIZAÇÃO ==========
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationText('Local não disponível');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setLocationCoords({ lat: latitude, lng: longitude });

      // Reverse geocoding (nome do local)
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address) {
        const place = [address.city, address.region, address.country]
          .filter(Boolean)
          .join(', ');
        setLocationText(place || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
      } else {
        setLocationText(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
      }
    } catch (error) {
      console.error('Erro ao obter localização', error);
      setLocationText('Erro ao obter local');
    }
  };

  // ========== FUNÇÕES DE GRAVAÇÃO ==========
  async function startRecording() {
    if (!permissionResponse?.granted) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('Permissão negada', 'Precisamos do microfone para gravar os cantos.');
        return;
      }
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsListening(true);
    } catch (err) {
      console.error('Falha ao iniciar gravação', err);
      Alert.alert('Erro', 'Não foi possível iniciar a gravação.');
    }
  }

  async function stopRecordingAndProcess() {
    if (!recording) return;

    setIsListening(false);
    setIsProcessing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        throw new Error('URI da gravação não encontrada');
      }

      // Simula tempo de processamento (identificação)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Identifica a ave (mock)
      const identified = identifyBirdMock();
      const locationName = locationText !== 'Obtendo localização...' ? locationText : 'Local desconhecido';

      // Cria um novo avistamento
      const newSighting: Sighting = {
        id: Date.now().toString(),
        commonName: identified.common,
        scientificName: identified.scientific,
        date: getCurrentDate(),
        timestamp: Date.now(),
        location: locationName,
        category: identified.category,
        recordingUri: uri, // guarda o áudio
      };

      // Recupera lista atual de avistamentos
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let sightings: Sighting[] = stored ? JSON.parse(stored) : [];
      sightings = [newSighting, ...sightings];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sightings));

      Alert.alert(
        '🎵 Ave Identificada!',
        `Identificamos ${identified.common} (${identified.scientific})\n\nA observação foi salva na sua coleção com o áudio.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erro ao processar gravação', error);
      Alert.alert('Erro', 'Falha ao salvar a gravação.');
    } finally {
      setIsProcessing(false);
    }
  }

  // Handlers do botão de microfone
  const handlePressIn = async () => {
    if (isProcessing) return;
    await startRecording();
  };

  const handlePressOut = async () => {
    if (isListening && recording) {
      await stopRecordingAndProcess();
    }
  };

  // ========== CONFIGURAÇÕES ==========
  const showSettingsMenu = () => {
    Alert.alert(
      'Configurações',
      'Opções do aplicativo',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar todos os avistamentos',
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Confirmar',
              'Tem certeza? Todos os avistamentos serão apagados permanentemente.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Apagar',
                  style: 'destructive',
                  onPress: async () => {
                    await AsyncStorage.removeItem(STORAGE_KEY);
                    Alert.alert('Dados removidos', 'Sua coleção está vazia agora.');
                  },
                },
              ]
            );
          },
        },
        {
          text: 'Sobre',
          onPress: () => Alert.alert('Passaralhos', 'Versão 1.0.0\nRegistro de aves com gravação de áudio.'),
        },
      ]
    );
  };

  // Animação do brilho
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.55],
  });

  // Componente de barra animada (com escala randômica durante gravação)
  function WaveBar({ item, index, isListening }: any) {
    const anim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (isListening) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.35 + Math.random() * 0.65,
              duration: 300 + Math.random() * 400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 1,
              duration: 300 + Math.random() * 400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();
      } else {
        anim.stopAnimation();
        Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
      }
    }, [isListening]);

    return (
      <Animated.View
        style={[
          styles.waveBar,
          {
            height: item.height,
            opacity: item.opacity ?? 1,
            backgroundColor: item.dark ? '#003B1F' : '#5A7B64',
            transform: [{ scaleY: anim }],
          },
        ]}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F9F2" />

      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Icon name="book-open" size={22} color="#065F46" />
          <Text style={styles.logoText}>Passaralhos</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={showSettingsMenu}
        >
          <Icon name="settings" size={20} color="#8A8A8A" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Ouça{'\n'}com Atenção</Text>
          <Text style={styles.subtitle}>
            Segure o botão para capturar o canto do pássaro no seu ambiente.
          </Text>
        </View>

        <View style={styles.waveContainer}>
          {BARS.map((item, index) => (
            <WaveBar key={index} item={item} index={index} isListening={isListening} />
          ))}
        </View>

        <View>
          <Animated.View style={[styles.micGlowRing, { opacity: glowOpacity }]} pointerEvents="none" />
          <View style={styles.micOuterBorder}>
            <TouchableOpacity
              style={[styles.micButton, isListening && styles.micButtonActive]}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.85}
              disabled={isProcessing}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                {isProcessing ? (
                  <ActivityIndicator size="large" color="#003B1F" />
                ) : (
                  <MaterialCommunityIcons
                    name={isListening ? 'microphone' : 'microphone-outline'}
                    size={52}
                    color="#003B1F"
                  />
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.listenHint}>
          {isProcessing ? '🔄 Processando áudio...' : isListening ? '● Gravando…' : 'Segure para gravar'}
        </Text>

        <TouchableOpacity style={styles.locationBox} onPress={getCurrentLocation} activeOpacity={0.7}>
          <Icon name="map-pin" size={13} color="#065F46" />
          <Text style={styles.locationText}>{locationText}</Text>
          <Icon name="refresh-cw" size={12} color="#A0A89D" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomTab}>
        <TabItem icon="mic" label="Gravar" active />
        <TabItem icon="grid" label="Coleção" onPress={onNavigateToCollection} />
        <TabItem icon="map" label="Mapa" onPress={onNavigateToMap} />
        <TabItem icon="award" label="Ranking" onPress={onNavigateToRanking} />
        <TabItem icon="user" label="Perfil" onPress={onNavigateToProfile} />
      </View>
    </SafeAreaView>
  );
}

// Componente TabItem reutilizável
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
      <Icon name={icon} size={19} color={active ? '#065F46' : '#B0ACA8'} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// Estilos (preservados do original, com pequenas adições)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F2' },
  header: {
    height: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDE3D8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    backgroundColor: '#F6F9F2',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logoText: {
    fontSize: 22,
    fontStyle: 'italic',
    color: '#065F46',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    letterSpacing: 0.3,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF1EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  titleBlock: { alignItems: 'center', gap: 12 },
  title: {
    fontSize: 54,
    fontWeight: '700',
    color: '#00361A',
    fontFamily: Platform.select({ ios: 'Georgia-Bold', android: 'serif' }),
    textAlign: 'center',
    lineHeight: 60,
    letterSpacing: -1,
  },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#6B7368', lineHeight: 24, maxWidth: width * 0.8 },
  waveContainer: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 100 },
  waveBar: { width: 6, borderRadius: 8 },
  micGlowRing: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 999,
    backgroundColor: '#F2C94C',
  },
  micOuterBorder: {
    borderWidth: 1.5,
    borderColor: 'rgba(242,201,76,0.28)',
    borderRadius: 999,
    padding: 14,
  },
  micButton: {
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: '#F2C94C',
    borderWidth: 7,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F2C94C',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: '#E8B93A',
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 14,
  },
  listenHint: { fontSize: 13, color: '#8C9189', letterSpacing: 0.8, fontWeight: '500', marginTop: -8 },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D4D9D0',
    gap: 7,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  locationText: { fontSize: 13, fontWeight: '600', color: '#3A4039', letterSpacing: 0.3, flex: 1 },
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
});