import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

// ========== PALETA DE CORES (conforme imagem) ==========
const COLORS = {
  background: '#FFFFFF',
  primary: '#1A402E',      // verde escuro – títulos
  secondary: '#F2C94C',    // amarelo – botões
  tertiary: '#6A323B',     // vinho – corpo de texto
  neutral: '#757874',      // cinza – labels
  cardBorder: '#E8E8E8',
  white: '#FFFFFF',
};
// ====================================================

type Step = {
  id: string;
  title: string;
  description: string;
};

// Etapas do onboarding – agora totalmente em português
const ONBOARDING_STEPS: Step[] = [
  {
    id: '1',
    title: 'Ouça a Natureza',
    description:
      'Capture a sinfonia da vida selvagem. Nossa avançada ferramenta de gravação acústica permite isolar cantos de pássaros mesmo em ambientes ruidosos.',
  },
  {
    id: '2',
    title: 'Descoberta por IA',
    description:
      'Identificação instantânea de mais de 10.000 espécies de aves através de redes neurais de última geração.',
  },
  {
    id: '3',
    title: 'Diário Digital',
    description:
      'Construa sua coleção vitalícia de avistamentos, anotações e dados geográficos em seu mapa pessoal.',
  },
];

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const flatListRef = useRef<FlatList<Step>>(null);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const onboardingOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(onboardingOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowOnboarding(true);
      });
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const goToNextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const nextIndex = currentStep + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentStep(nextIndex);
    } else {
      onFinish();
    }
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentStep(index);
  };

  // Cabeçalho de cada passo (centralizado verticalmente)
  const StepHeader = ({ step, isLast }: { step: Step; isLast: boolean }) => (
    <View style={styles.stepHeader}>
      <Text style={styles.stepIndicator}>{`PASSO ${parseInt(step.id, 10)} DE ${ONBOARDING_STEPS.length}`}</Text>
      <Text style={styles.stepTitle}>{step.title}</Text>
      <Text style={styles.stepDescription}>{step.description}</Text>
      {!isLast && (
        <View style={styles.stepActions}>
          <TouchableOpacity onPress={goToNextStep} style={styles.nextChapterBtn}>
            <Text style={styles.nextChapterText}>Próximo Capítulo  →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.learnMoreBtn}>
            <Text style={styles.learnMoreText}>Saiba Mais</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Rodapé com cards (só no último passo)
  const JourneyFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.journeyTitle}>Sua Jornada pela Frente</Text>
      <View style={styles.cardsContainer}>
        <View style={styles.featureCard}>
          <Text style={styles.cardIcon}>🔍</Text>
          <Text style={styles.cardTitle}>Descoberta IA</Text>
          <Text style={styles.cardDesc}>Identificação instantânea</Text>
        </View>
        <View style={styles.featureCard}>
          <Text style={styles.cardIcon}>📓</Text>
          <Text style={styles.cardTitle}>Diário Digital</Text>
          <Text style={styles.cardDesc}>Seu mapa de avistamentos</Text>
        </View>
        <View style={styles.featureCard}>
          <Text style={styles.cardIcon}>🌐</Text>
          <Text style={styles.cardTitle}>Hub Ornitologia</Text>
          <Text style={styles.cardDesc}>Conecte-se com observadores</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.getStartedButton} onPress={onFinish}>
        <Text style={styles.getStartedText}>Começar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOnboardingPage = ({ item, index }: { item: Step; index: number }) => (
    <View style={styles.pageContainer}>
      <StepHeader step={item} isLast={index === ONBOARDING_STEPS.length - 1} />
      {index === ONBOARDING_STEPS.length - 1 && <JourneyFooter />}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Splash inicial – texto perfeitamente centralizado */}
      {!showOnboarding && (
        <Animated.View style={[styles.splashContainer, { opacity: splashOpacity }]}>
          <Text style={styles.logo}>Passaralhos</Text>
          <Text style={styles.tagline}>GUIA DE CAMPO DIGITAL</Text>
          <Text style={styles.subtitle}>Ouça a natureza. Descubra o mundo.</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>OBSERVAÇÃO ALIMENTADA POR IA</Text>
          </View>
        </Animated.View>
      )}

      {/* Onboarding em carrossel */}
      {showOnboarding && (
        <Animated.View style={[styles.onboardingContainer, { opacity: onboardingOpacity }]}>
          <FlatList
            ref={flatListRef}
            data={ONBOARDING_STEPS}
            renderItem={renderOnboardingPage}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            bounces={false}
          />
          {/* Indicador de página */}
          <View style={styles.pagination}>
            {ONBOARDING_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  currentStep === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // ----- SPLASH (texto ao centro) -----
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 30,
  },
  logo: {
    fontSize: 52,
    fontFamily: 'Georgia',
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 13,
    letterSpacing: 4,
    color: COLORS.secondary,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: COLORS.tertiary,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  aiBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  aiBadgeText: {
    fontSize: 12,
    letterSpacing: 2,
    color: COLORS.white,
    fontWeight: '700',
  },
  // ----- ONBOARDING (centralizado verticalmente) -----
  onboardingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pageContainer: {
    width,
    flex: 1,
    justifyContent: 'center',   // centraliza verticalmente
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  stepHeader: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  stepIndicator: {
    fontSize: 12,
    letterSpacing: 2,
    color: COLORS.neutral,
    fontWeight: '600',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 36,
    fontFamily: 'Georgia',
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: COLORS.tertiary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  stepActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 10,
  },
  nextChapterBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  nextChapterText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  learnMoreBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  learnMoreText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  // ----- FOOTER (último passo) -----
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 20,
  },
  journeyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 20,
    fontFamily: 'Georgia',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 28,
  },
  featureCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    width: (width - 80) / 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: COLORS.neutral,
    textAlign: 'center',
  },
  getStartedButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginTop: 8,
  },
  getStartedText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
  },
  // ----- PAGINAÇÃO -----
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.neutral,
    opacity: 0.4,
    marginHorizontal: 5,
  },
  paginationDotActive: {
    opacity: 1,
    backgroundColor: COLORS.primary,
    width: 22,
    borderRadius: 4,
  },
});