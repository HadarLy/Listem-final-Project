import React from 'react';
import {View, StyleSheet, Text, Platform, RefreshControl, ScrollView} from 'react-native';
import { PermissionsAndroid } from 'react-native';
import Contacts from 'react-native-contacts';
//Error Imports
import DBDocumentNotFoundError from '../Errors/DBDocumentNotFoundError'
//Import Language
import strings from '../Language/language'
//Backend Integration
import Amplify, {API, Auth} from 'aws-amplify';
//Floating Button
import ActionButton from 'react-native-action-button';
//Icons
import { Icon } from 'react-native-elements';
//Custom Components
import SplashScreen from '../Components/SplashScreen';
import ListPanelHeader from '../Components/ListPanelHeader';
import ListSlider from '../Components/ListSlider';
import  global from '../global'

class NewHomeScreen extends React.Component {

    constructor(props) {
        super(props);
        this.searchBy = this.searchBy.bind(this);
        this.getUserFavoriteLists = this.getUserFavoriteLists.bind(this);
        this.addNewListPressed = this.addNewListPressed.bind(this);
        this.navigate = this.navigate.bind(this);
        this.ListPressed = this.ListPressed.bind(this);
        this.refreshViewOnBack = this.refreshViewOnBack.bind(this);
		this.setFilteredLists = this.setFilteredLists.bind(this);
		this.filterBy = this.filterBy.bind(this);
		this.sortBy = this.sortBy.bind(this);
		this.addNewListPressed = this.addNewListPressed.bind(this);
		this.ListPressed = this.ListPressed.bind(this);
    }

    state = {
        user: '',
        language: 'en-US',
		FavList: [],
		favLoading: true,
		OwnList: [],
		ownedLoading: true,
		InvitedList: [],
		invitedLoading: true,
		//PersonalList: [],
		//personalLoading: true,
		AllFavList: [],
        AllOwnList: [],
        AllInvitedList: [],
       // AllPersonalList: [],
        isLoading: true,
		FilteredLists: [],
		FavActiveFilters:['All'],
		OwnActiveFilters:['All'],
		InvitedActiveFilters:['All'],
		//PersonalActiveFilters:['All'],
		FavSortSelection: '',
		OwnSortSelection: '',
		InvitedSortSelection: '',
		//PersonalSortSelection: '',
		contacts: {}
    };

