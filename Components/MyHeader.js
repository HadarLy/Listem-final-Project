import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';

/*--------------------------------------------------------------------------------
Props:
	--text={sting}
		what string will appear on the header
	--backIcon={true/false} - mandatory field
		if true, a wild back icon will appear
	--backFunction={function}
		this function will run when pressing the back icon
	--rightIconsVisible={true/false} - mandatory field
		if true, we will see 1/2 right icons according to what we provided
	--rightIcons={an array of objects}
		each object represent a right icon, each object have the following props:
			-name-name of the icon according to react-native-elements
			-type-type of the icon according to react-native-elements
			-function-what will run when pressing the icon
			-size-a number, representing the size of the icon
			-color-the color of an icon
------------------------------------------------------------------------------------------*/

class MyHeader extends React.Component {

    render() {
		let backIcon = <TouchableOpacity onPress={this.props.backFunction}>
							<Icon 
							name="keyboard-backspace" 
							type="material"
							size={30}
							color="#fff"
							/>
					   </TouchableOpacity>
		let rightIcons = null;
		if (this.props.rightIconsVisible )
			rightIcons = this.props.rightIcons.map((item, keyNum) => {
			return (
				<View key={keyNum}>
					<TouchableOpacity onPress={item.function}>
						<Icon name={item.name} type={item.type} size={item.size} color={item.color}></Icon>
					</TouchableOpacity>
				</View>
			)
		})
		let styleRightIcons = [styles.IconContainer];
		if(rightIcons !== null && rightIcons.length === 1)
		{
			styleRightIcons.push({justifyContent:'flex-end'});
		}

		let editable = {
			backgroundColor: '#bdc3c7'
		}
        return (
            <View style={[styles.headNav, this.props.editable && editable]}>
				<View style={styles.BackIconContainer}>
					{this.props.backIcon && backIcon}
				</View>
                <View style={styles.WelcomeContainer}>
                        <Text style={styles.welcomeText}>
                            {this.props.text}
                        </Text>
				</View>
				<View style={styleRightIcons}>
						{rightIcons}
				</View>
            </View>
        )
    }
}

const styles=StyleSheet.create({
    headNav:{
		flex: 1,
		flexDirection:'row',
		backgroundColor: '#22a6b3',
		height: 66,
		elevation: 5,
	},
	BackIconContainer: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	WelcomeContainer: {
		flex: 4,
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		padding: 5,
	},
	welcomeText: {
		fontSize: 18,
		color: 'white',
		fontWeight: 'bold',
		fontFamily: 'sans-serif'
	},
	IconContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around',
		padding: 5,
	},
})

export default MyHeader