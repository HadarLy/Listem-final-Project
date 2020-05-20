import React from 'react'
import { Button } from 'react-native-elements'

function FavButton(props) {
    return(
        <Button
            onPress={props.function}
            title={props.text}
            type="solid"
            buttonStyle = {{
                width: 180,
                height: 90,
                backgroundColor: '#7ed6df',
                padding: 5
            }}
            containerStyle = {{
                marginTop: 10,
            }}
            raised={true}
        />
    )
}

export default FavButton