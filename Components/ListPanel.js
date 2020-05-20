import React from 'react'
import PropTypes from 'prop-types'
import { StyleSheet, View, FlatList, TouchableHighlight, Text} from 'react-native';
import { Icon, ListItem } from 'react-native-elements';
import { ScrollView, RefreshControl } from 'react-native';
import { Menu, MenuOption, MenuOptions, MenuTrigger} from 'react-native-popup-menu';
import ListPanelHeader from "./ListPanelHeader";
import strings from '../Language/language'
/*--------------------------------------------------------------------------------
Props:
	--data={some kind of data}
		this data will be represented on the flatlist
	--itemFunction={function}
		this function will run once pressing one of the flatlist items
	--rightIconsVisible={true/false} - mandatory field
		if true, we will see 1/2 right icons according to what we provided
	--rightIcons={an array of objects}
		each object represent a right icon, each object have the following props:
			-name-name of the icon according to react-native-elements
			-type-type of the icon according to react-native-elements
			-function-what will run when pressing the icon
			-size-a number, representing the size of the icon
			-color-the color of an icon
	--backFunction=function
		a function to be run when pressing the back button.
	--searchBy-function
		a function to be run when starting a search.
	--refreshing={boolean state}
		a state to be wired to the pull to refresh functionality.
------------------------------------------------------------------------------------------*/


class ListPanel extends React.Component {
	static menuTypes = {UsersListManager:"UsersListManager", ListItems:"ListItems", UsersList:"UsersList", AddUser:"AddUser"}; //This is an enum equivalent in JS
	static keyExtractor(item)
	{ //Maybe remove it completely, need to check further.
		if(item.hasOwnProperty('List_ID'))
			return item.List_ID.toString() ;
		else if (item.hasOwnProperty('Item_ID'))
			return item.Item_ID.toString();
		else if (item.hasOwnProperty('template_ID'))
			return item.template_ID.toString();
		else if (item.hasOwnProperty('List_Place'))
			return item.List_Place.toString();
	}

	itemPressed = (item) =>
	{
		if(this.props.hasOwnProperty('itemFunction'))
			this.props.itemFunction(item);
	};

	openMenu = () => {
		console.log('ok');
		this.menu.open();
	};

	getMenuOptions = (item) => {
		let options = null;
		let menuType = this.props.hasOwnProperty('menuType') ? this.props.menuType : '';

		//based on the menu type we can choose which options to present in the long press menu.
		if(menuType === ListPanel.menuTypes.UsersListManager)
		{
			options = <MenuOptions>
						<MenuOption text={strings.formatString(strings.MakeXManger, item.name)} onSelect={() => {this.props.toggleRole(item)}}/>
						<MenuOption text={strings.formatString(strings.Remove, item.name)} onSelect={() => {this.props.removeUser(item)}}/>
					  </MenuOptions>;
		}
		else if (menuType === ListPanel.menuTypes.ListItems)
		{
			options = <MenuOptions>
							<MenuOption text={strings.formatString(strings.Remove, item.name)} 
							onSelect={() => {
									const { removeFunc } = this.props;
									removeFunc && removeFunc(item);
								}}/>
					  </MenuOptions>;
		}
		else
		{
			options = <MenuOptions/>;
		}

		return options;
	};

	getListItemRightIcon = (item) => {
		//based on the menu type we can determine which right icon each item will show.
		switch(this.props.menuType)
		{
			case ListPanel.menuTypes.AddUser:
				return  (item.usesApp) ? {name:'check-circle', color:'green'} : null;
				break;
			case ListPanel.menuTypes.UsersListManager:
			case ListPanel.menuTypes.UsersList:
				return (item.permissions === 'Owner' || item.permissions === 'Manager') ? {name:'perm-identity'} : null;
				break;
			default:
				return {name:'chevron-right'};
				break;
		}
	};

	itemPastDue = (item) => {
		if(!item.hasOwnProperty('Due_Date'))
			return null;

		let dueDate = new Date(item['Due_Date']);
		let currDate = new Date();

		return ((currDate > dueDate) && !item.Done);
	};

