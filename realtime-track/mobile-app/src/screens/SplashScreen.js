import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    withRepeat,
    withSequence,
    Easing,
    runOnJS
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/theme';
import Logo from '../components/Logo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Fan Character Component
const FanCharacter = ({ fanY, bladeRotation, bladeScale, fanOpacity }) => {
    const fanStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: fanY.value }],
        opacity: fanOpacity.value
    }));

    const bladeStyle = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${bladeRotation.value}deg` },
            { scale: bladeScale.value }
        ]
    }));

    return (
        <Animated.View style={[styles.fanBody, fanStyle]}>
            <View style={styles.fanBase} />
            <Animated.View style={[styles.fanBlades, bladeStyle]}>
                {[0, 90, 180, 270].map(deg => (
                    <View key={deg} style={[styles.fanBlade, { transform: [{ rotate: `${deg}deg` }] }]} />
                ))}
            </Animated.View>
        </Animated.View>
    );
};

// Physics Letter Component
const PhysicsLetter = ({ letter, index, totalLetters }) => {
    const x = useSharedValue(-200 - (Math.random() * 200));
    const y = useSharedValue(index % 2 === 0 ? -height / 2 : height / 2);
    const rotate = useSharedValue(Math.random() * 1080 - 540);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(1.5);

    const FINAL_X_GAP = 35;
    const startX = -((totalLetters - 1) * FINAL_X_GAP) / 2;
    const targetX = startX + index * FINAL_X_GAP;

    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        opacity: opacity.value,
        transform: [
            { translateX: x.value },
            { translateY: y.value },
            { rotate: `${rotate.value}deg` },
            { scale: scale.value }
        ]
    }));

    useEffect(() => {
        const initialDelay = 1800 + index * 50;
        opacity.value = withDelay(initialDelay, withTiming(1, { duration: 50 }));

        const burstDuration = 1200 + Math.random() * 600;

        // Phase 1: The Chaotic Gust
        x.value = withDelay(initialDelay, withSpring(targetX + (Math.random() * 120 - 60), {
            damping: 5,
            stiffness: 30,
            mass: 1 + Math.random()
        }));

        y.value = withDelay(initialDelay, withSpring(Math.random() * 100 - 50, {
            damping: 5,
            stiffness: 30,
            mass: 1 + Math.random()
        }));

        // Individual behaviors: Cartwheels vs Wobbles
        if (index % 3 === 0) {
            rotate.value = withDelay(initialDelay, withTiming(rotate.value + 720, { duration: burstDuration }));
        } else {
            rotate.value = withDelay(initialDelay, withSequence(
                withTiming(rotate.value + 120, { duration: 400 }),
                withTiming(rotate.value - 180, { duration: 500 }),
                withTiming(rotate.value + 60, { duration: 400 })
            ));
        }

        scale.value = withDelay(initialDelay, withTiming(1, { duration: 800 }));

        // Phase 2: Magnetic Alignment
        setTimeout(() => {
            x.value = withSpring(targetX, { damping: 20, stiffness: 100 });
            y.value = withSpring(0, { damping: 20, stiffness: 100 });
            rotate.value = withSpring(0, { damping: 15, stiffness: 90 });
        }, 4500 + index * 100);
    }, []);

    return (
        <Animated.View style={animatedStyle}>
            <Text style={styles.letterText}>{letter}</Text>
        </Animated.View>
    );
};

export default function SplashScreen({ navigation }) {
    const bgFade = useSharedValue(0);
    const fanY = useSharedValue(height);
    const fanOpacity = useSharedValue(1);
    const bladeRotation = useSharedValue(0);
    const bladeScale = useSharedValue(1);
    const finalWordmarkOpacity = useSharedValue(0);
    const finalLogoScale = useSharedValue(0.5);

    const letters = ["Z", "Y", "R", "O", "-", "A", "C"];

    const onFinish = async () => {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        if (hasSeenOnboarding === 'true') {
            navigation.replace('Auth');
        } else {
            navigation.replace('Onboarding');
        }
    };

    useEffect(() => {
        bgFade.value = withTiming(1, { duration: 800 });
        fanY.value = withDelay(600, withSpring(height / 2 - 100, { damping: 12, stiffness: 60 }));

        // Rev up
        bladeRotation.value = withDelay(1200, withTiming(1440, {
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.2, 1)
        }));

        // Cleanup and Exit
        setTimeout(() => {
            bladeRotation.value = withTiming(bladeRotation.value + 360, { duration: 1500, easing: Easing.out(Easing.quad) });
            bladeScale.value = withTiming(0, { duration: 800 });
            fanY.value = withTiming(height, { duration: 1000 });

            finalWordmarkOpacity.value = withTiming(1, { duration: 1000 });
            finalLogoScale.value = withSpring(1, { damping: 12 });

            setTimeout(() => {
                bgFade.value = withTiming(0, { duration: 800 }, (f) => {
                    if (f) runOnJS(onFinish)();
                });
            }, 3000);
        }, 6000);
    }, []);

    const wordmarkStyle = useAnimatedStyle(() => ({
        opacity: finalWordmarkOpacity.value,
        transform: [{ scale: finalLogoScale.value }],
        alignItems: 'center'
    }));

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgFade.value, backgroundColor: COLORS.roseGold }]} />

            <View style={styles.stage}>
                {letters.map((char, i) => (
                    <PhysicsLetter key={i} letter={char} index={i} totalLetters={letters.length} />
                ))}
            </View>

            <FanCharacter
                fanY={fanY}
                bladeRotation={bladeRotation}
                bladeScale={bladeScale}
                fanOpacity={fanOpacity}
            />

            <Animated.View style={[styles.finalBranding, wordmarkStyle]}>
                <Logo size={100} />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.roseGold,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fanBody: {
        position: 'absolute',
        width: 60,
        height: 80,
        alignItems: 'center',
    },
    fanBase: {
        width: 32,
        height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 8,
        position: 'absolute',
        bottom: 0,
    },
    fanBlades: {
        width: 90,
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fanBlade: {
        position: 'absolute',
        width: 10,
        height: 45,
        backgroundColor: '#FFF',
        borderRadius: 5,
        top: 0,
    },
    letterText: {
        color: '#FFF',
        fontSize: 52,
        fontWeight: '900',
        letterSpacing: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    finalBranding: {
        position: 'absolute',
        bottom: 120,
    }
});
