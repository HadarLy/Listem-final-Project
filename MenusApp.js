import React from 'react'
import App from './App'
import { MenuProvider } from 'react-native-popup-menu'

export const MenusApp = () => (
    <MenuProvider>
      <App/>
    </MenuProvider>
);