	getSubtitle = (item, pastDue) => {
		let subtitle = item.hasOwnProperty('Done') ? (item.Done ? 'Done' : null) : null;
		subtitle = subtitle == null ? (item.hasOwnProperty('Bought') && item.Bought ? 'Bought' : null) : subtitle;

		return pastDue ? 'Past Due' : subtitle;
	};

	getDoneMark = (item) => {
		if(item.hasOwnProperty('Done'))
			return item.Done;
		else if(item.hasOwnProperty('Bought') && item.Bought)
			return item.Bought;
		else
			return false;
	};

	renderItem = ({item}) => {
		let listItemIcon = this.getListItemRightIcon(item);
		let MenuOptions = this.getMenuOptions(item);
		let itemStyle = item.hasOwnProperty('style') ? item.style : null;
		let doneMark = this.getDoneMark(item) ? styles.doneItem : null;
		let pastDue = item.hasOwnProperty('Due_Date') && this.itemPastDue(item) ? styles.pastDueItem : null;
		let subtitle = this.getSubtitle(item, this.itemPastDue(item));

		return(
			<Menu>
				<MenuTrigger style={{marginLeft:0}}
				             onAlternativeAction={() => {this.itemPressed(item)}}
				             triggerOnLongPress={true}
				             customStyles = {{
					             TriggerTouchableComponent: TouchableHighlight
				             }}
				>
					<ListItem
						title={item.name}
						containerStyle={[{
							borderBottomColor: 'grey',
							borderBottomWidth: 1,
						}, itemStyle]}
						rightIcon={listItemIcon}
						subtitle={subtitle}
						subtitleStyle={[doneMark, pastDue]}
					/>
				</MenuTrigger>
				{MenuOptions}
			</Menu>
		)
	};

    render() {
    	let header = <ListPanelHeader backFunction={this.props.backFunction}
	                                  rightIconsVisible={this.props.rightIconsVisible}
	                                  rightIcons={this.props.rightIcons}
	                                  searchBy={this.props.searchBy}
	                                  headerText={this.props.headerText}/>;
		
        return (
			<ScrollView
			refreshControl={
				<RefreshControl
				onRefresh={this.props.refreshRequested}
				refreshing={this.props.refreshing}
				  />}>
				<View>
					<FlatList
						style={styles.theFlatList}
						data={this.props.data}
						renderItem={this.renderItem}
						keyExtractor={item => item[this.props.keyName].toString()}
						stickyHeaderIndices={[0]}
						onRefresh={this.props.refreshRequested}
						refreshing={this.props.refreshing}
						ListHeaderComponent={header}
						initialNumToRender={15}
						maxToRenderPerBatch={2}
						windowSize={15}
						removeClippedSubviews={true}
					/>
				</View>				
			</ScrollView>
        )
	}
}

ListPanel.propTypes = {
	/*
	The propTypes determine which props we require from the user and which are optional.
    */
	refreshing: PropTypes.bool.isRequired,
	refreshRequested: PropTypes.func.isRequired,
	menuType: PropTypes.string.isRequired, //Decide which type of long press menu to present.
	toggleRole: PropTypes.func, //Required in-case we need to show the make manager menu option
	removeUser: PropTypes.func, //Required in-case we need to show the remove user menu option
	itemFunction: PropTypes.func, //decides what to do when an item is pressed.
	keyName:PropTypes.string.isRequired //Required for faster list rendering.
};

const styles = StyleSheet.create({

    FlatListHeader: {
        flexDirection: 'row',
		height: 44,
        backgroundColor: '#22a6b3'
	},
	menuPos: {
		marginBottom: 10,
		marginLeft: 15
	},
    FlatListHeaderDivider: {
        flex:5,
        flexDirection: 'row',
    },
    FlatListIconContainer: {
        flex:1.5,
        flexDirection: 'row',
        justifyContent: 'space-around',
		alignItems: 'center',
    },
    theFlatList: {
        borderRadius: 4
    },
	doneItem: {
    	color: 'green'
	},
	pastDueItem: {
    	color: '#FF0000'
	}
});

export default ListPanel