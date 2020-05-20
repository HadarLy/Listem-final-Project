import React, {Component} from 'react';
import { /*Tooltip*/ Icon } from 'react-native-elements';
import Tooltip from "rne-modal-tooltip";
import {StyleSheet} from 'react-native';
import strings from '../Language/language'
import FilterForm from './FilterForm';

/********************************************************************************************************
	 This component is toolTip that will open up when pressing on one of the filter icons in the home screen.
**********************************************************************************************************/

class CategoryFilter extends Component {

	constructor(props) {
		super(props);
    }
 
    render(){  
        return(
            <Tooltip containerStyle={styles.toolTipContainer} height ={230} width={250} withPointer={true} backgroundColor= {'whitesmoke'} popover={<FilterForm category= {this.props.categoryName} language = {this.props.language} activeTemplates={this.props.activeTemplates} sortSelect={this.props.sortSelect} FilterBy= {this.props.FilterBy} SortBy={this.props.SortBy}/>} >
                <Icon
								name='filter'
								type='material-community'
								size={25}
								color="#fff"
							/>
            </Tooltip>
        )
    }
}

export default CategoryFilter

const styles = StyleSheet.create({
    toolTipContainer: {
        flex: 1,
	}
})