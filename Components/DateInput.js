import React from 'react';
import {Text, View, StyleSheet} from 'react-native';
import DateTimePicker from 'react-native-modal-datetime-picker';

class DateInput extends React.Component {
	/*********************************************************************************************************
	 This component will hold the text for the date field, pressing it will open the DatePicker.
	 ********************************************************************************************************/
	static getDateString(date)
	{
		let month = date.getMonth() + 1; //months are counted from zero, we need to format it correctly.
		let addZero = '';
		let addZeroToDay = '';
		if(month < 10) //add  a leading zero in case month is one digit, needed for correct formatting.
			addZero = '0';
		if(date.getDate() < 10)
			addZeroToDay = '0'

		return  date.getFullYear() + '-' + addZero + month + '-' + addZeroToDay + date.getDate();
	}

	static dateStringLocale(date)
	{
		try{
			let splices = date.split('-');

			return splices[2] +'-' + splices[1] + '-' + splices[0];
		}
		catch(e)
		{ //catch the exception in case the date is not in the right format.
			return '##-##-####';
		}

	}

	constructor(props) {
		super(props);
		//checking if properties exists and type matching to avoid mistakes.
		this.DateFormatClicked = this.DateFormatClicked.bind(this);
		this.DatePickerConfirmPressed = this.DatePickerConfirmPressed.bind(this);
		this.DatePickerCancelPressed = this.DatePickerCancelPressed.bind(this);
	}

	state = {
		VisiblePicker:false,
		Date: new Date(),
		style:styles.date
	};

	componentWillMount()
	{
		this.setState({Date:this.props.Date});
	}

	DateFormatClicked()
	{
		if(this.props.hasOwnProperty('Editable'))
			if(this.props.Editable)
				this.setState({VisiblePicker:true});
	}

	DatePickerConfirmPressed(date)
	{
		let newDate = DateInput.getDateString(date);
		this.setState({VisiblePicker:false, Date:newDate, style:styles.newDate});
		if(this.props.hasOwnProperty('DatePickerConfirm'))
			this.props.DatePickerConfirm(this.state.Date);
	}

	DatePickerCancelPressed()
	{
		this.setState({VisiblePicker:false});
	}

	render()
	{
		let textStyle = this.props.editable ? styles.dateEnabled : styles.dateDisabled;

		return (
			<View style={this.props.style}>
				<Text onPress={this.DateFormatClicked} style={[textStyle, {height:40, textAlignVertical:'center'}]}>{DateInput.dateStringLocale(this.state.Date)}</Text>
				<DateTimePicker isVisible={this.state.VisiblePicker}
				                onConfirm={(date) => {this.DatePickerConfirmPressed(date)}}
		                        onCancel={this.DatePickerCancelPressed}
		                        date={new Date(this.state.Date)}/>
			</View>
		);
	}
}

export default DateInput;

const styles = StyleSheet.create({
	dateDisabled:{
		color:'#65666b'
	},
	dateEnabled:{
		color:"black"
	},
	newDate:{
		color:"black",
		fontWeight:"bold"
	}
});