    componentDidMount() {
		this.setState({isLoading: true, favLoading: true}); //Start Loading Screen
	  	this.getContactsWhoUseTheApp();
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

    async getContactsWhoUseTheApp()
    {
	    Platform.select({ //Default code from react-native project creation, leaving it for documentation purposes if we ever need to know how to differentiate between platforms.
		    ios: '', //TODO: add ios support
		    android:
			    PermissionsAndroid.request(
				    PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
				    {
					    'title': 'Contacts',
					    'message': 'This app would like to view your contacts.'
				    }
			    ).then(() => {
				    Contacts.getAll((err, contacts) => {
					    if (err === 'denied'){
						    console.log(err);
					    } else {
					    	contacts = global.parseContacts(contacts);
						    API.post('SendRequest', '/sendReq', { body:{ //GCTUA = Get Contacts That Use App
						    	    type:'GCTUA',
								    contacts:contacts
							    }
						    }).then((res) => {
						    	let completeContacts = {
						    		contactsList: global.markUsersWhoUseApp(contacts, res),
								    loaded: true
							    };
						    	this.setState({contacts:completeContacts});
						    }).catch((err) => {
						    	console.log(err); //TODO: Better error handling.
						    });
					    }
				    })
			    })
	    });

    }
    
    getUserFavoriteLists(user) {
		this.setState({favLoading: true, invitedLoading: true, ownedLoading: true/*, personalLoading: true*/});
		API.post('SendRequest', '/sendReq', {body:{ //GFUL = Get Favorite User Lists
				type:"GFUL",
				username:user
			}}).then((res) => { //Handle the response from the server for GFUL
			if(!res.hasOwnProperty('Items'))
				throw new DBDocumentNotFoundError();
			const FavLists = NewHomeScreen.parseFavListInfo(res);
			this.setState({
				FavList: FavLists,
				AllFavList: FavLists,
				isLoading: false,
				favLoading: false,
			});
			//After we got the favorites we again send a request to the server to get all the other lists, this is done inside the promise so that it will be done only after we get the favorite lists.
			this.getAllUserList(user);
		}).catch((err) => { //Catch for GFUL
			//TODO: Better error handling.
			console.log(err);
		});
    }
    
    static parseFavListInfo(res) {
		if(!res.hasOwnProperty('Items'))
			throw new SQLException();
		let array = res.Items; //An array containing the 4 favorite lists is returned, need to parse.
		let FavLists = [];
		const attributes = ['Favorite_One','Favorite_Two',
						'Favorite_Three','Favorite_Four'];
		for (let i = 0; i<4; i++)
		{
			if(array[0][attributes[i]].List_ID !== "0")
			{
				let item = NewHomeScreen.createFavoriteListObject(array[0][attributes[i]]);
				FavLists.push(item);
			}
		}
		return FavLists;
	}

	static createFavoriteListObject = (listFromDB) => {
    	return new FavoriteListObject(listFromDB.List_ID,
										listFromDB.List_Name,
										listFromDB.Template_ID,
										false);

	};

    getAllUserList(user) {
		API.post('SendRequest', '/sendReq', {body:{ //GAUL = Get All User Lists
				type:'GAUL',
				username: user
			}}).then((response) => { //Handle the response from the server for GAUL
			if(!response.hasOwnProperty('Items')) //Validation for correct response.
				throw new DBDocumentNotFoundError();
			let AllLists = response.Items;
			//parsing all the item array to objects of 'List_ID' and 'List_Name'
            let lists = NewHomeScreen.parseAllUserListsInfo(AllLists);
			//Saving the lists to their correct categories
			this.setFilteredLists(lists, false); // c
			let list = lists.concat(this.state.FavList);//add
			this.setState({FilteredLists :list}); //c
            
		}).catch((error) => { //Catch for GAUL
			//TODO: Better error handling.
			console.log(error);
		});
    }
    
    static parseAllUserListsInfo(AllLists) {

		let lists = [];
		for(let i = 0; i < AllLists.length; i++)
		{
			let item = NewHomeScreen.createItemObject(AllLists[i]);
			lists.push(item);
		}

		return lists;
    }

    static createItemObject = (itemFromDB) => {
		return new ListObject(itemFromDB["List_Name"],
							  itemFromDB["List_ID"],
							  itemFromDB["Role"],
							  itemFromDB["Template_ID"],
							  itemFromDB['Last_Opened']);
	};
    
    addNewListPressed() {
		this.setState({FavActiveFilters:['All'], OwnActiveFilters: ['All'], InvitedActiveFilters: ['All'],
						FavSortSelection:'', OwnSortSelection: '', InvitedSortSelection: ''});
		this.navigate('NewListScreen', {language:this.state.language, refreshViewOnBack:this.refreshViewOnBack});
    }
    
    navigate(path, params)
	{
		const {navigate} = this.props.navigation;
		this.setState({editHeader:false});
		navigate(path, params);
	}

    searchBy(text)
	{
		let lists = this.state.FilteredLists;

		if(text !== '')
		{
			let search = new RegExp('^' + text, 'i');
			lists = lists.filter((item) => {
				if(search.test(item.name))
					return item;
			});
		}

		this.setFilteredLists(lists, true);
    }

    setFilteredLists(lists, searchCalled)
    {
		let  ownlist, invited, personal;
		
	    ownlist = lists.filter(item => (item.role === "Owner" || item.role === "Manager"));
	    invited = lists.filter(item => item.role === "Participator");
	    personal = lists.filter(item => item.role === "Personal");

		//Save the lists to the state.
		if(searchCalled){
			this.setState({
				OwnList: ownlist,
				InvitedList: invited,
				//PersonalList: personal
			});
		}
		else {
			this.setState({
				OwnList: ownlist,
				InvitedList: invited,
				//PersonalList: personal,
				AllOwnList: ownlist,
				AllInvitedList: invited,
				//AllPersonalList: personal,
				invitedLoading: false,
				ownedLoading: false//,
				//personalLoading: false,
			});
		}
    }

	filterBy(selectedTemplates, category)//added
	{
		switch (category) {
			case 'Favorites':
				this.filterFavorites(selectedTemplates);
				break;
			case 'Owned':
				this.filterOwned(selectedTemplates);
				break;
			case 'Invited':
				this.filterInvited(selectedTemplates);
				break;
		}
		let lists = this.state.FavList.concat(this.state.OwnList).concat(this.state.InvitedList);//.concat(this.state.PersonalList);
		this.setState({FilteredLists: lists})
	}

	filterFavorites = (selectedTemplates) => {
		let favFilteredLists = this.filter(this.state.AllFavList, selectedTemplates);
		this.setState({FavList:favFilteredLists, FavActiveFilters:selectedTemplates});

		if(this.state.FavSortSelection !== '')
			this.sortBy(this.state.FavSortSelection, 'Favorites')
	};

    filterOwned = (selectedTemplates) => {
		let ownFilteredLists = this.filter(this.state.AllOwnList, selectedTemplates);
		this.setState({OwnList:ownFilteredLists, OwnActiveFilters:selectedTemplates});

		if(this.state.OwnSortSelection !== '')
			this.sortBy(this.state.OwnSortSelection, 'Owned')
	};

    filterInvited = (selectedTemplates) => {
		let inviteFilteredLists = this.filter(this.state.AllInvitedList, selectedTemplates);
		this.setState({InvitedList:inviteFilteredLists, InvitedActiveFilters:selectedTemplates});

		if(this.state.InvitedSortSelection !== '')
			this.sortBy(this.state.InvitedSortSelection, 'Invited')
	};

    filter = (listsToFilter, selectedTemplates) => {
    	let filteredLists = [];

		if(!selectedTemplates.includes('All'))
		{
			filteredLists = listsToFilter.filter((list) => {
				if(selectedTemplates.includes(list.template))
					return list;
			});
		}

		return filteredLists;
	};

	sortBy(sort, category)//added
	{
		let categorySort;

		switch (category) {
			case 'Favorites':
				categorySort = this.sortFavorites;
				break;
			case 'Owned':
				categorySort = this.sortOwned;
				break;
			case 'Invited':
				categorySort = this.sortInvited;
				break;
		}

		categorySort(sort);
	}

	sortInvited = (sort) => {
		let sortList = this.sortByParam(this.state.InvitedList, sort);
		this.setState({InvitedList:sortList, InvitedSortSelection:sort});
	};

    sortOwned = (sort) => {
		let sortList = this.sortByParam(this.state.OwnList, sort);
		this.setState({OwnList:sortList, OwnSortSelection:sort});
	};

    sortFavorites = (sort) => {
		let sortList = this.sortByParam(this.state.FavList, sort);
		this.setState({FavList:sortList, FavSortSelection:sort});
	};

    sortByParam = (listToSort, sort) => {
    	let sortList = [];

		if(sort === 'name')
			sortList = NewHomeScreen.alphabeticSort(listToSort);
		else if(sort === 'date')
			sortList = this.dateSort(listToSort);

		return sortList;
	};

    dateSort = (list) => {
    	let sortList = list;

    	sortList.sort((a, b) => {
			if(a.lastOpenedDate > b.lastOpenedDate)
				return -1;
			else if (a.lastOpenedDate < b.lastOpenedDate)
				return 1;
			else
				return 0;
		});

    	return sortList;
	};

	static alphabeticSort(list)
	{
		let sortList = list;
		sortList.sort(function(a, b){
			let x = a.name.toLowerCase();
			let y = b.name.toLowerCase();
			if (x < y) {return -1;}
			if (x > y) {return 1;}
			return 0;
		  });
		
		return sortList;
	}

    ListPressed(item)
	{
		let isFavorite = false;

		for(let i = 0; i < this.state.FavList.length; i++)
			if(this.state.FavList[i].List_ID === item.List_ID)
				isFavorite = true;

		let navigationParams = {
			language:this.state.language,
			list:item,
			isFavorite:isFavorite,
			refreshViewOnBack:this.refreshViewOnBack,
			contacts: this.state.contacts
		};

		this.setState({FavActiveFilters:['All'], OwnActiveFilters: ['All'], InvitedActiveFilters: ['All'],
						FavSortSelection:'', OwnSortSelection: '', InvitedSortSelection: ''});
		this.navigate('ListViewScreen', navigationParams);
	}
    
    refreshViewOnBack()
	{
		this.setState({Lists:[], FavList:[], OwnList:[],InvitedList:[]/*,PersonalList:[]*/});
		this.getUserFavoriteLists(this.state.user);
	}
    

    render() {
        let rightHeaderIcons = [];

		let fav = <ListSlider 
					data={this.state.FavList} 
					headerText={strings.Favorite + "s"} 
					function={this.ListPressed} 
					language={this.state.language} 
					FilterBy={(option,category) => {this.filterBy(option,category);}} 
					activeTemplates ={this.state.FavActiveFilters} 
					sortSelect={this.state.FavSortSelection} 
					SortBy={(sort,category) => {this.sortBy(sort,category);}} 
					loading={this.state.favLoading}
				   />;
		let own = <ListSlider 
					data={this.state.OwnList} 
					headerText={strings.Owned} 
					function={this.ListPressed} 
					language={this.state.language} 
					FilterBy={(option,category) => {this.filterBy(option,category);}} 
					activeTemplates ={this.state.OwnActiveFilters} 
					sortSelect={this.state.OwnSortSelection} 
					SortBy={(sort,category) => {this.sortBy(sort,category);}} 
					loading={this.state.ownedLoading}
				   />;
		let invited = <ListSlider 
						data={this.state.InvitedList} 
						headerText={strings.Invited} 
						function={this.ListPressed} 
						language={this.state.language} 
						FilterBy={(option,category) => {this.filterBy(option,category);}} 
						activeTemplates ={this.state.InvitedActiveFilters} 
						sortSelect={this.state.InvitedSortSelection} 
						SortBy={(sort,category) => {this.sortBy(sort,category);}} 
						loading={this.state.invitedLoading}
					   />;
       
        let addListButton = <ActionButton title={"New"}
										  buttonColor={"#005073"}
										  shadowStyle={{elevation: 5}}
										  onPress={this.addNewListPressed}
										  renderIcon={ () => <Icon name={'add'} type={'material'} color={'#fff'}/>}/>;

        if (!this.state.isLoading) {
            return (
            	<View style={{flex:1}}>
					<ScrollView style={{flex:1}}
								contentContainerStyle={{flex:1}}
								refreshControl={
						<RefreshControl
							onRefresh={this.refreshViewOnBack}
							refreshing={this.state.isLoading}
						/>}
					>
						<ListPanelHeader
									 rightIconsVisible={true}
									 rightIcons={rightHeaderIcons}
									 headerText={strings.formatString(strings.Welcome, this.state.user)}
									 searchBy={(text) => {this.searchBy(text);}}
									 />
						<View style={styles.FavPanel}>
						  {fav}
						</View>
						<View style={styles.OwnPanel}>
						  {own}
						</View>
						<View style={styles.InvitedPanel}>
						  {invited}
						</View>
						{addListButton}
					</ScrollView>
				</View>
            )
        }
        else
            return (
                <SplashScreen/>
            )
    }

}

export default NewHomeScreen;


//to organize the lists objects we use a js constructor
function ListObject(name, listID, role, template, lastOpenedDate) {
	this.name = name;
	this.List_ID = listID;
	this.role = role;
	this.template = template;
	this.lastOpenedDate = lastOpenedDate;
}

function FavoriteListObject(listID, name, template, isSelected){
	this.List_ID = listID;
	this.name = name;
	this.template = template;
	this.isSelected = isSelected;
}


const styles = StyleSheet.create({
    noList: {
        color: 'white',
        fontSize: 30,
        fontWeight: '700',
        fontFamily: 'Roboto',
    },
	textSpace: { // added start
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		padding: 10,
	},
	message: {
		flex: 4,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 35,
	},
	textStyle: {
		fontFamily: 'Roboto',
		fontSize: 18,
		color: 'whitesmoke',
		fontWeight: '500'
	}, // added end
    FavPanel: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#189ad3',
        borderBottomWidth: 2,
        borderColor: '#71c7ec',
		justifyContent: 'space-around',
		alignItems: 'center',
    },
    OwnPanel: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#189ad3',
        borderBottomWidth: 2,
        borderTopWidth: 2,
        borderColor: '#71c7ec',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    InvitedPanel: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#189ad3',
        borderBottomWidth: 2,
        borderTopWidth: 2,
        borderColor: '#71c7ec',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    PersonalPanel: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#189ad3',
        borderTopWidth: 2,
        borderColor: '#71c7ec',
        justifyContent: 'space-around',
        alignItems: 'center',
    }
});