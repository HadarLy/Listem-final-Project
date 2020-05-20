import React from 'react'
import { StyleSheet } from 'react-native'
import { Button } from 'react-native-elements'

/*-------------------------------------------------------------------------
Props
    --function={function}
        this function will run once the button get pressed
    --title={string}
        what will appear on the button
    --ownStyle={true/false} - mandatory field
        if true, you can costumize the button, else it has a default value
    --styling
        the custom style for the button (relevant if ownstyle is true)
------------------------------------------------------------------------*/



function MyButton(props) {
    return(
        <Button
            onPress={props.function}
            onLongPress={props.longPress}
            title={props.text}
            type="solid"
            buttonStyle = {[styles.myButtonStyle, props.selected && styles.selectedStyle]}
            containerStyle = {{
                margin: 10,
            }}
            raised={true}
        />
    )
}

const styles=StyleSheet.create({
    myButtonStyle: {
        width: 150,
        height: 75,
        backgroundColor: '#107dac',
        padding: 5,
    },
    selectedStyle: {
        backgroundColor: '#bdc3c7'
    }
})

export default MyButton