import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';

class EditHeader extends React.Component {

    state = {
        animated: new Animated.Value(0),
    }

    componentDidMount() {
        this.toggleBar()
    }

    toggleBar() {
        Animated.timing(this.state.animated, {
            toValue: 1,
            duration: 200
        }).start();
    }

    render() {
        return (
            <Animated.View style={[styles.headNav, {
                opacity: this.state.animated.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                  transform: [
                    {
                      scale: this.state.animated.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1.1, 1],
                      }),
                    },
                  ]
            }]}>
                <View style={styles.leftBar}>
                    <TouchableOpacity onPress={this.props.function}>
                     <Icon 
                        name="keyboard-backspace" 
                        type="material"
                        size={30}
                        color="#fff"
                     />
                     </TouchableOpacity>
                     <Text style={{ fontSize: 30, fontWeight: '300', color: 'white'}}>{this.props.counter}</Text>
                </View>
                <View style={styles.rightBar}>
                    <Icon 
                        name='star'
                        type='material'  
                        size={30}
                        color="#ffd000"
                     />
                </View>
            </Animated.View>
        )
    }



}

const styles = StyleSheet.create({
    headNav: {
        flex: 1,
		flexDirection:'row',
		backgroundColor: '#bdc3c7',
		height: 66,
        elevation: 5,
    },
    leftBar: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 5
    },
    rightBar: {
        flex: 3,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 5
    }
})

export default EditHeader