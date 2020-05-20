import React from 'react';
import { View, ActivityIndicator, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Overlay, Input, Image, Button, CheckBox, ListItem, Text } from 'react-native-elements';
import strings from '../Language/language';
import images from '../src/images.js';
import Amplify, {API, Auth} from 'aws-amplify';
import UserAlert from "../Components/UserAlert";
import ListPanelHeader from "../Components/ListPanelHeader";

class CreateCustomizedTemplateScreen extends React.Component {

	/******************************************************************************************************
	 This Component is a Screen for creating a Customized template to create a list from.
	 ******************************************************************************************************/
    constructor(props)
	{
		super(props);
		//its bad practice to set the state using '=' but for it to be done in the c'tor it has to be done this way so we compromise.
		//we have to do it in the c'tor for language support.
		this.state.language = props.navigation.state.params.language;
		this.checkChanged = this.checkChanged.bind(this);
		this.addNewFieldButtonPressed = this.addNewFieldButtonPressed.bind(this); 
		this.closeButtonInOverlayPressed = this.closeButtonInOverlayPressed.bind(this); 
		this.addButtonPressed = this.addButtonPressed.bind(this);
		this.fieldNameInputChanged = this.fieldNameInputChanged.bind(this);
		this.templateNameInputChanged = this.templateNameInputChanged.bind(this);
		this.doneButtonPressed = this.doneButtonPressed.bind(this);
	}

	state = {
		loggedInUser:"",
		templateName:"",
		isLoading: false,
		templateFields: [{Name:'Name', fieldType:'Text Box', fieldLocation:1}],
    	language: strings.getInterfaceLanguage(),
    	overlayVisible : false,
    	fieldsOptions: [{name:'Text Box', uri:images.textBox}, {name: 'Date',uri:images.date}, {name:'Check Box',uri:images.checkBox}, {name: 'Price', uri:images.price}],
		chosenField: {name:'Text Box', uri:images.textBox},
		currentFieldName: "",
		currentFieldType: "",
		currentFieldLocation: 2,
		finishedCreation: false,
		endMessage: ''
  };

    componentDidMount(){
		//We will change the language to match the selected one.
		strings.setLanguage(this.state.language);
		this.setState({isLoading:true});
	}

	getCurrentUser(){
		Auth.currentAuthenticatedUser({bypassCache: false}).then((user) => {
			this.setState({LoggedInUser:user['username']});
		}).catch((err) =>{
			console.log(err);
		});
	}
	
	addButtonPressed(index){
		let fields =  this.state.templateFields;
		if(this.state.currentFieldName !== ""){
			this.setState((prevState) => ({
				currentFieldLocation: prevState.currentFieldLocation + 1
			
		  }));
		
			let newTamplateField = {Name: this.state.currentFieldName, fieldType: this.state.chosenField.name, fieldLocation: this.state.currentFieldLocation}
			if(newTamplateField.fieldType !== "" && newTamplateField.Name !== "" ){
				fields.push(newTamplateField);
				this.setState({templateFields:fields, currentFieldName: "", overlayVisible: false});
		    }    
		}
	}
	
	addNewFieldButtonPressed() {
		this.setState({overlayVisible: true});
	}

	closeButtonInOverlayPressed(){
		this.setState({overlayVisible: false});
	}
	
	fieldNameInputChanged(text){
		this.setState({currentFieldName: text})
	}
	
	templateNameInputChanged(text){
		this.setState({templateName: text})
	}
	
	doneButtonPressed(){
		if(this.state.templateName !== "")	{
			const { loggedInUser, templateFields, templateName} = this.state;
			API.post('SendRequest', '/sendReq', { //CNCT = Create New Customized Template
				body:{
					type: "CNCT",
					Analyzeable : false,
					Fields_Location : this.getLocationsArray(),
					Owner: loggedInUser,
					Template_Fields: templateFields,
					Template_Name: templateName
				}
			}).then(() => {
				this.setState({isLoading:false});
				this.onSuccessfulCreation();
			}).catch((err) => {
				this.setState({isLoading:false});
				this.onFailedCreation(err);
			});
		}
	}

	closeModal = () => {
		this.setState({finishedCreation:false}, () => {
			if(this.state.endMessage === "Template added successfully")
			{
				const navigate = this.props.navigation.navigate; //create navigate method definition.
				navigate('Home');
			}
		});
	};

	//new
	onFailedCreation(err){
		this.setState({finishedCreation: true, endMessage: "Failed to create template"});
		setTimeout(this.closeModal, 7000);
	}

	//new
	onSuccessfulCreation(){
		this.setState({finishedCreation: true, endMessage: "Template added successfully"});
		setTimeout(this.closeModal, 7000);
	}

	//new
	getLocationsArray()
	{
		this.state.templateFields.map((field, index) => {
			let locationsArray = [];
			locationsArray.push({Name: field.name ,Location:field.fieldLocation})
			return locationsArray;
			}
		)
	}

	checkChanged(index)
	{
		this.setState({chosenField : this.state.fieldsOptions[index]});
	}

