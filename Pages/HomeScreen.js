import React from 'react';
import { StyleSheet, Animated, View, TouchableHighlight, ActivityIndicator} from 'react-native';
import { StackActions, NavigationActions } from 'react-navigation';
import { Icon, ListItem } from 'react-native-elements';
import DrawerLayout from 'react-native-drawer-layout';
//Custom Components
import MyHeader from '../Components/MyHeader';
import EditHeader from '../Components/EditHeader';
import ListPanel from '../Components/ListPanel';
import MyButton from '../Components/MyButton';
import SplashScreen from '../Components/SplashScreen';
import FilterMenu from "../Components/FilterMenu";
//Error Imports
import DBDocumentNotFoundError from '../Errors/DBDocumentNotFoundError'
//Import Language
import strings from '../Language/language'
//Backend Integration
import Amplify, {API, Auth} from 'aws-amplify';

//type Props = {};

class HomeScreen extends React.Component {

	/******************************************************************************************************
	 This Component is a The Home screen for the app showing the users lists.
	 (Layout - 4 favorites at the top, FlatList of other list at the middle (refresh button), Filter Button on top and Add button on bottom right corner.) - Suggested.
	 ******************************************************************************************************/

	constructor(props)
	{
		super(props);
		this.addNewListPressed = this.addNewListPressed.bind(this);
		this.goToSettingsPressed = this.goToSettingsPressed.bind(this);
		this.filterByPressed = this.filterByPressed.bind(this);
		this.fetchLists = this.fetchLists.bind(this);
		this.refreshButtonPressed = this.refreshButtonPressed.bind(this);
		this.ListPressed = this.ListPressed.bind(this);
		this.FavouriteLongPress = this.FavouriteLongPress.bind(this);
		this.getAllUserList = this.getAllUserList.bind(this);
		this.getUserFavoriteLists = this.getUserFavoriteLists.bind(this);
		this.parseAllUserListsInfo = this.parseAllUserListsInfo.bind(this);
		this.parseFavListInfo = this.parseFavListInfo.bind(this);
		this.refreshViewOnBack = this.refreshViewOnBack.bind(this);
		this.navigate = this.navigate.bind(this);
		this.searchBy = this.searchBy.bind(this);
		this.cleanMarkedButtons = this.cleanMarkedButtons.bind(this);
	}

	fetchLists() {
		this.getAllUserList(this.state.user);
	}

	componentDidMount() {
		this.setState({isLoading: true}); //Start Loading Screen
		strings.setLanguage(this.state.language);
		Auth.currentAuthenticatedUser({bypassCache: false}).then((user) => {
			//Set the username to a state.
			this.setState({user: user['username']});
			//Send request to the server to get the favorite lists and then all the other lists.
			this.getUserFavoriteLists(this.state.user);
		}).catch((err) => {
			console.log(err);
		});
	}
	parseFavListInfo(res) {
		if(!res.hasOwnProperty('Items'))
			throw new SQLException();
		let array = res.Items; //An array containing the 4 favorite lists is returned, need to parse.
		let FavLists = [];
		const attributes = ['Favorite_One','Favorite_Two',
						'Favorite_Three','Favorite_Four'];
		for (let i = 0; i<4; i++)
		{
			if(array[0][attributes[i]].List_ID != 0)
			{
				let item = {
					List_ID: '',
					name: '',
					isSelected: false,
				};
				item.List_ID = array[0][attributes[i]].List_ID;
				item.name = array[0][attributes[i]].List_Name;
				FavLists.push(item);
			}
		}
		return FavLists;
	}
	getUserFavoriteLists(user) {
		API.post('SendRequest', '/sendReq', {body:{ //GFUL = Get Favorite User Lists
				type:"GFUL",
				username:user
			}}).then((res) => { //Handle the response from the server for GFUL
			if(!res.hasOwnProperty('Items'))
				throw new DBDocumentNotFoundError();
			const FavLists = this.parseFavListInfo(res);
			this.setState(prevState => ({
				FavoriteLists: FavLists,
				isLoading: false
			}));
			//After we got the favorites we again send a request to the server to get all the other lists, this is done inside the promise so that it will be done only after we get the favorite lists.
			this.getAllUserList(user);
		}).catch((err) => { //Catch for GFUL
			//TODO: Better error handling.
			console.log(err);
		});
	}

