import React from 'react';
import {
	StyleSheet,
	Text,
	View,
	TextInput,
	CheckBox,
	ScrollView,
	ActivityIndicator,
	Alert
} from 'react-native';
import { StackActions, NavigationActions } from 'react-navigation';
import {Icon} from "react-native-elements";
//Custom Components
import DateInput from '../Components/DateInput';
import PriceInput from "../Components/PriceInput";
//Error Imports
import DBDocumentNotFoundError from '../Errors/DBDocumentNotFoundError'
//Import Language
import strings from '../Language/language'
//Backend Integration
import Amplify, {API, Auth} from 'aws-amplify';
import ListPanelHeader from '../Components/ListPanelHeader'


class ItemViewScreen extends React.Component {

	/******************************************************************************************************
	 This Component is a Screen for viewing an item.
	 ******************************************************************************************************/

	static sortFieldsArray(fields)
	{ //we will sort the array by the fieldLocation so they will appear on the screen in the correct order.
		return fields.sort((a, b) => {
			if(a.fieldLocation > b.fieldLocation)
				return 1;
			else if (a.fieldLocation < b.fieldLocation)
				return -1;
			else
				return 0;
		});
	}

	static createTemplateFieldsArray(templateFields, templateFieldsLocation)
	{
		let fields = [];

		for(let p in templateFields)
		{ //iterate through object properties
			let field = new FieldStruct(); //defined at the bottom of the page, simplifying our usage by creating a struct in advance.
			//Item object field population.
			field.type = templateFields[p];
			field.fieldName = p;
			field.fieldValue = ItemViewScreen.templatePreviewDefaultValues(field.type);
			field.fieldLocation = templateFieldsLocation[p];
			//Add item to array.
			fields.push(field);
		}

		return ItemViewScreen.sortFieldsArray(fields); //return correct fields order.
	}

	static templatePreviewDefaultValues(fieldType)
	{
		switch (fieldType) {
			case 'String':
				return '';
			case 'Date':
				return Date.now();
			case 'Boolean':
				return false;
			case 'Price':
				return '0$';
			case 'Assignee':
				return '';
			default:
				return null;
		}
	}

	constructor(props)
	{
		super(props);
		//its bad practice to set the state using '=' but for it to be done in the c'tor it has to be done this way so we compromise.
		//we have to do it in the c'tor for language support.
		this.state.language = props.navigation.state.params.language;
		this.state.templateName = this.props.navigation.state.params.TemplateName;
		//bind the functions to the created component.
		this.getCurrentUser = this.getCurrentUser.bind(this);
		this.getTemplateFields = this.getTemplateFields.bind(this);
		this.populateFields = this.populateFields.bind(this);
		this.determineScreenType = this.determineScreenType.bind(this);
		this.createCompletedFieldsArray = this.createCompletedFieldsArray.bind(this);
		this.textChanged = this.textChanged.bind(this);
		this.checkChanged = this.checkChanged.bind(this);
		this.DatePickerConfirm = this.DatePickerConfirm.bind(this);
		this.backFunction = this.backFunction.bind(this);
		this.softBackFunction = this.softBackFunction.bind(this);
		this.saveItem = this.saveItem.bind(this);
		this.deleteItem = this.deleteItem.bind(this);
		this.rightButtonPressed = this.rightButtonPressed.bind(this);
		//bind get element functions
		this.getHeader = this.getHeader.bind(this);
		this.getFields = this.getFields.bind(this);
		this.getScreenContent = this.getScreenContent.bind(this);
		this.createPriceInputElement = this.createPriceInputElement.bind(this);
		this.createDateInputElement = this.createDateInputElement.bind(this);
		this.createTextInputElement = this.createTextInputElement.bind(this);
		this.createCheckBoxElement = this.createCheckBoxElement.bind(this);
		this.getDeleteIcon = this.getDeleteIcon.bind(this);
		this.getEditIcon = this.getEditIcon.bind(this);
		this.getSaveIcon = this.getSaveIcon.bind(this);
	}

