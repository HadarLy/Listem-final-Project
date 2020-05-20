import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import MyButton from './MyButton';
import CategoryFilter from './CategoryFilter';



class ListSlider extends React.Component {

	renderContent = (buttons) => {
		return buttons.length === 0 ? (<View style={styles.noList_container}>
			<Text style={styles.noLists_title}>No Lists</Text>
		</View>)
			: (
				<View style={styles.container}>
					<View style={styles.headerScroll}>
						<View style={styles.textSpace}>
							<Text style={styles.textStyle}>{this.props.headerText}</Text>
						</View>
						<View style={styles.iconFilter}>
							<TouchableOpacity>
								<CategoryFilter categoryName={this.props.headerText} language={this.props.language} activeTemplates={this.props.activeTemplates} sortSelect={this.props.sortSelect} FilterBy={this.props.FilterBy} SortBy={this.props.SortBy} />
							</TouchableOpacity>
						</View>
					</View>
					<View style={styles.scroll}>
						<ScrollView
							horizontal={true}
							showsHorizontalScrollIndicator={false}
						>
							{buttons}
						</ScrollView>
					</View>
				</View>
			);
	}

	renderLoading = () => {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color='white'/>
			</View>
		);
	}
	render() {
		const { loading, data } = this.props;
		let buttons = data && data.filter(item => item.name !=='null').map((item, i) => {
			return item.name !== 'null' && (
				<View key={i} style={styles.view}>
					<MyButton text={item.name} function={() => this.props.function(item)}/>
				</View>
			)
		});

		return (
			<View>
				{loading ? this.renderLoading() : this.renderContent(buttons)}
			</View>
		)
	}


}

export default ListSlider;

const width = Dimensions.get('window').width;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	noList_container: {
		flex: 1,
		justifyContent: 'center',
	},
	noLists_title: {
		fontSize: 30,
		color: 'white',
		fontWeight: 'bold',
	},
	headerScroll: {
		flex: 1,
		flexDirection: 'row',
		width: width,
	},
	textSpace: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		padding: 10,
	},
	textStyle: {
		fontFamily: 'Roboto',
		fontSize: 18,
		color: 'whitesmoke',
		fontWeight: '500'
	},
	iconFilter: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'flex-end',
		padding: 5,
	},
	scroll: {
		flex: 4,
		flexDirection: 'row',
		alignItems: 'flex-start',
	},
	loadingContainer: {
		flex: 1,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
	},
})