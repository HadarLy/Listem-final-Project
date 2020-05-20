import React from 'react';
import { Platform } from 'react-native';
//AWS integration
import { withAuthenticator } from 'aws-amplify-react-native';
import Amplify, {API} from 'aws-amplify';
import aws_exports from './src/aws-exports';
//Pages for navigation
import {createStackNavigator, createAppContainer} from 'react-navigation';
import NewHomeScreen from './Pages/NewHomeScreen.js';
import NewListScreen from "./Pages/NewListScreen";
import CreateCustomizedTemplateScreen from './Pages/CreateCustomizedTemplateScreen';
import PreviewTemplateBeforeCreationScreen from './Pages/PreviewTemplateBeforeCreationScreen';
import ListViewScreen from "./Pages/ListViewScreen";
import ItemViewScreen from "./Pages/ItemViewScreen";
import ListUsersScreen from "./Pages/ListUsersScreen";
import AddUserScreen from "./Pages/AddUserScreen";


/**************************************************************/
//Important!!! Needed for backend integration!
Amplify.configure(aws_exports);
/**************************************************************/

const instructions = Platform.select({ //Default code from react-native project creation, leaving it for documentation purposes if we ever need to know how to differentiate between platforms.
	ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
	android:
		'Double tap R on your keyboard to reload,\n' +
		'Shake or press menu button for dev menu',
});

//Navigator is for  changing screens, for each new screen we add to the app we need to create a reference as below. (don't forget to import).
const MainNavigator = createStackNavigator({
	Home: NewHomeScreen,
	NewListScreen: NewListScreen,
	PreviewTemplateBeforeCreationScreen: PreviewTemplateBeforeCreationScreen,
	ListViewScreen:ListViewScreen,
	ItemViewScreen:ItemViewScreen,
	ListUsersScreen:ListUsersScreen,
	AddUserScreen:AddUserScreen,
	CreateCustomizedTemplateScreen:CreateCustomizedTemplateScreen
},
	{
		//This will disable the annoying header with the back button.
		headerMode: 'none',
		navigationOptions: {
			headerVisible: false,
		}
	});


const App = createAppContainer(MainNavigator);

//WithAuthenticator is for the login page, we will change it at the end.
export default withAuthenticator(App);