	parseAllUserListsInfo(AllLists) {

		let lists = [];
		for(let i = 0; i < AllLists.length; i++)
		{
			let item = {
				List_ID: '',
				name: '',
				role:''
			};
			item.name = (AllLists[i])["List_Name"];
			item.List_ID = (AllLists[i])["List_ID"];
			item.role = (AllLists[i])["Role"];
			lists.push(item);
		}

		return lists;
	}

	getAllUserList(user) {
		API.post('SendRequest', '/sendReq', {body:{ //GAUL = Get All User Lists
				type:'GAUL',
				username: user
			}}).then((response) => { //Handle the response from the server for GAUL
			if(!response.hasOwnProperty('Items')) //Validation for correct response.
				throw new DBDocumentNotFoundError();
			let AllLists = response.Items;
			//parsing all the item array to objects of 'List_ID' and 'List_Name'
			let lists = this.parseAllUserListsInfo(AllLists);
			//save the arrays in a state.
			this.setState(prevState => ({
				Lists: lists,
				FilteredLists:lists,
				listLoading: false
			}))
		}).catch((error) => { //Catch for GAUL
			//TODO: Better error handling.
			console.log(error);
		});
	}

	state = {
		editHeader: false,
		editText:false,
		buttonPressed: 0,
		FavoriteLists:[],
		Lists:[],
		SelectedItems: [],
		FilteredLists: [],
		listLoading: true,
		language:strings.getInterfaceLanguage(),
		isLoading: true,
		user:'',
		filteringMenuVisible:false,
		activeFilters: ['All'],
		animatedValue: new Animated.Value(0.0001)
	};

	goToSettingsPressed() {
		/*const {navigate} = this.props.navigation;
		navigate('SettingsScreen');*/
	}

	filterByPressed() {
		this.setState({filteringMenuVisible: !this.state.filteringMenuVisible});
		let initialValue = this.state.animatedValue;
		let finalValue = this.state.filteringMenuVisible ? 0 : 100;
		Animated.timing(initialValue, {
			toValue:finalValue,
			duration:750
		}).start();
	}

	addNewListPressed() {
		this.navigate('NewListScreen', {language:this.state.language});
	}

	refreshButtonPressed() {
		this.setState((prevState) => ({
			Lists: [],
			FilteredLists:[],
			listLoading: true
		}));
		this.fetchLists();
	}

	refreshViewOnBack()
	{
		this.setState({Lists:[], FavoriteLists:[]});
		this.getUserFavoriteLists(this.state.user);
	}

	ListPressed(item)
	{
		let isFavorite = false;

		for(let i = 0; i < this.state.FavoriteLists.length; i++)
			if(this.state.FavoriteLists[i].List_ID === item.List_ID)
				isFavorite = true;

		let navigationParams = {
			language:this.state.language,
			list:item,
			isFavorite:isFavorite,
			refreshViewOnBack:this.refreshViewOnBack
		};

		this.navigate('ListViewScreen', navigationParams);
	}

	filterBy(options)
	{
		let filteredLists = this.state.Lists;

		if(!options.includes('All'))
		{
			filteredLists = filteredLists.filter((list) => {
				if(options.includes(list.role))
					return list;
			});
		}

		this.setState({FilteredLists:filteredLists, activeFilters:options});
	}

	FavouriteLongPress(item)
	{
		let updatedFavouriteList = [...this.state.FavoriteLists]
		let editTheHeader = false;
		let counter = 0;
		for (let i = 0; i<updatedFavouriteList.length; i++)
		{
			if (updatedFavouriteList[i].List_ID === item.List_ID)
			{
				updatedFavouriteList[i].isSelected = !updatedFavouriteList[i].isSelected;
			}
			if (updatedFavouriteList[i].isSelected === true)
			{
				counter++;
				editTheHeader = true;
			}
		}
		this.setState({FavoriteLists: updatedFavouriteList, editHeader: editTheHeader, buttonPressed: counter});
	}

	cleanMarkedButtons()
	{
		let removeSelected = [...this.state.FavoriteLists];
		let editTheHeader = false;
		for (let i = 0; i<removeSelected.length; i++)
		{
			removeSelected[i].isSelected = false;
		}
		this.setState({FavoriteLists:removeSelected, editHeader: editTheHeader, buttonPressed: 0})
	}

	navigate(path, params)
	{
		const {navigate} = this.props.navigation;
		this.setState({editHeader:false});
		navigate(path, params);
	}

