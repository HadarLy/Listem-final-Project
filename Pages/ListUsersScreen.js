import React from 'react';
import { StyleSheet, View, ActivityIndicator} from 'react-native';
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

//type Props = {};

class ListUsersScreen extends React.Component {

	/******************************************************************************************************
	 This Component is the screen for managing the list's users.
	 ******************************************************************************************************/

	constructor(props)
	{
		super(props);

		//setting the state in the ctor can only be done with '='.
		this.state.permissions = props.navigation.state.params.permissions;
		this.state.listName = props.navigation.state.params.listName;
		this.state.listID = props.navigation.state.params.listID;
		this.state.user = props.navigation.state.params.user;
		//binding functions
		this.removeUser = this.removeUser.bind(this);
		this.removeUserFromArray = this.removeUserFromArray.bind(this);
		this.toggleRole = this.toggleRole.bind(this);
		this.updateUserPermissions = this.updateUserPermissions.bind(this);
		this.leaveListPressed = this.leaveListPressed.bind(this);
		this.addUserToList = this.addUserToList.bind(this);
		//bind get elements functions
		this.getAddUserButton = this.getAddUserButton.bind(this);
		this.getLeaveListButton = this.getLeaveListButton.bind(this);
		this.getListHeader = this.getListHeader.bind(this);
		this.getMenuType = this.getMenuType.bind(this);
	}

	state = {
		language:'en-US',
		isLoading: false,
		listUsers: [],
		filteredListUsers: [],
		listName: '',
		totalUsers: 0,
		permissions: '',
		listID: 0,
		user: ''
	};

	componentDidMount() {
		strings.setLanguage(this.state.language);
		this.getListUsers();
	}

	static parseUsers(users)
	{
		let parsedUsers = [];

		for(let i = 0; i < users.length; i++)
		{
			let user = {
				name: users[i].Username,
				permissions: users[i].Role,
				List_Place:i
			};

			parsedUsers.push(user);
		}

		return parsedUsers;
	}

	getMenuType()
	{
		return (this.state.permissions === 'Manager' || this.state.permissions === 'Owner') ? ListPanel.menuTypes.UsersListManager : ListPanel.menuTypes.UsersList;
	}

	render() {
		const loadingAnimation = <ActivityIndicator size="large" color='white'/>;
		let header = this.getListHeader();
		let addUser = this.getAddUserButton();
		let leaveList = this.getLeaveListButton();
		let menuType = this.getMenuType();

		return (
			<View style={styles.mainWindow}>
				{header}
				<View style={styles.FlatListContainer}>
					<ListPanel
						data={this.state.filteredListUsers}
						rightIconsVisible={false}
						itemFunction={this.userPressed}
						searchBy={(text) => {this.searchBy(text);}}
						refreshRequested={this.refreshRequested}
						refreshing={this.state.isLoading}
						headerText={strings.formatString(strings.TotalUsers, this.state.totalUsers)}
						menuType={menuType}
						toggleRole={this.toggleRole}
						removeUser={this.removeUser}
						keyName={'List_Place'}
					/>
					{addUser}
					{leaveList}
					{this.state.listLoading && loadingAnimation}
				</View>
			</View>
		);
	}

	refreshRequested()
	{
		this.setState({listUser:[], filteredListUser:[]}, this.getListUsers);
	}

	getListUsers = () => {
		API.post('SendRequest', '/sendReq', {body:{// GLU = Get List Users
				type:"GLU",
				ListID:this.state.listID
			}}).then((data) => {
			let numberOfUsers = 0;

			if(data.listUsers.hasOwnProperty('Count'))
				numberOfUsers = data.listUsers.Count;
			if(!data.hasOwnProperty('listUsers') && !data.listUsers.hasOwnProperty('Items'))
				throw new DBDocumentNotFoundError();

			let users = ListUsersScreen.parseUsers(data.listUsers.Items);
			this.setState({listUsers:users, filteredListUsers:users, totalUsers:numberOfUsers});
		}).catch((err) => {
			console.log(err); //TODO:Better Error Handling.
		})
	};

