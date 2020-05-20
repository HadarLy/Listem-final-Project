import React from 'react';
import {Text, View, Animated, ScrollView, TouchableHighlight, CheckBox} from 'react-native';
import strings from '../Language/language'

class FilterMenu extends React.Component {


	/*********************************************************************************************************
	 This component will hold the filtering buttons.
	 ********************************************************************************************************/

	constructor(props) {
		super(props);
	}

	componentDidMount() {
		strings.setLanguage(this.props.language);
		if(this.props.hasOwnProperty('filterByOptions') && this.props.hasOwnProperty('activeFilters'))
		{
			let activeFilters = [];
			for (let i = 0; i < this.props.filterByOptions.length; i++)
			{
				let filter = {
					type:this.props.filterByOptions[i],
					active:(this.props.activeFilters.includes(this.props.filterByOptions[i]))
				};

				activeFilters.push(filter);
			}

			this.setState({filteringOptions:activeFilters});
		}
	}

	state = {
		filteringOptions:[]
	};

	static decideFilterMessage(option)
	{
		let message = '';

		switch (option) {
			case 'Owner':
				message = strings.MyCreatedLists;
				break;
			case 'Participator':
				message = strings.InvitedLists;
				break;
			case 'Personal':
				message = strings.MyPersonalLists;
				break;
			case 'All':
				message = strings.AllLists;
				break;
			default:
				message = option;
				break;
		}

		return message;
	}

	checkChanged(index)
	{
		let activeFilters = this.state.filteringOptions;
		let filters = [];
		//change the active value of the filter
		activeFilters[index].active = !activeFilters[index].active;

		if(activeFilters[index].active && activeFilters[index].type === 'All') //we purposely check All
		{ //we  will remove all other filter and leave only the All filter.
			activeFilters = this.clearAllFilters();
		}
		//create filters array for the HomeScreen (it filters by strings
		for(let i = 0; i < activeFilters.length; i++)
		{ //it checks if the filter is active and if so it add it to the array.
			if(activeFilters[i].active)
				filters.push(activeFilters[i].type);
		}

		if(filters.length === 0) //we didn't apply any filter so we need to auto select all lists.
			filters.push('All');
		else if(filters.includes('All')) //we remove the 'All' filter from selection
			filters.splice(filters.indexOf('All'), 1);

		//save the new filters array
		this.setState({filteringOptions:activeFilters});
		if(this.props.hasOwnProperty('FilterBy'))
			this.props.FilterBy(filters); //invoke FilterBy
	}

	clearAllFilters()
	{
		let filters = this.state.filteringOptions;

		for(let i = 0; i < filters.length; i++)
		{
			filters[i].active = false; //we will remove all the filters and the calling method will re-set the All filter afterwards.
		}

		return filters;
	}

	render()
	{
		let FilteringOptions = this.state.filteringOptions.map((option, index) => {
			let message = FilterMenu.decideFilterMessage(option.type);
			return(
				<View  key={index} style={{flexDirection:'row', height:25}}>
					<TouchableHighlight style={{flex:1}} onPress={() => {
						this.checkChanged(index);
					}}>
						<Text style={{textAlignVertical: 'center'}}>{message}</Text>
					</TouchableHighlight>
					<CheckBox value={this.state.filteringOptions[index].active} onValueChange={() => {this.checkChanged(index)}}/>
				</View>
			)
		});

		return (
			<View style={{height:this.props.height}}>
				<ScrollView>
					{FilteringOptions}
				</ScrollView>
			</View>
		);
	}
};

export default FilterMenu;