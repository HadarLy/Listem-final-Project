import React from 'react';
import { StyleSheet, Modal, View, TouchableWithoutFeedback, BackHandler} from 'react-native';
import { StackActions, NavigationActions } from 'react-navigation';
import {Icon, Text, Overlay, Input, Button} from 'react-native-elements';
import ActionButton from 'react-native-action-button';
//Custom Components
import MyHeader from "../Components/MyHeader";
import ListPanel from "../Components/ListPanel";
//Error Imports
import DBDocumentNotFoundError from '../Errors/DBDocumentNotFoundError'
//Import Language
import strings from '../Language/language';
//Backend Integration
import Amplify, {API, Auth} from 'aws-amplify';
import UserAlert from "../Components/UserAlert";

class ListViewScreen extends React.Component {

	/******************************************************************************************************
	 This Component is a The List View screen in which the user will e able to add items (if he has permissions)
	 and view all the items. (will also lead to the list management page in which we will able to leave the list and if the necessary permissions are set
	                            to also edit the list settings).
	 ******************************************************************************************************/

	constructor(props)
	{
		super(props);
		//its bad practice to set the state using '=' but for it to be done in the c'tor it has to be done this way so we compromise.
		//we have to do it in the c'tor for language support.
		this.state.language = props.navigation.state.params.language;
		//bind the functions to the created component
		this.getListItems = this.getListItems.bind(this);
		this.itemPressed = this.itemPressed.bind(this);
		this.favoritePressed = this.favoritePressed.bind(this);
		this.goToSettingsPressed = this.goToSettingsPressed.bind(this);
		this.refreshButtonPressed = this.refreshButtonPressed.bind(this);
		this.addNewItemPressed = this.addNewItemPressed.bind(this);
		this.backFunction = this.backFunction.bind(this);
		this.searchBy = this.searchBy.bind(this);
		this.analyzeList = this.analyzeList.bind(this);
		this.closeModal = this.closeModal.bind(this);
		this.editListNamePressed = this.editListNamePressed.bind(this);
		this.newNameForListInputChanged = this.newNameForListInputChanged.bind(this);
		this.OKButtonInNewNameForListOverlayPressed = this.OKButtonInNewNameForListOverlayPressed.bind(this);
		this.onSuccessfulCreation = this.onSuccessfulCreation.bind(this);
		this.closeButtonInNewNameForListOverlayPressed = this.closeButtonInNewNameForListOverlayPressed.bind(this);
	}

	state = {
		ListName:'',
		language: strings.getInterfaceLanguage(),
		isLoading: false,
		user:'',
		ListItems:[],
		filteredItems: [],
		permissions:'',
		ListID:'0',
		templateID:'0',
		isFavorite:false,
		analyzable:false,
		analyzed:false,
		analysis:'',
		newNameForList:'',
		isNewListNameOverlayVisible: false,
        endMessage: '',
        finishedCreation: false
	};

