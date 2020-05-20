import React from  'react';
import PropTypes from 'prop-types';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Icon} from "react-native-elements";
import SearchBar from "./SearchBar";


export default class ListPanelHeader extends React.Component {
	/*****************************************************************************************************************
		This Component is the rendered list header based on the props it receives (could become the header for all windows.
    ******************************************************************************************************************/
	constructor(props) {
		super(props);
		//bind functions
		this.searchTextChanged = this.searchTextChanged.bind(this);
		this.getBackIcon = this.getBackIcon.bind(this);
		this.getRightIcons = this.getRightIcons.bind(this);
		this.getHeaderBar = this.getHeaderBar.bind(this);
	}

	searchTextChanged(text)
	{
		if(this.props.hasOwnProperty('searchBy'))
			this.props.searchBy(text);
	}

	getRightIcons(styleRightIcons)
	{
		return this.props.rightIconsVisible ? <View style={styleRightIcons}>{this.props.rightIcons.map((item, keyNum) => {
			return (
				<View key={keyNum}>
					<TouchableOpacity onPress={item.function}>
						<Icon
							name={item.name}
							type={item.type}
							size={item.size}
							color={item.color}
						/>
					</TouchableOpacity>
				</View>
			)
		})}</View> : null;
	}

	getBackIcon()
	{
		return (this.props.hasOwnProperty('backFunction') && this.props.backFunction) ? <TouchableOpacity style={{marginTop:8}} onPress={this.props.backFunction}>
			<Icon
				name="keyboard-backspace"
				type="material"
				size={30}
				color="#fff"
			/>
		</TouchableOpacity> : null;
	}

	getHeaderBar()
	{
		let headerBar = null;
		const maxHeaderTextSize = 14;
		let headerText = this.props.headerText.length > maxHeaderTextSize ?
			this.props.headerText.substring(0, maxHeaderTextSize - 3) + '...' :
			this.props.headerText;

		Animated.createAnimatedComponent(SearchBar);
		if(this.props.hasOwnProperty('searchBy'))
		{
			headerBar = <View style={styles.FlatListHeaderDivider}>
							<SearchBar searchFunc={this.searchTextChanged} headerText={headerText}/>
						</View>;
		}
		else
		{
			headerBar = <View style={styles.FlatListHeaderDivider}>
							<Text style={[styles.headerTextStyle]}>{headerText}</Text>
						</View>;
		}

		return headerBar;
	}

	render()
	{
		let flexSize = this.props.rightIcons ? this.props.rightIcons.length : 1; //adjust the flex to the amount of icons in the header.
		const styleRightIcons = [styles.FlatListIconContainer, {flex: flexSize}];

		let backIcon = this.getBackIcon();
		let rightIcons = this.getRightIcons(styleRightIcons);
		let spaceBetweenSearchAndIcons = rightIcons ? <View style={{flex:1}} key={'SpaceBetweenSearchAndButtons'}/> : null; //determine if there should be a space between search and other icons.

		if(rightIcons !== null && this.props.rightIcons.length === 1)
		{
			styleRightIcons.push({
				justifyContent:'flex-end',
				padding: 5});
		}

		let headerBar = this.getHeaderBar();

		return (
			<View style={styles.FlatListHeader}>
				{backIcon}
				{headerBar}
				{spaceBetweenSearchAndIcons}
				{rightIcons}
			</View>
		)
	};
}

ListPanelHeader.propTypes = {
	/*
	The propTypes determine which props we require from the user and which are optional.
    */
	rightIconsVisible: PropTypes.bool.isRequired,
	rightIcons: PropTypes.array,
	backIcon: PropTypes.bool,
	backFunction: PropTypes.func,
	headerText : PropTypes.string
};

const styles = StyleSheet.create({

	FlatListHeader: {
		flexDirection: 'row',
		height: 50,
		backgroundColor: '#22a6b3',
		elevation: 5,
	},
	menuPos: {
		marginBottom: 10,
		marginLeft: 15
	},
	FlatListHeaderDivider: {
		flex:6.5,
		flexDirection: 'row',
		justifyContent: 'flex-end'
	},
	FlatListIconContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
	},
	theFlatList: {
		borderRadius: 4
	},
	headerTextStyle:{
		color:'white',
		fontSize: 25,
		fontWeight: 'bold',
		marginLeft:12,
		flex:1,
		elevation: -5
	}
});