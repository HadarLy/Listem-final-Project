import React from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import { StackActions, NavigationActions } from 'react-navigation';
import styles from '../Styles/mainStyles'
//Custom Components
import ListPanel from  '../Components/ListPanel'
import MyHeader from "../Components/MyHeader";
//Import Errors
import DBDocumentNotFoundError from '../Errors/DBDocumentNotFoundError'
//Import Language
import strings from '../Language/language'
//Backend Integration
import Amplify, {API, Auth} from 'aws-amplify';
import { Button } from 'react-native-elements';

//type Props = {};

class NewListScreen extends React.Component {

	/******************************************************************************************************
	 This Component is a Screen for choosing a template to create a list from.
	 ******************************************************************************************************/

	static createTemplatesArray(Templates)
	{
		let templatesArray = [];

		for(let i = 0; i < Templates.length; i++)
		{ //Create the Templates array in the state.
			let temp = {
				name:'',
				template_ID:0
			};

			temp.name = (Templates[i])['Template_Name'];
			temp.template_ID = (Templates[i])['Template_ID'];
			templatesArray.push(temp);
		}

		return templatesArray;
	}

	constructor(props)
	{
		super(props);
		//its bad practice to set the state using '=' but for it to be done in the c'tor it has to be done this way so we compromise.
		//we have to do it in the c'tor for language support.
		this.state.language = props.navigation.state.params.language;
		this.templateChosen = this.templateChosen.bind(this);
		this.getAllTemplates = this.getAllTemplates.bind(this);
		this.backFunction = this.backFunction.bind(this);
		this.searchBy = this.searchBy.bind(this);
		this.refreshButtonPressed = this.refreshButtonPressed.bind(this);
		this.customizedTemplateButtonPressed = this.customizedTemplateButtonPressed.bind(this);
	}

	state = {
		isLoading:false,
		templates: [],
		filteredTemplates: [],
		language: strings.getInterfaceLanguage()
	};

	componentDidMount()
	{
		//We will change the language to match the selected one.
		strings.setLanguage(this.state.language);
		this.setState({isLoading:true});
		this.getAllTemplates();
	}

	getAllTemplates()
	{
		//This will create a post request to the backend to get the available templates.
		API.post('SendRequest', '/sendReq', {body:{type:'GAT'}}).then((response) => { //GAT = Get All Templates
			//Check response validity with hasOwnProperty
			if(!response.hasOwnProperty("Items"))
				throw new DBDocumentNotFoundError();
			let Items = response.Items;
			let templates = NewListScreen.createTemplatesArray(Items);

			this.setState({templates:templates, filteredTemplates:templates, isLoading:false});
		}).catch((err) => {
			//TODO: error handling.
			console.log(err);
		});
	}

	templateChosen(item)
	{
		const {navigate} = this.props.navigation;
		const { refreshViewOnBack } = this.props.navigation.state.params;
		let navigationParams = { TemplateName:item.name,
			templateID:item.template_ID,
			language:this.state.language,
			back:refreshViewOnBack};
		navigate('PreviewTemplateBeforeCreationScreen', navigationParams);
	}

	backFunction()
	{
		if(this.props.navigation.state.params.hasOwnProperty('refreshViewOnBack'))
			this.props.navigation.state.params.refreshViewOnBack();
		const {goBack} = this.props.navigation;
		goBack(null)
	}

	searchBy(text)
	{
		let filteredTemplates = this.state.templates;

		if(text !== '')
		{
			let search = new RegExp('^' + text, 'i');
			filteredTemplates = filteredTemplates.filter((item) => {
				if(search.test(item.name))
					return item;
			});
		}

		this.setState({filteredTemplates:filteredTemplates});
	}

	refreshButtonPressed()
	{
		this.setState({templates:[], filteredTemplates:[]});
		this.getAllTemplates();
	}

	customizedTemplateButtonPressed(){
		const {navigate} = this.props.navigation;
		navigate('CreateCustomizedTemplateScreen', {language:this.state.language});
	}

	render()
	{
		return (
			<View style={styles.mainWindow}>
				<View style={styles.FlatListContainer}>
					<ListPanel data={this.state.filteredTemplates}
					           backFunction={this.backFunction}
					           rightIconsVisible={false}
					           itemFunction={this.templateChosen}
					           refreshRequested={this.refreshButtonPressed}
					           refreshing={this.state.isLoading}
					           searchBy={(text) => {this.searchBy(text);}}
					           headerText={strings.CreateList}
					           menuType={"Templates"}
					           keyName={'template_ID'}
					/>
				</View>
				<Button title="Create Customized template" onPress={this.customizedTemplateButtonPressed}/>
			</View>
		);
	}
}

export default NewListScreen;