	state = {
		isLoading:true,
		language: strings.getInterfaceLanguage(),
		fields:[],
		LoggedInUser: '',
		templateID:"0",
		itemName:'',
		newItem:false,
		templatePreview: false,
		itemID:"0",
		listID:"0",
		edit:false,
		fieldStyle: styles.fieldStyleDisabled,
		permissions: '',
		pageOpenedDate: new Date()
	};

	componentDidMount()
	{
		//First we will get the navigation params.
		const navigationParams = this.props.navigation.state.params;
		//now we will set the language to match  the chosen one.
		strings.setLanguage(this.state.language);
		//this will set the page to un-editable at first unless it is a new item screen.
		let isNewItem = this.state.newItem;
		this.setState({edit:isNewItem});
		//This will get the current user's username
		this.getCurrentUser();
		//Now we will create a post request to the backend to get the template fields to populate the screen.
		let templateID = "0";
		let itemID = 0;
		if(navigationParams.hasOwnProperty('item')) //check if an item was pressed.
		{
			itemID = navigationParams.item['Item_ID'];
			templateID = navigationParams.item['Template_ID'];
			this.setExistingItemScreen(navigationParams, itemID, templateID);
		}
		else
			templateID = this.determineScreenType(navigationParams);
		this.getTemplateFields(templateID, itemID);
	}

	setExistingItemScreen(navigationParams, itemID, templateID)
	{
		let itemName = navigationParams.item.name;
		let listID = navigationParams.listID;
		let permissions = navigationParams.permissions;
		this.setState({itemName:itemName, itemID:itemID, templateID:templateID, listID:listID, permissions:permissions});
	}

	getCurrentUser()
	{
		Auth.currentAuthenticatedUser({bypassCache: false}).then((user) => {
			this.setState({LoggedInUser:user['username']});
		}).catch((err) =>{
			console.log(err);
		});
	}

	getTemplateFields(templateID, itemID)
	{
		API.post('SendRequest','/sendReq', {body:{type:'GTF' ,templateID:templateID}}).then((response) => { //GTF = Get Template Fields
			//Check response validity with hasOwnProperty
			if(!response.hasOwnProperty("Items"))
				throw new DBDocumentNotFoundError();

			let templateFields = (response.Items[0])['Template_Fields']; //Get the template fields object
			let templateFieldsLocations =  (response.Items[0])['Fields_Location'];
			let fields = ItemViewScreen.createTemplateFieldsArray(templateFields, templateFieldsLocations);

			this.setState({fields:fields});
			if(!this.state.newItem && !this.state.templatePreview) //populate fields only if it is an existing item.
				this.populateFields(itemID);
			else if(this.state.newItem) //if this is a new item start editing immediately and don't wait for existing fields population.
				this.setState({isLoading:false, edit:true});
		}).catch((err) => {
			console.log(err);//TODO:Better error handling.
		})
	}

	populateFields(itemID)
	{
		API.post('SendRequest', '/sendReq', {body:{type:'GII', itemID:itemID}}).then((response) => { //GII = Get Item Info
			if(!response.hasOwnProperty("Fields"))
				throw new DBDocumentNotFoundError();

			let completedFields = this.createCompletedFieldsArray(response.Fields);
			completedFields = ItemViewScreen.sortFieldsArray(completedFields); //get correct fields order.
			this.setState({fields:completedFields, isLoading:false});
		}).catch((err) => {
			console.log(err);//TODO: Better error handling.
		})
	}

	createCompletedFieldsArray(itemFields)
	{
		let completedFields = [];

		for(let f in itemFields)
		{
			let field  = this.state.fields.find(obj => {
				return obj.fieldName === f;
			});
			//field.fieldValue = ItemViewScreen.parseFieldValue(itemFields[f], field.type);
			field.fieldValue = itemFields[f];
			completedFields.push(field);
		}

		return completedFields;
	}