	searchBy(text)
	{
		let filteredLists = this.state.Lists;

		if(text !== '')
		{
			let search = new RegExp('^' + text, 'i');
			filteredLists = filteredLists.filter((list) => {
				if(search.test(list.name))
					return list;
			});
		}

		this.setState({FilteredLists:filteredLists});
	}

	render() {

		if(this.state.isLoading === false)
		{
			let Arr = this.state.FavoriteLists.map((item, i) => {
				return (
					<View key={i}>
						<MyButton text={item.name} selected={item.isSelected} longPress={() => {this.FavouriteLongPress(item)}} function={() => {this.ListPressed(item)}}/>
					</View>
				)
			});
			const loadingAnimation = <ActivityIndicator size="large" color='white'/>;

			//decides if the filtering menu will appear.
			const AnimatedFilteringMenu = Animated.createAnimatedComponent(FilterMenu);
			let filteringMenu = <AnimatedFilteringMenu filterByOptions={['All', 'Owner', 'Participator', 'Personal']}
				                            language={this.state.language}
				                            FilterBy={(option) => {this.filterBy(option);}}
                                            activeFilters={this.state.activeFilters} height={this.state.animatedValue}/>;
			//decides what type of header to display.
			let header = this.state.editHeader ?
					<EditHeader
					counter={this.state.buttonPressed}
					function={this.cleanMarkedButtons}
					/>
				 : <MyHeader
					backIcon={false}
					text={strings.formatString(strings.Welcome, this.state.user)}
					rightIconsVisible={true}
					rightIcons={[
						{	name:'filter',
							type:'material-community',
							function: this.filterByPressed,
							size: 30,
							color: "#fff"},
						{	name: 'settings',
							type: 'material',
							function: this.goToSettingsPressed,
							size: 30,
							color: "#fff"},
					]}
				/>;

			return (
				<View style={styles.mainWindow}>
					{header}
					{filteringMenu}
					<View style={styles.FavContainer}>
						 {Arr}
					</View>
					<View style={styles.FlatListContainer}>
						<ListPanel
							data={this.state.FilteredLists}
							rightIconsVisible={true}
							rightIcons={[
								{
									name:'refresh',
									function: this.refreshButtonPressed,
									type: 'material',
									size: 30,
									color: '#fff'
								},
								{
									name: 'ios-add-circle-outline',
									function: this.addNewListPressed,
									type: 'ionicon',
									size: 30,
									color: '#fff'
								}
							]}
							itemFunction={this.ListPressed}
							searchBy={(text) => {this.searchBy(text);}}
							refreshRequested={this.refreshButtonPressed}
							refreshing={this.state.isLoading}
						/>
						{this.state.listLoading && loadingAnimation}
					</View>
				</View>
			);
		}
		else
		{
			return (
				<SplashScreen/>
			)
		}
	}
}

export default HomeScreen;

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
	FavContainer: {
		paddingVertical: 10,
		flex: 3,
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-around',
		alignItems: 'center',
		backgroundColor: 'whitesmoke',
		// borderBottomColor: '#535c68',
		// borderBottomWidth: 1,
	},
	instructions: {
		textAlign: 'center',
		color: '#333333',
		marginBottom: 5,
	},
	myButton:{
		margin:5,
		backgroundColor:'#87cefa',
		borderColor: '#d6d7da',
		borderWidth: 0.5,
		borderRadius: 3,
		alignItems: 'center',
		height:50,
		width:100,
		shadowColor: '#000',
  		shadowOffset: {width: 0, height: 2},
  		shadowOpacity: 0.8,
  		shadowRadius: 2
	},
	buttonContainer:{
		flex: 10,
		flexDirection: 'row',
		backgroundColor: 'whitesmoke'
	},
	buttonText:{
		display: 'flex',
		marginTop: 10,
		color:'white',
		fontFamily: 'open-sans',
		fontSize: 18
	},
	FlatListContainer: {
		flex: 5,
		backgroundColor: '#7ed6df',
	},
});

//Old Code---probably will be deleted
		// API.get('SendRequest', '/sendReq').then((res) => {
		// 	let lists = res['lists'];
		// 	Auth.currentAuthenticatedUser({bypassCache: false}).then((user) => {
		// 		this.setState({user: user['username']});
				
		// 	}).catch((err) => {
		// 		console.log(err);
		// 	});
		// 	this.setState({Lists: lists, isLoading: false}); //Close Loading Screen
		// })
		// 	.catch((err) => {
		// 		//TODO: Better error handling.
		// 		console.log(err);
		// 	});
//----------------------------------------------------------------