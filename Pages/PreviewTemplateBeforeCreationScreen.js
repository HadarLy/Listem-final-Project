import React from 'react';
import {
	StyleSheet,
	Text,
	View,
	TextInput,
	CheckBox,
	TouchableOpacity,
	ScrollView,
	KeyboardAvoidingView,
	TouchableHighlight,
	Modal, TouchableWithoutFeedback
} from 'react-native';
import { StackActions, NavigationActions } from 'react-navigation';
import {Icon} from "react-native-elements";
//Custom Components
import PriceInput from "../Components/PriceInput";
import MyHeader from '../Components/MyHeader';
import DateInput from "../Components/DateInput";
//Import Language
import strings from '../Language/language'
//Import Errors
import DBDocumentNotFoundError from '../Errors/DBDocumentNotFoundError'
//Backend Integration
import Amplify, {API, Auth} from 'aws-amplify';
import UserAlert from "../Components/UserAlert";

class PreviewTemplateBeforeCreationScreen extends React.Component {

	/******************************************************************************************************
	 This Component is a Screen for previewing how a template look before creating a list.
	 ******************************************************************************************************/

	constructor(props)
	{
		super(props);
		//its bad practice to set the state using '=' but for it to be done in the c'tor it has to be done this way so we compromise.
		//we have to do it in the c'tor for language support.
		this.state.language = props.navigation.state.params.language;
		this.state.templateName = this.props.navigation.state.params.TemplateName;
		//bind the functions to the created component.
		this.onFailedCreation = this.onFailedCreation.bind(this);
		this.onSuccessfulCreation = this.onSuccessfulCreation.bind(this);
		this.onCreateListButtonClicked = this.onCreateListButtonClicked.bind(this);
		this.getCurrentUser = this.getCurrentUser.bind(this);
		this.getTemplateFields = this.getTemplateFields.bind(this);
		this.listCreated = this.listCreated.bind(this);
	}

	state = {
		isLoading:true,
		language: strings.getInterfaceLanguage(),
		fields:[],
		fieldTypes:[],
		date: new Date(),
		LoggedInUser: '',
		ListName:'',
		templateID:0,
		endMessage: '',
		finishedCreation: false
	};

	getCurrentUser()
	{
		Auth.currentAuthenticatedUser({bypassCache: false}).then((user) => {
			this.setState({LoggedInUser:user['username']});
		}).catch((err) =>{
			console.log(err);
		});
	}

	getTemplateFields(templateID)
	{
		API.post('SendRequest','/sendReq', {body:{type:'GTF' ,templateID:templateID}}).then((response) => { //GTF = Get Template Fields
			//Check response validity with hasOwnProperty
			if(!response.hasOwnProperty("Items"))
				throw new DBDocumentNotFoundError();
			let templateInfo = response.Items[0]; //Get the item in the 0th position (first)
			let templateFields = templateInfo['Template_Fields']; //Get the template fields object
			let fields = [];
			let fieldTypes = [];

			for(let p in templateFields)
			{ //iterate through object properties
				fields.push(p);
				fieldTypes.push(templateFields[p]);
			}

			this.setState({fields:fields, fieldTypes:fieldTypes, isLoading:false});
		}).catch((err) => {
			console.log(err);//TODO:Better error handling.
		})
	}

	componentDidMount() {
		//First we will get the template ID and language we got from the navigator params.
		let { templateID } = this.props.navigation.state.params;
		this.setState({templateID});
		//now we will set the language to match  the chosen one.
		strings.setLanguage(this.state.language);
		//This will get the current user's username
		this.getCurrentUser();
		//Now we will create a post request to the backend to get the template fields to populate the screen.
		this.getTemplateFields(templateID);
	}

	determineElement(type)
	{ //Create the corresponding element based on the type from the DB.
		let fieldElement;
		const styling = {
			...styles.enterListNameStyle,
			margin: 5,
			width: 200,
			textAlign: 'left',
			paddingLeft: 15,
			backgroundColor: '#D3D3D3',
			borderColor: '#D3D3D3',
		};
		if(type === 'String' || type === "TextBox" || type === "Text Box" || type === "Textbox")
		{

			fieldElement =
				<TextInput style={styling} value={strings.Text} editable={false}/>;
		}
		else if(type === 'Date')
		{
			fieldElement =
				<DateInput style={{height:50, margin: 5}} date={this.state.date} editable={false}/>;
		}
		else if(type === 'Boolean' || type === "Check Box" || type === "CheckBox" || type === "Checkbox")
		{
			fieldElement =
				<CheckBox/>;
		}
		else if(type === 'Price')
		{
			fieldElement = <PriceInput editable={false}/>
		}
		else if(type === 'Number')
		{
			fieldElement = <TextInput editable={false}
									  placeholder={'0'}
									  style={styling}
									  keyboardType={'numeric'}
							/>;
		}

		return fieldElement;
	}