	determineScreenType(navigationParams)
	{
		//checks whether this screen is for creating a new item, preview a template item or viewing and modifying an item.
		//and then sets the state accordingly.
		let templateID = 0;
		if(navigationParams.hasOwnProperty('newItem') && navigationParams.newItem && navigationParams.hasOwnProperty('listID'))
		{
			//decides whether this page is for creating a new Item - will not proceed flow to Get Item Info (GII)
			templateID = navigationParams.templateID;
			this.setState({newItem:navigationParams.newItem, listID:navigationParams.listID, templateID:templateID});
		}
		if(navigationParams.hasOwnProperty('templatePreview') && navigationParams.templatePreview)
		{
			//decides whether this page is a preview for the item when creating a new list, will not proceed with GII flow and all fields will be disabled.
			templateID = navigationParams.templateID;
			this.setState({templatePreview:navigationParams.templatePreview});
		}

		if(templateID !== 0)
			return templateID;
		else
			console.log("incorrect template ID"); //TODO:Better error handling.
	}

	determineElement(type, itemIndex)
	{ //Create the corresponding element based on the type from the DB.
		let fieldElement;

		switch(type)
		{
			case 'Text Box':
			case 'TextBox':
			case 'Textbox':
			case 'String':
				fieldElement = this.createTextInputElement(itemIndex);
				break;
			case 'Date':
				fieldElement = this.createDateInputElement(itemIndex);
				break;
			case 'Check Box':
			case 'CheckBox':
			case 'Checkbox':
			case 'Boolean':
				fieldElement = this.createCheckBoxElement(itemIndex);
				break;
			case 'Price':
				fieldElement = this.createPriceInputElement(itemIndex);
				break;
			case 'Number':
				fieldElement = this.createNumberInputElement(itemIndex);
				break;
		}

		return fieldElement;
	}

	createNumberInputElement(itemIndex)
	{
		const styling = {
			...styles.inputBoxStyle,
			width: 150,
		}
		return <TextInput value={this.state.fields[itemIndex].fieldValue}
		                  editable={this.state.edit}
		                  placeholder={strings.EnterTextHere}
		                  onChangeText={(text) => {this.textChanged(text, itemIndex)}}
		                  style={styling}
		                  keyboardType={'numeric'}
				/>;
	}

	createTextInputElement(itemIndex)
	{
		let maxChars = 255;
		if(this.state.fields[itemIndex].fieldName === 'Name')
			maxChars = 50;

		return <TextInput value={this.state.fields[itemIndex].fieldValue}
		                  editable={this.state.edit}
		                  placeholder={strings.EnterTextHere} multiline={true}
		                  onChangeText={(text) => {this.textChanged(text, itemIndex)}}
		                  style={styles.inputBoxStyle}
		                  maxLength={maxChars}
				/>;
	}

	createDateInputElement(itemIndex)
	{
		return <DateInput Date={this.state.fields[itemIndex].fieldValue} Editable={this.state.edit}
		                  DatePickerConfirm={(date) => {this.DatePickerConfirm(date, itemIndex)}} style={this.state.fieldStyle} />;
	}

	createCheckBoxElement(itemIndex)
	{
		return <CheckBox value={this.state.fields[itemIndex].fieldValue}
		                 disabled={!this.state.edit} onValueChange={() => {this.checkChanged(itemIndex)}} style={this.state.fieldStyle}/>;
	}

	createPriceInputElement(itemIndex)
	{
		return <PriceInput editable={this.state.edit} style={this.state.fieldStyle}
		                   value={this.state.fields[itemIndex].fieldValue} onPriceChange={(text) => {this.textChanged(text, itemIndex)}}/>;
	}

	DatePickerConfirm(date, itemIndex)
	{
		let fields = this.state.fields;
		fields[itemIndex].fieldValue = date;
		this.setState({fields:fields});
	}

