import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const Logo = ({ size = 120, style }) => {
    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            <Image
                source={require('../../assets/logo.png')}
                style={styles.image}
                resizeMode="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
});

export default Logo;