    render(){
        let TemplateOptions = this.state.fieldsOptions.map((option, index) => {
			let checkBoxTitle = option.name;
			return(
				<View key={index} style = {styles.checkWrapperStyle}>
					<CheckBox checked={this.state.chosenField.name === option.name} checkedColor={'#107dac'} textStyle={styles.titleTextStyle} containerStyle ={styles.checkContainer} title={checkBoxTitle} onIconPress={() => {this.checkChanged(index)}}/>
				</View>
			)
		}); 
		let templateItems = this.state.templateFields.map((field, key) => {
			return(			
			<ListItem
			  key={key}
			  title={field.Name}
			  subtitle={field.fieldType}
			  bottomDivider
			/>
			)
		   }
		  );	
        return(
			<View style={styles.container}>
				<ListPanelHeader 
					headerText={'Custom Template'}
					rightIconsVisible={false}
					backFunction={() => {const {goBack} = this.props.navigation;//add navigation to and from the screen
					goBack(null)}}
				/>
				<View style={styles.mainContainer}>
					<View style={styles.templateNameContainer}>
						<Text style={styles.templateName}>Template Name:</Text>
						<TextInput 
							style={styles.templateNameInput}
							onChangeText={text => this.templateNameInputChanged(text)} 
							value={this.state.templateName} 
							placeholder={"Enter a name"}
						/>
					</View>
					{/* <Input label="Template Name:" onChangeText={(text) => {this.templateNameInputChanged(text)}} value={this.state.templateName}/> */}
					<View style={styles.listContainer}>
						
						<Text style={styles.currentItemsTitle}>Current Template Fields:</Text>
						<ScrollView>
							{templateItems}
						</ScrollView>
					</View>
					<View style={styles.buttonContainer}>
						<Button title="Add New Field" onPress={this.addNewFieldButtonPressed}/>
						<Overlay isVisible = {this.state.overlayVisible} windowBackgroundColor="rgba(255, 255, 255, 0.5)" overlayBackgroundColor="white" width="auto" height="auto">
							<View style={styles.overlayContainer}>
								<View style={{flex: 1}}>
									<Input label="Field Name :" onChangeText={(text)=>{this.fieldNameInputChanged(text)}} value={this.state.currentFieldName} />
								</View>
								<View style={styles.imageContainer}>
									<View style={{marginBottom: 40, justifyContent: 'flex-start'}}>
										{TemplateOptions}
									</View>
									<Image source={this.state.chosenField.uri} style={styles.ImageContainer}  PlaceholderContent={<ActivityIndicator />}/>
								</View>
								<View style={styles.buttonContainer}>
									<View style={{width: 150}}>
										<Button title="Add" onPress={this.addButtonPressed}/>
									</View>
									<View style={{width: 70}}>
										<Button title="Close" onPress={this.closeButtonInOverlayPressed}/>
									</View>
								</View>
							</View>
						</Overlay>
						<View style={{width: 80}}>
							<Button title="Done" onPress={this.doneButtonPressed} />
						</View>
					</View>
					<UserAlert closeModal={this.closeModal} finishedCreation={this.state.finishedCreation} endMessage={this.state.endMessage}/>
				</View>
			</View>
		);
    }
}

export default CreateCustomizedTemplateScreen

const styles = StyleSheet.create({
    container: {
		flex: 1,
		// justifyContent: 'flex-start',
		// alignItems: 'flex-start',
	},
	mainContainer: {
		flex: 1,
		flexDirection: 'column',
		backgroundColor: '#87cefa',
	},
	imageContainer: {
		flex: 10,
		margin: 10,
		justifyContent: 'center',
	},
	buttonContainer: {
		flex: 1,
		flexDirection: 'row',
		backgroundColor: 'yellow',
	},	
	currentItemsTitle: {
		textAlign: 'center',
		fontSize: 20,
		fontWeight: 'bold',
	},
	overlayContainer: {
	},
	templateNameContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	templateName: {
		fontSize: 18,
		fontWeight: 'bold',
		// marginLeft: 10,
	},
	templateNameInput: {
		backgroundColor: 'white',
		borderRadius: 5,
		marginLeft: 5,
		marginTop: 10,
		width: 200,
		height: 40,
		borderColor: '#787878',
		elevation: 5
	},
	listContainer: {
		flex: 10,
		flexDirection: 'column',
		margin: 15,
		padding: 10,
		borderRadius: 5,
		backgroundColor: 'blue',
		backgroundColor: '#b9e1fa',
		elevation: 5,
	},
	buttonContainer: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'flex-start',
	},
	checkWrapperStyle:{
		display: 'flex',
		alignItems : 'center',
		justifyContent: 'center',
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
	titleTextStyle: {
		fontSize : 16,
		fontStyle : 'normal',
	},
	checkBoxesContainer:{
		display: 'flex',
		alignItems : 'center',
		justifyContent: 'center',
	},
	ImageContainer:{
		height: 300,
		width: 300,
	}
})