	softBackFunction()
	{
		//just return to the previous screen without refreshing it.
		const {goBack} = this.props.navigation;//add navigation to and from the screen
		goBack(null)
	};

	getEditIcon()
	{
		return {
			name: 'edit',
			type: 'material',
			function: () => {
				if(!this.state.edit)
					this.setState({edit: true, textInputStyle:styles.fieldStyleEnabled});
			},
			size: 30,
			color: "#fff"
		};
	}

	getDeleteIcon()
	{
		return {
			name: 'delete',
			type: 'material',
			function: () => this.rightButtonPressed("Delete"),
			size: 30,
			color: "#fff"
		};
	}

	getSaveIcon()
	{
		return {
			name: 'save',
			type: 'material',
			function: () => this.rightButtonPressed("Save"),
			size: 30,
			color: "#fff"
		};
	}

	getScreenContent(Fields)
	{
		return this.state.isLoading ? <ActivityIndicator size="large" color='white'/> : <View style={styles.contentContainer}>
																							<ScrollView style={styles.InnerContentContainer} showVerticalScrollIndicator={true}>
																								{Fields}
																							</ScrollView>
																						</View>;
	}

	getFields()
	{
		return this.state.fields.map((a, i) => {
			//This will create the Fields element populate the page. 'i' will be the index in the array, a is the value.
			let fieldElement = this.determineElement(a.type, i);
			return( //The return statement for the render to know how to show this object.
				<View key={i} style={styles.fieldContainer}>
					<Text style={styles.customizedFieldText}>{a.fieldName}</Text>
					{fieldElement}
				</View>
			);
		});
	}

	getHeader(rightIcons)
	{
		return this.state.isLoading ? <ListPanelHeader rightIconsVisible={false}
		                                               headerText={this.state.itemName}
		                                               backIcon={true}
		                                               backFunction={this.backFunction}
									  /> :
										<ListPanelHeader rightIconsVisible={true}
			                                             headerText={this.state.itemName}
                                                         backIcon={true}
										                 backFunction={this.backFunction}
		                                                 rightIcons={rightIcons}
										/>;
	}
	//changing the state requires setting the whole fields array so we need to save it, then change the value and then re-set it in the state.
	textChanged(text, itemIndex)
	{
		let fields = this.state.fields;
		fields[itemIndex].fieldValue = text;
		this.setState({fields:fields});
		fields[itemIndex].fieldName === 'Name' ? this.setState({itemName:text}) : null;
	}

	//changing the state requires setting the whole fields array so we need to save it, then change the value and then re-set it in the state.
	checkChanged(itemIndex)
	{
		let fields = this.state.fields;
		fields[itemIndex].fieldValue = !fields[itemIndex].fieldValue;
		this.setState({fields:fields});
	}

	saveItem()
	{
		let requestType;

		//Determine if we update the item or create a new one (based on if the itemID is a real itemID).
		if(this.state.itemID !== "0")
			requestType = 'ULI'; //ULI = Update List Item
		else
			requestType = 'CLI'; //CLI = Create List Item

		//Create the request body.
		let requestBody = {
			type:requestType,
			item:this.state.fields,
			itemID:this.state.itemID,
			listID:this.state.listID,
			templateID:this.state.templateID
		};

		//Send the request to the backend.
		API.post('SendRequest', '/sendReq', {body:requestBody}).then((response) => {
			if(!response.hasOwnProperty('message'))
				throw new DBDocumentNotFoundError(); //TODO: Change exception type maybe.
			//If it was a new item created then go back to the list screen.
			if(requestType === 'CLI')
				this.backFunction();
		}).catch((err) => {
			alert(err.response.data.message); //TODO: Better error handling.
		});
	}

