import React, {Component} from 'react';
import {  CheckBox } from 'react-native-elements';
import {Text, View, TouchableHighlight, StyleSheet, ScrollView} from 'react-native';
import strings from '../Language/language'
import Amplify, {API, Auth} from 'aws-amplify';
/********************************************************************************************************
	 This component is the toolTip form that will open up when pressing on one of the filter icons in the home screen.
**********************************************************************************************************/

class FilterForm extends React.Component {

	constructor(props) {
		super(props);
		this.getAllTemplates = this.getAllTemplates.bind(this);
		this.checkChanged = this.checkChanged.bind(this);
		this.clearAllFilters = this.clearAllFilters.bind(this);
		this.createTemplatesArray = this.createTemplatesArray.bind(this);
		this.handelRadioChanged = this.handelRadioChanged.bind(this);
  }

    state = {
		filteringOptions :[],
		sortSelection: '',
    }
    
    componentDidMount() {
		strings.setLanguage(this.props.language);
		this.getAllTemplates();
		this.setState({sortSelection: this.props.sortSelect});
	}

	createTemplatesArray(Templates)// a bit code duplicate
	{
		let templatesArray = [];
		if(this.props.hasOwnProperty('activeTemplates'))
		{
			for(let i = 0; i < Templates.length; i++)
			{ //Create the Templates array in the state.
				let temp = {
					name:'',
					template_ID: 0,
					active: true
				};

				temp.name = (Templates[i])['Template_Name'];
				temp.template_ID = (Templates[i])['Template_ID'];
				temp.active = this.props.activeTemplates.includes(temp.template_ID);
				templatesArray.push(temp);
			}
			let tempAll = {
				name:'All',
				template_ID: null,
				active: this.props.activeTemplates.includes('All')
			};

			templatesArray.push(tempAll);
		}
		
		this.setState({filteringOptions:templatesArray});
	}

	//code duplicate
	getAllTemplates(){
		//This will create a post request to the backend to get the available templates.
		API.post('SendRequest', '/sendReq', {body:{type:'GAT'}}).then((response) => { //GAT = Get All Templates
			//Check response validity with hasOwnProperty
			if(!response.hasOwnProperty("Items"))
				throw new DBDocumentNotFoundErr
			let Items = response.Items;
			this.createTemplatesArray(Items);
		}).catch((err) => {
			//TODO: error handling.
			console.log(err);
		});
	}

	checkChanged(index)
	{
		let activeFilters = this.state.filteringOptions;
		let filters = [];
		let indexOfAll = activeFilters.length -1;
		//change the active value of the filter
		activeFilters[index].active = !activeFilters[index].active;

		if(activeFilters[index].active)
		{ 
			if(activeFilters[index].name === 'All') //we purposely check All
			{ //we  will remove all other filter and leave only the All filter.//we  will remove all other filter and leave only the All filter.
				activeFilters = this.clearAllFilters();
			}
			else
			{ //if the all option was check and then the user choose another option so the all option should be cleared
				activeFilters[indexOfAll].active = false;
			}
		}
		//create filters array for the HomeScreen (it filters by strings)
		for(let i = 0; i < activeFilters.length; i++)
		{ //it checks if the filter is active and if so it add it to the array.
			if(activeFilters[i].active)
				filters.push(activeFilters[i].template_ID);
		}

		if(filters.length === 0) //we didn't apply any filter so we need to auto select all lists.
		{
			filters.push('All');
			activeFilters[indexOfAll].active = true;
		}

		//save the new filters array
		this.setState({filteringOptions:activeFilters});
		if(this.props.hasOwnProperty('FilterBy'))
			this.props.FilterBy(filters, this.props.category); //invoke FilterBy
	}

	handelRadioChanged(sort){
		this.setState({sortSelection : sort});
		this.props.SortBy(sort,this.props.category );//invoke sortBy
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

    render(){ 
        let FilteringOptions = this.state.filteringOptions.map((option, index) => {
			let checkBoxTitle = option.name;
			return(
				<View  key={index} style = {styles.checkWrapperStyle}>
					<CheckBox checked={this.state.filteringOptions[index].active}
							  checkedColor={'#107dac'}
							  textStyle={styles.tileTextStyle}
							  containerStyle ={styles.checkContainer}
							  title={checkBoxTitle}
							  onIconPress={() => {this.checkChanged(index)}}/>
				</View>
			)
		}); 
        return(
        	<View style={{flex:1}}>
				<ScrollView contentContainerStyle = {styles.container} style={{flex:1}}>
					<Text style = {styles.labelTextStyle}>Show me: </Text>
					<View>{FilteringOptions}</View>
					<Text style = {styles.labelTextStyle}>Order by: </Text>
					<View>
						<CheckBox checked={this.state.sortSelection === 'name'}
								  checkedIcon='dot-circle-o'
								  uncheckedIcon='circle-o'
								  checkedColor={'#107dac'}
								  textStyle={styles.tileTextStyle}
								  containerStyle ={styles.checkContainer}
								  title={'Name'}
								  onIconPress={() => {this.handelRadioChanged('name')}}/>
						<CheckBox checked={this.state.sortSelection === 'date'}
								  checkedIcon='dot-circle-o'
								  uncheckedIcon='circle-o'
								  checkedColor={'#107dac'}
								  textStyle={styles.tileTextStyle}
								  containerStyle ={styles.checkContainer}
								  title={'Last Opened'}
								  onIconPress={() => {this.handelRadioChanged('date')}}/>
					</View>
				</ScrollView>
			</View>
        )
    }
}

export default FilterForm

const styles = StyleSheet.create({
    container: {
		justifyContent: 'flex-start',
		alignItems: 'flex-start'
	},
	checkWrapperStyle:{
		padding: 0
	},
	checkContainer:{
		height: 10,
		width: 200,
		backgroundColor: 'transparent',
		margin: 2,
		borderWidth: 0,
	},
	labelTextStyle: {
		fontSize : 18,
		fontWeight : 'bold',
		color: 'black'
	},
	tileTextStyle: {
		fontSize : 16,
		fontStyle : 'normal',
	},
})