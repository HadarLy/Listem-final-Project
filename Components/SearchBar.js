import React from 'react';
import PropTypes from 'prop-types'
import {TextInput, View, StyleSheet, Text, Animated} from "react-native";
import strings from "../Language/language";
import {Icon, SearchBar} from "react-native-elements";
import ListPanel from "./ListPanel";

export default class searchBar extends React.Component {

	constructor(props)
	{
		super(props);
		//bind functions
		this.toggleSearchBar = this.toggleSearchBar.bind(this);

	}
	state = {
		searchBarSize: new Animated.Value(0.001), // the width of the searchBar text input.
		headerTextSize: new Animated.Value(1), // the width of the Text given (e.g. ListName).
		searchActive:false, // a state to determine if we show the search bar text input or not.
		searchIcon:true // a state to determine if we show a search Icon or a 'x' Icon to close the search
	};

	toggleSearchBar()
	{
		//we get the number value of the width of both views.
		let searchBarSize = this.state.searchActive ? 1 : 0.001;
		let headerTextSize = this.state.searchActive ? 0.001 : 1;
		this.setState({searchActive:!this.state.searchActive, searchIcon:!this.state.searchIcon}); //we toggle if the search bar text input is visible

		//change the view flex during 500 milliseconds, run in parallel for both views.
		Animated.parallel([
			Animated.timing(this.state.searchBarSize, {
				toValue:headerTextSize,
				duration:500
			}),
			Animated.timing(this.state.headerTextSize, {
				toValue: searchBarSize,
				duration:500
			})
		]).start(() => {
			if(!this.state.searchActive)
				this.props.searchFunc('');
		});
	}

	render() {
		//searchText is to decide if we show the searchBar text input fields.
		let searchText = this.state.searchActive ? <TextInput placeholder={strings.searchPlaceHolder} placeholderTextColor={'white'}
		                                                      onChangeText={this.props.searchFunc} style={[styles.searchBarStyle]}/> : null;

		let headerText = !this.state.searchActive ? <Text style={[styles.headerTextStyle]}>{this.props.headerText}</Text> : null;
		//Here we will determine if we show a search icon or an 'x' icon.
		let searchIcon = this.state.searchIcon ? 'search' : 'close';
		return (
			<View style={{flex: 2, flexDirection: 'row', alignItems: 'center', padding:5}}>
				<Animated.View style={{flex:this.state.searchBarSize, visible:this.state.searchActive}}>
					{searchText}
				</Animated.View>
				<Animated.View style={{flex:this.state.headerTextSize}}>
					{headerText}
				</Animated.View>
				<Icon name={searchIcon} type={'material'} size={30} color={'#fff'} style={{flex: 1, justifyContent:'flex-end'}} onPress={this.toggleSearchBar}/>
			</View>
		);
	}
}

SearchBar.propTypes = {
	/*
	The propTypes determine which props we require from the user and which are optional.
    */
	searchFunc: PropTypes.func.isRequired,
	headerText: PropTypes.string.optional
};

const styles = StyleSheet.create({
	searchBarStyle:{
		borderBottomWidth:1,
		borderColor:'white',
		color:'white',
		flex:1
	},
	headerTextStyle:{
		color:'white',
		fontSize: 25,
		fontWeight: 'bold',
		marginLeft:12,
		flex:1
	}
});