	userPressed(user)
	{

	}

	searchBy(text)
	{
		let filteredUsers = this.state.listUsers;

		if(text !== '')
		{
			let search = new RegExp('^' + text, 'i');
			filteredUsers = filteredUsers.filter((item) => {
				if(search.test(item.name))
					return item;
			});
		}

		this.setState({filteredListUsers:filteredUsers});
	}

	toggleRole(user)
	{
		API.post('SendRequest', '/sendReq', {body:{//TUR = Toggle User Role
				type:'TUR',
				ListID:this.state.listID,
				Username:user.name
			}
		}).then((data) => {
			this.updateUserPermissions(user);
		}).catch((err) => {
			console.log(err); //TODO:Better Error Handling.
		});
	}

	updateUserPermissions(user)
	{
		let users = this.state.listUsers;

		for(let i = 0; i < users.length; i++)
		{
			if(users[i] === user)
			{
				users[i].permissions = 'Manager';
			}
		}

		this.setState({listUsers:users});
	}

	removeUser(user)
	{
		API.post('SendRequest', '/sendReq', {body:{//RUFL = Remove User From List
				type:'RUFL',
				ListID:this.state.listID,
				Username:user.name
			}
		}).then((data) => {
			this.removeUserFromArray(user);
		}).catch((err) => {
			console.log(err); //TODO:Better Error Handling.
		});
	}

	removeUserFromArray(user)
	{
		let users = this.state.listUsers;
		let newUsers = [];

		for(let i = 0; i < users.length; i++)
		{
			if(users[i] !== user)
				newUsers.push(users[i]);
		}

		this.setState({listUsers:newUsers, filteredListUsers:newUsers});
	}

	leaveListPressed()
	{
		API.post('SendRequest', '/sendReq', {body:{//RUFL = Remove User From List
				type:'RUFL',
				ListID:this.state.listID,
				Username:this.state.user
			}
		}).then((data) => {
			this.goHome();
		}).catch((err) => {
			console.log(err); //TODO:Better Error Handling.
		});
	}

	goHome = () => {
		this.props.navigation.state.params.refreshHome();
		this.props.navigation.navigate('Home');
	};

	backFunction = () =>
	{
		const {goBack} = this.props.navigation;
		goBack(null);
	};

	getListHeader()
	{
		return <ListPanelHeader
			backFunction={this.backFunction}
			headerText={this.state.listName}
			rightIconsVisible={false}
		/>;
	}

	getLeaveListButton()
	{
		return <ActionButton position={'left'}
		                     title={"Leave List"}
		                     buttonColor={"red"}
		                     shadowStyle={{elevation: 5}}
		                     onPress={this.leaveListPressed}
		                     renderIcon={(active) => <Icon name={'ios-log-out'} type={'ionicon'} color={'#fff'}/> }>
				</ActionButton>;
	}

	getAddUserButton()
	{
		let addUserButton = null;

		if(this.state.permissions === 'Owner' || this.state.permissions === 'Manager')
		{
			addUserButton = <ActionButton position={'right'}
										  title={"Add User"}
										  buttonColor={"#005073"}
										  shadowStyle={{elevation: 5}}
										  onPress={this.addUserToList}
										  renderIcon={ () => <Icon name={'add'} type={'material'} color={'#fff'}/>}/>;
		}

		return addUserButton;
	}

	addUserToList()
	{
		let navigationParams = {
			contacts: this.props.navigation.state.params.contacts,
			listName:this.state.listName,
			listID:this.state.listID,
			templateID:this.props.navigation.state.params.templateID
		};

		const {navigate} = this.props.navigation;
		navigate('AddUserScreen', navigationParams);
	}
}

export default ListUsersScreen;

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