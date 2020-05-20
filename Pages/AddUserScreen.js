import React from 'react';
import { StyleSheet, View, ActivityIndicator, BackHandler} from 'react-native';
import { StackActions, NavigationActions } from 'react-navigation';
import { Icon } from 'react-native-elements';
//Custom Components
import MyHeader from '../Components/MyHeader';
import ListPanel from '../Components/ListPanel';
//Error Imports
import DBDocumentNotFoundError from '../Errors/DBDocumentNotFoundError'
//Import Language
import strings from '../Language/language'
//Backend Integration
import Amplify, {API, Auth} from 'aws-amplify';
import ActionButton from "react-native-action-button";
import ListPanelHeader from "../Components/ListPanelHeader";
import UserAlert from "../Components/UserAlert";

//type Props = {};

class AddUserScreen extends React.Component {

	/******************************************************************************************************
	 This Component is the screen for managing the list's users.
	 ******************************************************************************************************/

	constructor(props)
	{
		super(props);
		while(!props.navigation.state.params.contacts.loaded); //wait until all the contact are loaded.
		this.state.availableUsers = props.navigation.state.params.contacts.contactsList;
		this.state.filteredAvailableUsers = props.navigation.state.params.contacts.contactsList;
		this.state.listID = props.navigation.state.params.listID;
		this.state.templateID = props.navigation.state.params.templateID;
		this.state.listName = props.navigation.state.params.listName;
		//Binding functions
		this.userPressed = this.userPressed.bind(this);
		this.addUsersToList = this.addUsersToList.bind(this);
		this.backFunction = this.backFunction.bind(this);
	}

	state = {
		language:'en-US',
		isLoading: false,
		availableUsers: [],
		filteredAvailableUsers: [],
		listName: '',
		listID: '',
		templateID: '',
		selectedUsers: [],
		finishedAdding: false,
		endMessage: ''
	};

	componentDidMount() {
		strings.setLanguage(this.state.language);
		this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.removeUserMarkers)
	}

	componentWillUnmount() {
		this.backHandler.remove();
	}

	render() {
		const loadingAnimation = <ActivityIndicator size="large" color='white'/>;
		let header = this.getListHeader();

		return (
			<View style={styles.mainWindow}>
				{header}
				<View style={styles.FlatListContainer}>
					<ListPanel
						data={this.state.filteredAvailableUsers}
						rightIconsVisible={false}
						itemFunction={this.userPressed} //create select user
						searchBy={(text) => {this.searchBy(text);}}
						refreshRequested={this.refreshRequested}
						refreshing={this.state.isLoading}
						headerText={strings.formatString(strings.totalSelected, this.state.selectedUsers.length)}
						menuType={ListPanel.menuTypes.AddUser}
						keyName={'phoneNumber'} //Add unique key
					/>
					{this.state.listLoading && loadingAnimation}
				</View>
				<UserAlert closeModal={this.closeModal} finishedCreation={this.state.finishedAdding} endMessage={this.state.endMessage}/>
			</View>
		);
	}

	refreshRequested()
	{

	}

	userPressed(user)
	{
		let selected = this.state.selectedUsers;
		//if the row doesn't have the style property yet add it.
		if(user.hasOwnProperty('style'))
			user.style.backgroundColor = user.style.backgroundColor === 'white' ? 'grey' : 'white'; //choose between the white and grey colors to alternate between selected and not selected.
		else
			user.style = {backgroundColor:'grey'}; //first time is always a select

		//check if the user is already selected
		if(selected.includes(user.phoneNumber))
		{ //if so  then remove him from the array
			let indexOfUser = selected.indexOf(user.phoneNumber);
			selected.splice(indexOfUser, 1);
		}
		else
			selected.push(user.phoneNumber);

		//save selected in state.
		this.setState({selectedUsers: selected});
	}

	searchBy(text)
	{
		let filteredContacts = this.state.availableUsers;

		if(text !== '')
		{
			let search = new RegExp('^' + text, 'i');
			filteredContacts = filteredContacts.filter((item) => {
				if(search.test(item.name))
					return item;
			});
		}

		this.setState({filteredAvailableUsers:filteredContacts});
	}

	backFunction()
	{
		this.removeUserMarkers();
		const {goBack} = this.props.navigation;
		goBack(null);
	};

	removeUserMarkers = () => {
		//deleted selected and change the row background color to white.
		let users = this.state.availableUsers;

		for(let i = 0; i < users.length; i++)
			users[i].style = {backgroundColor:'white'};
		this.setState({availableUsers:users, filteredAvailableUsers:users});
	};

	getListHeader()
	{
		//If the user selected some people show the add button at the top.
		let rightIcon = this.state.selectedUsers.length > 0 ? [{name: 'add', color:'#fff', function:this.addUsersToList, type:'material', size:30}] : null;
		let rightIconsVisible = this.state.selectedUsers.length > 0;
		return <ListPanelHeader
			backFunction={this.backFunction}
			headerText={this.state.listName}
			rightIconsVisible={rightIconsVisible}
			rightIcons={rightIcon}
		/>;
	}

	addUsersToList()
	{
		//Send all the phones in the selected array to create participation entries (the more selected the longer it will take).
		API.post('SendRequest', '/sendReq', {body:{ //AUTL = Add Users To List
				type:'AUTL',
				users:this.state.selectedUsers,
				listID:this.state.listID,
				listName:this.state.listName,
				templateID:this.state.templateID
			}
		}).then((res) => {
			this.setState({finishedAdding: true, endMessage: "Users added successfully"});
			setTimeout(this.closeModal, 7000);
		}).catch((err) => {
			this.setState({finishedAdding: true, endMessage: "Failed to add users"});
			setTimeout(this.closeModal, 7000);
			console.log(err); //TODO:Better error handling.
		});
	}

	closeModal = () => {
		this.setState({finishedAdding:false}, () => {
			if(this.state.endMessage === "Users added successfully")
			{
				this.backFunction();
			}
		})
	};
}

export default AddUserScreen;

const styles = StyleSheet.create({
	mainWindow:{
		flex: 1,
		alignSelf: 'stretch'
	},
	FlatListContainer: {
		flex: 5,
		backgroundColor: '#7ed6df',
	},
});