import React from 'react'
import {StyleSheet, View, Text, ActivityIndicator} from 'react-native'

function SplashScreen() {

    return (
        <View style={styles.mainWindow}>
            <Text style={styles.Text}>List'em</Text>
            <Text style={styles.subtitle}>Because list is more</Text>
            <ActivityIndicator style={styles.loading} size="large" color='white'/>
        </View>
    )
}

export default SplashScreen

const styles = StyleSheet.create({
    mainWindow: {
        flex: 1,
        backgroundColor: '#0984e3',
        justifyContent: 'center',
        alignItems: 'center'
    },
    Text: {
        fontWeight: '700',
        color: 'white',
        fontSize: 70
    },
    subtitle: {
        fontWeight: '400',
        color: 'white',
        fontSize: 25,
        opacity: 0.8
    },
    loading: {
        marginTop: 10
    }
})