	render() {
		const Fields = this.state.fields.map((a, i) => {
			//This will create the Fields element populate the page. 'i' will be the index in the array, a is the value.
			const fieldElement = this.determineElement(this.state.fieldTypes[i]);
			return( //The return statement for the render to know how to show this object.
				<View key={i} style={styles.fieldContainer}>
					<Text style={styles.customizedFieldText}>{a}</Text>
					{fieldElement}
				</View>
			);
		});
		const { ListName, templateName } = this.state;

		let endMessage = this.getEndMessage();
		return (
			
			<View style={styles.mainWindow}>
				<MyHeader
					text={strings.formatString(strings.PreviewTemplateFields, templateName)}
					backIcon={true}
					rightIconsVisible={false} backFunction={() => {const {goBack} = this.props.navigation;//add navigation to and from the screen
					goBack(null)}}
				/>
				<View style={styles.top}>
					<TextInput style={styles.enterListNameStyle}
							onChangeText={ListName => this.setState({ListName})} value={ListName}
								placeholder={strings.EnterListName}/>
					<Text style={styles.listPreviewTitle}>List Preview:</Text>
				</View>
				<View style={styles.container}>
					<ScrollView style={styles.innerContentContainer}>
						{Fields}
					</ScrollView>
				</View>
				<View style={styles.bottom}>
					<TouchableHighlight style={styles.myButton} onPress={this.onCreateListButtonClicked}>
						<Text style={styles.buttonText}>{strings.CreateList}</Text>
					</TouchableHighlight>
				</View>
				{endMessage}
			</View>
		);
	}

	getEndMessage = () => {
		return <UserAlert closeModal={this.closeModal}
						  finishedCreation={this.state.finishedCreation}
						  endMessage={this.state.endMessage}/>
	};

	closeModal = () => {
		this.setState({finishedCreation:false}, () => {
			if(this.state.endMessage === strings.formatString(strings.SuccessfullyCreatedList, this.state.ListName))
			{
				const navigate = this.props.navigation.navigate; //create navigate method definition.
				navigate('Home');
			}
		});
	};

	onCreateListButtonClicked()
	{
		const { LoggedInUser, ListName, templateID } = this.state;
		this.setState({isLoading:true});
		//Create a post request to the backend to create a list.
		API.post('SendRequest', '/sendReq', { //CNLFT = Create New List From Template
			body:{
				type: "CNLFT",
				creator: LoggedInUser,
				listName: ListName,
				templateID: templateID,
				isPersonal: false
			}
		}).then(this.listCreated)
		  .catch((err) => {
			this.setState({isLoading:false});
			this.onFailedCreation(err);
		});
	}

	listCreated = () => {
		this.setState({isLoading:false});
		this.onSuccessfulCreation();
	};

	onSuccessfulCreation = () => {
		const back = this.props.navigation.state.params.back;
		if(this.props.navigation.state.params.hasOwnProperty("back"))
			back();

		this.setState({endMessage:strings.formatString(strings.SuccessfullyCreatedList, this.state.ListName), finishedCreation:true});
		setTimeout(() => {
			this.closeModal();
		}, 7000);
	};

	onFailedCreation(err){
		console.log(err);
		this.setState({endMessage:strings.formatString(strings.FailedToCreateList, this.state.ListName), finishedCreation:true});
		setTimeout(() => {
			this.closeModal();
		}, 7000);
	}
}

export default PreviewTemplateBeforeCreationScreen;

const styles = StyleSheet.create({
	mainWindow:{
		flex: 1,
		justifyContent: 'center',
		backgroundColor: '#87cefa'
	},
	container: {
		flex: 11,
		flexDirection: 'column',
		display: 'flex',
		// alignItems: 'center',
		margin: 10,
		backgroundColor: '#b9e1fa',
		borderRadius: 10,
		elevation: 5
	},
	Head: {
		fontSize: 20,
		textAlign: 'center',
		margin:1
	},
	bottom: {
		display: 'flex',
		alignItems: 'flex-end',
	},
	myButton:{
		margin:5,
		backgroundColor:'#22a6b3',
		borderRadius: 3,
		elevation: 5,
		alignItems: 'center',
		height:50,
		width:100,
		shadowColor: '#000',
		shadowOffset: {width: 0, height: 2},
		shadowOpacity: 0.8,
		shadowRadius: 2
	},
	buttonText:{
		display: 'flex',
		marginTop: 10,
		color:'white',
		fontFamily: 'open-sans',
		fontSize: 18
	},
	top:{
		flex: 2,
		marginTop: 10,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
	},
	enterListNameStyle:{
		height: 40,
		width: 150,
		borderColor:'#787878',
		borderRadius: 10,
		borderWidth: 1,
		backgroundColor: 'white',
		elevation: 5,
		textAlign: 'center',
	},
	customizedFieldText: {
		fontSize: 18,
		color: 'gray',
	},
	listPreviewTitle: {
		fontSize: 25,
		fontWeight: 'bold',
		marginTop: 10,
	},
	innerContentContainer: {
		margin: 10,	
	},
	fieldContainer: {
		backgroundColor: '#d7eefc',
		borderRadius: 5,
		padding: 5,
		margin: 5,
	},
	endMessage:{
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(189, 195, 199, 0.8)'
	},
	endMessageBox:{
		width: 250,
		height: 110,
		backgroundColor: 'white',
		borderRadius: 10,
		elevation: 10
	},
	endMessageText:{
		fontSize: 20,
		fontWeight: 'bold',
		textAlign: 'left',
		textAlignVertical: 'center',
		padding: 10
	},
	okButton: {
		alignItems:'flex-end'
	},
	okButtonText: {
		textAlign:'left',
		textAlignVertical:'center',
		padding:30,
		color:'green'
	}
});