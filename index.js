/**
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import {AppRegistry} from 'react-native';
// import App from './App';
import {name as appName} from './app.json';
import { MenusApp } from './MenusApp'

AppRegistry.registerComponent(appName, () => MenusApp);