	rightButtonPressed(buttonPressed)
	{
		//action[0] confirmation message
		//action[1] confirmation function
		let action = this.getConfirmationMessageAndFunction(buttonPressed);

		Alert.alert("", strings.formatString(strings.userConfirmation, action[0]), [
			{
				text: 'Cancel',
				onPress: () => console.log('Cancel Pressed'),
				style: 'cancel',
			},
			{text: 'OK', onPress: action[1]},
		]);
	}

	deleteItem()
	{
		//Create the request body.
		const requestBody = {
			type:'DLI',
			itemID:this.state.itemID,
			listID:this.state.listID
		};
		
		//Send the request to the backend.
		API.post('SendRequest', '/sendReq', {body:requestBody}).then((response) => {
			if(!response.hasOwnProperty('message'))
				throw new DBDocumentNotFoundError(); //TODO: Change exception type maybe.
			//after deletion return to the list screen.
			this.backFunction();
		}).catch((err) => {
			alert(err.response.data.message); //TODO: Better error handling.
		});
	}

	backFunction()
	{
		let navigationParams = this.props.navigation.state.params;
		if(navigationParams.hasOwnProperty('refreshList'))
			navigationParams.refreshList();
		const {goBack} = this.props.navigation;
		goBack(null);
	}

	getConfirmationMessageAndFunction(buttonPressed) {
		switch(buttonPressed)
		{
			case 'Delete':
				return [strings.formatString(strings.deleteTheItem, this.state.itemName), this.deleteItem];
			case 'Save':
				return [strings.formatString(strings.saveTheItem, this.state.itemName), this.saveItem];
			default:
				return ["error", () => alert("error")];
		}
	}

	render()
	{
		//create the rightIcons array with the proper rightIcons.
		const rightIcons = [this.getSaveIcon()];
		if(!this.state.newItem)
			rightIcons.push(this.getEditIcon());
		if(this.state.permissions === 'Manager' || this.state.permissions === 'Owner')
			rightIcons.push(this.getDeleteIcon());

		//create the field elements.
		let Fields = this.getFields();
		//Choose whether we show the activity indicator or the fields after they are populated.
		let screenContent = this.getScreenContent(Fields);
		//Choose the type of header.
		let header = this.getHeader(rightIcons);

		return (
			<View style={styles.mainWindow}>
				{header}
				<View style={styles.container}>
					{screenContent}
				</View>
			</View>
		);
	}
}

export default ItemViewScreen;


function FieldStruct(type, fieldName, fieldValue, fieldLocation)
{
		this.type = type;
		this.fieldName = fieldName;
		this.fieldValue = fieldValue;
		this.fieldLocation = fieldLocation;
}

const styles = StyleSheet.create({
	mainWindow:{
		flex: 1,
		backgroundColor: 'whitesmoke'
	},
	container: {
		flex: 10,
		flexDirection: 'column',
		backgroundColor: '#87cefa',
	},
	fieldStyleDisabled:{
		borderColor: '#65666b',
		borderBottomWidth: 1,
		flex:1,
		textAlignVertical:'top'
	},
	fieldStyleEnabled:{
		borderColor: '#000',
		borderBottomWidth: 1,
		flex:1,
		textAlignVertical:'top'
	},
	contentContainer: {
		backgroundColor: '#b9e1fa',
		display: 'flex',
		margin: 10,
		borderRadius: 10,
		elevation: 5,
	},
	InnerContentContainer: {
		margin: 10,
	},
	customizedFieldText: {
		fontSize: 18,
		color: 'gray',
	},
	fieldContainer: {
		backgroundColor: '#d7eefc',
		borderRadius: 5,
		padding: 5,
		margin: 5,
	},
	inputBoxStyle: {
		height: 40,
		borderRadius: 10,
		elevation: 5,
		width: '100%',
		marginTop: 5,
		marginBottom: 5,
		textAlign: 'left',
		paddingLeft: 15,
		backgroundColor: 'white',
		borderColor: 'white',
	}
});