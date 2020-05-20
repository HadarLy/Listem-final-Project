import React from 'react';
import { TextInput} from 'react-native';

class PriceInput extends React.Component {
	/*********************************************************************************************************
	 This component is designated to be used as a holder for price input, it operates as a TextInput but with type validation and Currency matching.
	 ********************************************************************************************************/

	constructor(props) {
		super(props);
		//checking if properties exists and type matching to avoid mistakes.
		if(props.hasOwnProperty('type') && typeof(props.type) === typeof("USD"))
			this.state.currencyType = PriceInput.determineCurrencyType(props.type) || 'e';
		if(props.hasOwnProperty('editable') && typeof(props.editable) === typeof(false))
			this.state.editable = props.editable;
		//Add default property value.
		if(props.hasOwnProperty('value') && typeof(props.value) === typeof("0$"))
			this.state.value = props.value;
		else
			this.state.value = '0' + this.state.currencyType;
		//Bind methods
		this.addCurrencySymbol = this.addCurrencySymbol.bind(this);
		this.finalizePrice = this.finalizePrice.bind(this);
	}

	state = {
		currencyType: '$',
		value:'0', //this state will hold the price saved in the component. Default - 0$
		editable:false
	};

	static checkPriceValidity(text) {
		//This method will validate that the text input will be a valid price format.
		//First we check if it is an empty text
		if(text === '')
			return true;
		//Then we check that there is only one decimal point.
		if (!PriceInput.containsOneDecimalDotOnly(text))
			return false;

		//Now we check if there is a negative sign in the begging or a number (both valid).
		if(text[0] !== '-' && !PriceInput.isNumber(text[0]) && !PriceInput.isCurrency(text[0]))
			return false;

		//Now for the rest of the string.
		for(let  i = 1; i < text.length - 1; i++)
		{
			if(!PriceInput.isNumber(text[i]) && (text[i] !== '.'))
				return false;
		}

		//Lastly we check if the last character is valid in the Price format.
		return PriceInput.lastCharValidInFormat(text[text.length-1]);
	}

	static lastCharValidInFormat(c)
	{
		//we check if the last char is a currency char, decimal dot, a number or a negative sign.
		return (PriceInput.isCurrency(c) || PriceInput.isNumber(c) || (c !== '.') || (c !== '-'));
	}

	static containsOneDecimalDotOnly(text)
	{
		let numberOfDots = 0;

		for(let i = 0; i < text.length; i++)
		{
			if(text[i] === '.')
				numberOfDots++;
		}

		return (numberOfDots <= 1);
	}

	static isNumber(c)
	{
		return (c <= '9' && c >= '0');
	}

	static isCurrency(c)
	{
		switch (c) {
			case '$':
			case '₪':
			case '£':
			case '€':
				return true;
			default:
				return false;
		}
	}

	static determineCurrencyType(type)
	{
		//This method will determine the currency type by a string and will return it's symbol.
		if(typeof(type) === typeof("string")) //type checking to avoid mistakes
			type.toUpperCase();
		else
			return null;

		switch (type) {
			case 'USD':
				return '$';
			case 'ILS':
			case 'NIS':
				return '₪';
			case 'GBP':
				return '£';
			case 'EUR':
				return '€';
		}
	}

	addCurrencySymbol(text)
	{
		if(!PriceInput.isCurrency(text[text.length - 1]))
			text = text + this.state.currencyType;

		return text;
	}

	render()
	{
		return (
			<TextInput onChangeText={(text) => {
				//Input validation.
				if (PriceInput.checkPriceValidity(text))
				{ //set new value.
					this.setState({value: text});
					//invoke the prop function and therefore update the screen containing the PriceInput.
					if(this.props.hasOwnProperty('onPriceChange'))
						this.props.onPriceChange(text);
				}
				else
				{ //Error message and revert back to previous value.
					this.setState({value:this.state.value});
					alert("Please enter numbers only. Price cannot be negative.");
				}
			}} editable={this.props.editable} value={this.state.value}
		           onEndEditing={this.finalizePrice}/>
		);
	}

	finalizePrice()
	{
		let price = this.state.value;

		if(price !== '')
		{
			price = PriceInput.deleteLeadingZeros(price);
			price = PriceInput.deleteFollowingZeros(price);
		}
		else
			price = '0';

		price = this.addCurrencySymbol(price);
		this.setState({value:price});
		if(this.props.hasOwnProperty('onPriceChange'))
			this.props.onPriceChange(price);
	}

	static deleteLeadingZeros(price)
	{
		//if the price is in 0.xxx format then we have no need to delete leading zeros
		if(price[0] === '0' && price[1] === '.')
			return price;

		let finalizedPrice = '';
		let i = 0;
		//skip leading zeros to start copying from the correct place
		while(price[i] === '0')
			i++;

		if(price[i] === '.')
			//if the next char we check is '.' we will start the finalizedPrice with '0' and start copying after it
			finalizedPrice = '0';

		//copy the remaining chars
		for(let j = i; j < price.length; j++)
			finalizedPrice += price[j];

		return finalizedPrice;
	}

	static deleteFollowingZeros(price)
	{
		//if the price doesn't have a decimal point all following zeros matter
		if(!PriceInput.hasDecimalPoint(price))
			return price;

		let finalizedPrice = '';
		let i;
		//check if there is a currency type in the end of the string to determine where to start the checking
		if(PriceInput.isCurrency(price[price.length - 1]))
			i = price.length - 2;
		else
			i = price.length - 1;
		//skip following zeros
		while(price[i] === '0')
		   i--;
		//if we reached a decimal point, delete it too
		if(price[i] === '.')
			i--;
		//copy the price
		for(let j = 0; j <= i; j++)
			finalizedPrice += price[j];

		return finalizedPrice;
	}

	static hasDecimalPoint(price)
	{
		for(let i = 0; i < price.length; i++)
			if(price[i] === '.')
				return true;

		return false;
	}
};

export default PriceInput;