	componentDidMount() {
		this.setState({isLoading: true}); //Start Loading Screen
		//for readability we will sav these parameter in new variables.
		const listName = this.props.navigation.state.params.list.name;//Get the list name from the navigation parameters.
		const listID = this.props.navigation.state.params.list.List_ID;//Get the list ID from the navigation parameters.
		const isFavorite = this.props.navigation.state.params.isFavorite;
		this.setState({ListName:listName, ListID:listID, isFavorite:isFavorite});
		strings.setLanguage(this.state.language);//we will set the language to the elvish.
		Auth.currentAuthenticatedUser({bypassCache: false}).then((user) => { //then for authentication.
			//Get the username so we can get get the correct permissions, also to validate that he is indeed a participator of the list.
			let username = user['username'];
			this.setState({user: username});
			//Get the list items
			this.getListItems(username, listID);
		}).catch((err) => {// catch for authentication.
			console.log(err);
		});

        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.hardwareBackButton)
	}

	componentWillUnmount()
    {
        this.backHandler.remove();
    }

    getListItems(username, listID)
	{
		API.post('SendRequest', '/sendReq', {body: { //GLI = Get List Items.
				type:'GLI',
				username:username,
				listID:listID
			}}).then((res) => { //then for GLI
			//Check response validity with hasOwnProperty
			if(!res.hasOwnProperty('items') || !res.items.hasOwnProperty('Items') || !res.hasOwnProperty('userPermissions') || !res.hasOwnProperty('templateID'))
				throw new DBDocumentNotFoundError();

			let permissions = res.userPermissions;
			let templateID = res.templateID;
			let items = res.items.Items;
			let listItems = [];

            if(templateID === "1" || templateID === "2" || templateID === "7")
            { //only a place holder for real analyzable check, currently hardcoded for only the 3 analyzable templates
                this.setState({analyzable:true})
            }
			//parse the result to create an array of object which contains the name of the item and it's unique ID
			//needed for FlatList and navigation to correct ItemView.
			for(let i = 0; i < items.length; i++)
			{
				let item = {};
				//Check response validity with hasOwnProperty
				if(items[i].hasOwnProperty('Item_Name'))
					item.name = (items[i])['Item_Name'];
				if(items[i].hasOwnProperty('Item_ID'))
					item.Item_ID = (items[i])['Item_ID'];
				if(items[i].hasOwnProperty('Template_ID'))
					item.Template_ID = (items[i])['Template_ID'];
				if(items[i].hasOwnProperty('Fields') && items[i].Fields.hasOwnProperty('Done'))
					item.Done = items[i].Fields.Done;
				if(items[i].hasOwnProperty('Fields') && items[i].Fields.hasOwnProperty('Due Date'))
				    item.Due_Date = items[i].Fields['Due Date'];
				if(items[i].hasOwnProperty('Fields') && items[i].Fields.hasOwnProperty('Bought'))
					item.Bought = items[i].Fields['Bought'];

				listItems.push(item);
			}
			this.setState({isLoading:false, ListItems:listItems, permissions:permissions, templateID:templateID, filteredItems:listItems});
		}).catch((error) => {//catch for GLI
			console.log(error); //TODO:Better error handling.
		});
	}

	itemPressed(item)
	{
		let navigationParams = {
			item:item,
			listID:this.state.ListID,
			language: this.state.language,
			newItem:false,
			templatePreview:false,
			permissions: this.state.permissions,
			refreshList: this.refreshButtonPressed
		};
		const { navigate } = this.props.navigation;
		navigate('ItemViewScreen', navigationParams);
	}

	favoritePressed()
	{
		let requestType = ListViewScreen.determineFavoriteRequestType(this.state.isFavorite);
		let requestParameters = {body:{
				type:requestType,
				username: this.state.user,
				ListID: this.state.ListID,
				ListName: this.state.ListName
			}};

		API.post('SendRequest', '/sendReq', requestParameters).then((res) => {
			if(res.hasOwnProperty('message'))
				this.favoriteAdded();
			else
				throw new SQLException(); //TODO:Change exception type.

			this.setState({isFavorite:!this.state.isFavorite})
		}).catch((err) => {
		    this.tooManyFavorites();
			console.log(err); //TODO:Add better error handling, alert the user that he has too many favorites.
		});
	}

	favoriteAdded = () => {
		let endMessage = !this.state.isFavorite ? 'Favorite added successfully' : 'Favorite removed successfully';
	    this.setState({finishedCreation:true, endMessage:endMessage});
	    setTimeout(this.closeAlert, 7000);
    };

    tooManyFavorites = () => {
        this.setState({finishedCreation:true, endMessage:'You have too many favorites'});
        setTimeout(this.closeAlert, 7000);
    };

	//new- Hadar
	editListNamePressed(){
		this.setState({isNewListNameOverlayVisible: true});
	}

	//new - Hadar
	newNameForListInputChanged(text){
		this.setState({newNameForList: text});
	}

	//new 
	OKButtonInNewNameForListOverlayPressed(){
		this.setState({isNewListNameOverlayVisible: false});
		if(this.state.ListName !== this.state.newNameForList && this.state.newNameForList !== ""){
			API.post('SendRequest', '/sendReq', {body: { //CLN = Change List Name.
				type:'CLN',
				listID:this.state.ListID,
				listName: this.state.newNameForList
			}}).then(() => {
				this.onSuccessfulCreation();
			}).catch((err) => {
				console.log(err);
			});
		}
	}

	//new 
	onSuccessfulCreation(){
		this.setState({
            ListName: this.state.newNameForList,
            newNameForList: "",
            finishedCreation:true,
            endMessage:"List name changed successfully"
		});
		setTimeout(this.closeAlert, 7000);
	}

	//new
	closeButtonInNewNameForListOverlayPressed(){
		this.setState({isNewListNameOverlayVisible: false});
	}

	static determineFavoriteRequestType(isFavorite)
	{
		let requestType = '';
		//determine which type of request we want to send.
		if(isFavorite)
			requestType = 'DLFF'; //DLFF = Delete List From Favorites
		else
			requestType = 'ALTF';//ALTF = Add List To Favorites

		return requestType;
	}

	goToSettingsPressed()
	{
		let navigationParams = {
			language: this.state.language,
			listID:this.state.ListID,
			permissions:this.state.permissions,
			listName:this.state.ListName,
			contacts:this.props.navigation.state.params.contacts,
			templateID:this.state.templateID,
			refreshHome: this.refreshHome,
			user:this.state.user
		};

		const {navigate} = this.props.navigation;
		navigate('ListUsersScreen', navigationParams);
	}

	refreshButtonPressed()
	{
		let items = [];
		this.setState({ListItems: items, isLoading:true, filteredItems:items});
		this.getListItems(this.state.user, this.state.ListID);
	}

	addNewItemPressed()
	{
		let navigationParams = {
			language: this.state.language,
			newItem:true,
			templatePreview:false,
			templateID:this.state.templateID,
			listID:this.state.ListID,
			refreshList:this.refreshButtonPressed
		};
		const {navigate} = this.props.navigation;
		navigate('ItemViewScreen', navigationParams);
	}

	refreshHome = () => {
		if(this.props.navigation.state.params.hasOwnProperty('refreshViewOnBack'))
			this.props.navigation.state.params.refreshViewOnBack();
	};

	hardwareBackButton = () => {
		this.refreshHome();
	};

	backFunction()
	{
		this.refreshHome();
		const {goBack} = this.props.navigation;
		goBack(null)
	}

	searchBy(text)
	{
		let filteredItems = this.state.ListItems;

		if(text !== '')
		{
			let search = new RegExp('^' + text, 'i');
			filteredItems = filteredItems.filter((item) => {
				if(search.test(item.name))
					return item;
			});
		}

		this.setState({filteredItems:filteredItems});
	}

	getAnalysisButton()
	{
		return this.state.analyzable ? <ActionButton title={"Analysis"}
													 buttonColor={"rgba(46, 204, 113, 1)"}
													 onPress={this.analyzeList}
													 renderIcon={() => <Icon name={'equalizer'} type={'material'} color={'#000'}/>}
													 position={'left'}/> : null
	}

	getAddItemButton()
	{
		let addItemButton = null;

		if(this.state.permissions === 'Owner' || this.state.permissions === 'Manager') {
			addItemButton = <ActionButton title={"New"}
										  buttonColor={"rgba(34, 166, 179 ,1)"}
										  onPress={this.addNewItemPressed}
										  renderIcon={ () => <Icon name={'add'} type={'material'} color={'#fff'}/>}
										  position={'right'}/>
		}

		return addItemButton;
	}

	analyzeList()
	{
		API.post('SendRequest', '/sendReq', { body : { type:'ALI', //ALI = Analyze List Items
				listID:this.state.ListID,
				templateID:this.state.templateID
			}
		}).then((res) => {
			if(!res.hasOwnProperty('analysis'))
				throw new DBDocumentNotFoundError();

			let analysis = "1)   " + res.analysis["1)"] + "\n\n2)   " + res.analysis["2)"];
			this.setState({analysis:analysis});
		}).catch((err) => {
			console.log(err); //TODO: better error handling.
		});

		this.setState({analyzed:true})
	}

	removeItem = (item) => {

		const requestBody = {
			type:'DLI',
			itemID: item.Item_ID,
			listID: this.props.navigation.state.params.list.List_ID,
		};

		API.post('SendRequest', '/sendReq', {body:requestBody}).then((response) => {
			if(!response.hasOwnProperty('message'))
				throw new DBDocumentNotFoundError(); //TODO: Change exception type maybe.
			//after deletion return to the list screen.
			this.refreshButtonPressed();
		}).catch((err) => {
			alert(err.response.data.message); //TODO: Better error handling.
		});
	}

	render() {

		let listAnalysisButton = this.getAnalysisButton();
		let addItemButton = this.getAddItemButton();
		let rightHeaderIcons = this.getRightHeaderIcons();
		let listAnalysis = this.toggleListAnalysis();
		rightHeaderIcons[1].color = this.state.isFavorite ? "#ffd000" : "#fff";

		return (
			<View style={styles.mainWindow}>
				<ListPanel
					removeFunc={this.removeItem}
					backFunction={this.backFunction}
					data={this.state.filteredItems}
					rightIconsVisible={true}
					rightIcons={rightHeaderIcons}
					itemFunction={this.itemPressed}
					refreshRequested={this.refreshButtonPressed}
					refreshing={this.state.isLoading}
					searchBy={(text) => {this.searchBy(text);}}
					headerText={this.state.ListName}
					menuType={ListPanel.menuTypes.ListItems}
					keyName={'Item_ID'}
				/>
				<Overlay isVisible={this.state.isNewListNameOverlayVisible}>
					<View>
						<Input label="Enter new list name:" onChangeText={(text)=>{this.newNameForListInputChanged(text)}}/>
						<Button title="OK" onPress={this.OKButtonInNewNameForListOverlayPressed} style={styles.okButton}/>
						<Button title="Close" onPress={this.closeButtonInNewNameForListOverlayPressed}/>
					</View>
				</Overlay>
				{addItemButton}
				{listAnalysis}
				{listAnalysisButton}
				<UserAlert closeModal={this.closeAlert} finishedCreation={this.state.finishedCreation} endMessage={this.state.endMessage}/>
			</View>
		);
	}

	closeAlert = () => {
        this.setState({finishedCreation:false});
    };

	getRightHeaderIcons = () => {
		return [
			{
				name: 'edit',
				type: 'material',
				function: this.editListNamePressed,
				color: "#fff",
				size: 30
			},
			{
				name: 'star',
				type: 'material',
				function: this.favoritePressed,
				size: 30,
				color: "#fff"
			},
			{	name: 'people',
				type: 'material',
				function: this.goToSettingsPressed,
				size: 30,
				color: "#fff"
			}
			
		];
	};

	closeModal()
	{
		this.setState({analyzed:false});
	}

	toggleListAnalysis() {
		return <Modal visible={this.state.analyzed}
					  transparent={ true }
					  animationType={'fade'}
					  onRequestClose={this.closeModal}>
					<TouchableWithoutFeedback onPress={this.closeModal}>
						<View style={styles.listAnalysis}>
							<View style={styles.listAnalysisBox}>
								<Text style={styles.analysisText}>{this.state.analysis}</Text>
							</View>
						</View>
					</TouchableWithoutFeedback>
				</Modal>;
}


}

export default ListViewScreen;

const styles = StyleSheet.create({
	loadingScreen: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'whitesmoke',
	},
	mainWindow:{
		flex: 1,
		alignSelf: 'stretch'
	},
	headNav:{
		flex: 1,
		flexDirection:'row',
		backgroundColor: '#7FDBFF',
		height: 66,
	},
	PlusIconContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		padding: 5
	},
	container: {
		paddingVertical: 10,
		flex: 9,
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-around',
		backgroundColor: 'whitesmoke'
	},
	welcome: {
		textAlign: 'center',
		flex: 3,
		fontSize: 25,
		color: 'white',
		fontWeight: 'bold',
		fontFamily: 'sans-serif'
	},
	listAnalysis:{
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(189, 195, 199, 0.8)'
	},
	listAnalysisBox:{
		width: 250,
		height: 250,
		backgroundColor: 'white',
		borderRadius: 10,
		elevation: 10
	},
	analysisText:{
		fontSize: 20,
		fontWeight: 'bold',
		textAlign: 'left',
		textAlignVertical: 'center',
		padding: 10
	},
	okButton: {
		marginTop: 60,
		marginLeft: 20,
		marginRight: 20,
		marginBottom: 10
	}
});