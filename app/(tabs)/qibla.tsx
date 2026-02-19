import { getQiblaBearing } from "@/actions/getQiblaBearing";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Palette = {
    bg: string;
    card: string;
    cardBorder: string;
    green: string;
    greenDim: string;
    greenGlow: string;
    text: string;
    textMuted: string;
    textDim: string;
};

function toRad(deg: number) {
    return (deg * Math.PI) / 180;
}

// ─── Degree tick marks ────────────────────────────────────────────────────────
const { width } = Dimensions.get('window');
const DIAL_SIZE = width * 0.78;
const TICK_COUNT = 72; // every 5°
const COMPASS_RADIUS = DIAL_SIZE / 2 - 12;

// ─── Cardinal Labels ──────────────────────────────────────────────────────────
const CARDINALS = ['N', 'E', 'S', 'W'];
const CARDINAL_RADIUS = DIAL_SIZE / 2 - 40;


export default function QiblaCompass() {
    const [heading, setHeading] = useState(0);
    const [qibla, setQibla] = useState(0);
    const [aligned, setAligned] = useState(false);
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const palette: Palette = {
        bg: theme.background,
        card: theme.card,
        cardBorder: theme.cardBorder,
        green: theme.green,
        greenDim: theme.greenDim,
        greenGlow: theme.greenGlow,
        text: theme.text,
        textMuted: theme.textMuted,
        textDim: theme.textDim,
    };
    const styles = React.useMemo(() => createStyles(palette), [palette]);

    const compassRotation = useRef(new Animated.Value(0)).current;
    const needleRotation = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const lastHeading = useRef(0);

    useEffect(() => {
        async function setup() {
            const { status } =
                await Location.requestForegroundPermissionsAsync()

            if (status !== "granted") return

            const location =
                await Location.getCurrentPositionAsync({})

            const bearing = getQiblaBearing(
                location.coords.latitude,
                location.coords.longitude
            )

            setQibla(Math.round(bearing))
        }

        setup()

        Magnetometer.setUpdateInterval(100)

        const subscription = Magnetometer.addListener(
            (data) => {
                let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
                angle = (angle + 360) % 360;

                // Smooth out jitter
                const diff = angle - lastHeading.current;
                const smoothed =
                    lastHeading.current +
                    (Math.abs(diff) > 180 ? diff - Math.sign(diff) * 360 : diff) * 0.3;

                lastHeading.current = smoothed;
                setHeading(Math.round((smoothed + 360) % 360));
            }
        )

        return () => subscription.remove()
    }, [])

    // Animate compass dial rotation (opposite of heading)
    useEffect(() => {
        Animated.spring(compassRotation, {
            toValue: -heading,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
        }).start();
    }, [heading]);

    // Animate needle to qibla direction
    useEffect(() => {
        Animated.spring(needleRotation, {
            toValue: qibla - heading,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
        }).start();
    }, [qibla, heading]);

    // Check alignment
    useEffect(() => {
        const diff = Math.abs(((qibla - heading + 540) % 360) - 180);
        const isAligned = diff < 5;
        setAligned(isAligned);

        if (isAligned) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 700,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 700,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            glowAnim.setValue(0);
        }
    }, [heading, qibla]);

    const compassDeg = compassRotation.interpolate({
        inputRange: [-360, 0, 360],
        outputRange: ['-360deg', '0deg', '360deg'],
    });

    const needleDeg = needleRotation.interpolate({
        inputRange: [-720, 0, 720],
        outputRange: ['-720deg', '0deg', '720deg'],
    });

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.4, 1],
    });

    const TickMarks = () => {
        const ticks = [];
        for (let i = 0; i < TICK_COUNT; i++) {
            const angle = (i / TICK_COUNT) * 360;
            const isMajor = i % 9 === 0; // every 45°
            const isCardinal = i % 18 === 0; // every 90°
            ticks.push(
                <View
                    key={i}
                    style={[
                        styles.tick,
                        {
                            transform: [
                                { rotate: `${angle}deg` },
                                { translateY: -COMPASS_RADIUS },
                            ],
                            height: isCardinal ? 16 : isMajor ? 10 : 5,
                            backgroundColor: isCardinal
                                ? palette.green
                                : isMajor
                                    ? palette.greenDim
                                    : palette.cardBorder,
                            width: isCardinal ? 2.5 : 1.5,
                        },
                    ]}
                />
            );
        }
        return <View style={styles.tickContainer}>{ticks}</View>;
    };

    const CardinalLabels = ({ rotation }: { rotation: Animated.Value }) => {
        const center = DIAL_SIZE / 2;
        return (
            <Animated.View
                style={[
                    styles.cardinalContainer,
                    {
                        transform: [
                            {
                                rotate: rotation.interpolate({
                                    inputRange: [0, 360],
                                    outputRange: ['0deg', '360deg'],
                                }),
                            },
                        ],
                    },
                ]}
            >
                {CARDINALS.map((label, i) => {
                    const angle = toRad(i * 90);
                    const x = center + CARDINAL_RADIUS * Math.sin(angle);
                    const y = center - CARDINAL_RADIUS * Math.cos(angle);
                    return (
                        <Text
                            key={label}
                            style={[
                                styles.cardinalText,
                                {
                                    position: 'absolute',
                                    left: x - 7,
                                    top: y - 9,
                                    color: label === 'N' ? palette.green : palette.textMuted,
                                    fontWeight: label === 'N' ? '700' : '500',
                                },
                            ]}
                        >
                            {label}
                        </Text>
                    );
                })}
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            {/* Qibla Card */}
            <View style={styles.card}>
                <Text style={styles.cardLabel}>QIBLA DIRECTION</Text>
                <View style={styles.cardRow}>
                    <Text style={styles.cardPrimary}>Makkah</Text>
                    <Text style={[styles.cardValue, aligned && styles.cardValueAligned]}>
                        {qibla}°
                    </Text>
                </View>
                <Text style={styles.cardSub}>
                    {aligned ? '✓ Facing Qibla' : `Rotate ${qibla}° from North`}
                </Text>
            </View>

            {/* Compass */}
            <View style={styles.compassOuter}>
                {/* Glow ring when aligned */}
                {aligned && (
                    <Animated.View
                        style={[styles.glowRing, { opacity: glowOpacity }]}
                    />
                )}

                {/* Rotating compass dial */}
                <Animated.View
                    style={[
                        styles.compassDial,
                        { transform: [{ rotate: compassDeg }] },
                    ]}
                >
                    <TickMarks />
                    <CardinalLabels rotation={new Animated.Value(0)} />
                </Animated.View>

                {/* Outer ring */}
                <View style={styles.compassRing} />

                {/* Fixed Kaaba marker at top */}
                <Animated.View
                    style={[
                        styles.qiblaMarkerContainer,
                        { transform: [{ rotate: needleDeg }] },
                    ]}
                >
                    <View style={styles.qiblaMarkerLine} />
                    <View style={styles.qiblaMarkerTip} />
                </Animated.View>

                {/* Center circle with Kaaba icon */}
                <View style={styles.centerCircle}>
                    <Text style={styles.kaabaIcon}>🕋</Text>
                </View>
            </View>

            {/* Heading info */}
            <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>HEADING</Text>
                    <Text style={styles.infoValue}>{heading}°</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>QIBLA</Text>
                    <Text style={[styles.infoValue, { color: palette.green }]}>
                        {qibla}°
                    </Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>OFFSET</Text>
                    <Text style={styles.infoValue}>
                        {Math.round(Math.abs(((qibla - heading + 540) % 360) - 180))}°
                    </Text>
                </View>
            </View>

            <Text style={styles.footer}>Simple, easy, and ad free — always.</Text>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (palette: Palette) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: palette.bg,
            paddingHorizontal: 20,
            paddingTop: 16,
        },

        // Card
        card: {
            backgroundColor: palette.card,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: palette.cardBorder,
            marginBottom: 40,
        },
        cardLabel: {
            color: palette.textMuted,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.2,
            marginBottom: 6,
        },
        cardRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        cardPrimary: {
            color: palette.text,
            fontSize: 26,
            fontWeight: '800',
        },
        cardValue: {
            color: palette.green,
            fontSize: 32,
            fontWeight: '800',
            fontVariant: ['tabular-nums'],
        },
        cardValueAligned: {
            color: palette.green,
            textShadowColor: palette.greenGlow,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8,
        },
        cardSub: {
            color: palette.textDim,
            fontSize: 13,
            marginTop: 4,
        },

        // Compass outer shell
        compassOuter: {
            width: DIAL_SIZE,
            height: DIAL_SIZE,
            alignSelf: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 28,
        },
        glowRing: {
            position: 'absolute',
            width: DIAL_SIZE + 16,
            height: DIAL_SIZE + 16,
            borderRadius: (DIAL_SIZE + 16) / 2,
            borderWidth: 2,
            borderColor: palette.green,
        },
        compassRing: {
            position: 'absolute',
            width: DIAL_SIZE,
            height: DIAL_SIZE,
            borderRadius: DIAL_SIZE / 2,
            borderWidth: 1.5,
            borderColor: palette.cardBorder,
            backgroundColor: 'transparent',
        },
        compassDial: {
            position: 'absolute',
            width: DIAL_SIZE,
            height: DIAL_SIZE,
            borderRadius: DIAL_SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: palette.card,
            overflow: 'hidden',
        },

        // Tick marks
        tickContainer: {
            position: 'absolute',
            width: DIAL_SIZE,
            height: DIAL_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
        },
        tick: {
            position: 'absolute',
            borderRadius: 2,
            transformOrigin: 'center center',
        },

        // Cardinal labels
        cardinalContainer: {
            position: 'absolute',
            width: DIAL_SIZE,
            height: DIAL_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
        },
        cardinalText: {
            fontSize: 15,
            fontWeight: '600',
        },

        // Qibla needle / marker
        qiblaMarkerContainer: {
            position: 'absolute',
            width: DIAL_SIZE,
            height: DIAL_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
        },
        qiblaMarkerLine: {
            position: 'absolute',
            width: 2,
            height: DIAL_SIZE * 0.38,
            backgroundColor: palette.green,
            top: DIAL_SIZE * 0.05,
            borderRadius: 2,
            opacity: 0.8,
        },
        qiblaMarkerTip: {
            position: 'absolute',
            top: DIAL_SIZE * 0.03,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: palette.green,
        },

        // Needle
        needleWrapper: {
            width: 14,
            height: 100,
            alignItems: 'center',
            position: 'absolute',
        },
        needleHalf: {
            width: 6,
            height: 50,
        },
        needleNorth: {
            backgroundColor: palette.green,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
        },
        needleSouth: {
            backgroundColor: palette.cardBorder,
            borderBottomLeftRadius: 3,
            borderBottomRightRadius: 3,
        },
        needleDot: {
            position: 'absolute',
            top: '50%',
            marginTop: -6,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: palette.bg,
            borderWidth: 2,
            borderColor: palette.green,
        },

        // Center
        centerCircle: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: palette.card,
            borderWidth: 2,
            borderColor: palette.cardBorder,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
        },
        kaabaIcon: {
            fontSize: 28,
        },

        // Info row
        infoRow: {
            flexDirection: 'row',
            backgroundColor: palette.card,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: palette.cardBorder,
            marginBottom: 16,
        },
        infoItem: {
            flex: 1,
            alignItems: 'center',
        },
        infoLabel: {
            color: palette.textDim,
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 1,
            marginBottom: 4,
        },
        infoValue: {
            color: palette.text,
            fontSize: 18,
            fontWeight: '700',
            fontVariant: ['tabular-nums'],
        },
        infoDivider: {
            width: 1,
            backgroundColor: palette.cardBorder,
            marginHorizontal: 8,
        },

        footer: {
            color: palette.textDim,
            fontSize: 12,
            textAlign: 'center',
            marginBottom: 8,
            opacity: 0.6,
        },

        // Tab bar
        tabBar: {
            flexDirection: 'row',
            borderTopWidth: 1,
            borderTopColor: palette.cardBorder,
            paddingTop: 12,
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
            marginHorizontal: -20,
            paddingHorizontal: 20,
        },
        tabItem: {
            flex: 1,
            alignItems: 'center',
            gap: 4,
        },
        tabItemActive: {
            opacity: 1,
        },
        tabIcon: {
            fontSize: 22,
        },
        tabLabel: {
            fontSize: 11,
            color: palette.textDim,
            fontWeight: '500',
        },
        tabLabelActive: {
            color: palette.green,
            fontWeight: '600',
        },
    });
