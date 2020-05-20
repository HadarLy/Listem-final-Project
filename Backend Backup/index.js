'use strict';
console.log("Loading function");

const AWS = require('aws-sdk');
const uuidv1 = require('uuid/v1'); //used to create unique IDs
const https = require('https'); //used to make http requests
const docClient = new AWS.DynamoDB.DocumentClient({region:process.env.MOBILE_HUB_PROJECT_REGION});
const FAVORITESCOLLECTION = "listem-mobilehub-1135241219-FavoriteLists";
const LISTSCOLLECTION = "listem-mobilehub-1135241219-ListInfo";
const LISTITEMSCOLLECTION = "listem-mobilehub-1135241219-ListItem";
const DBINFOCOLLECTION = "listem-mobilehub-1135241219-DBInfo";
const PARTICIPATIONCOLLECTION = "listem-mobilehub-1135241219-Participations";
const TEMPLATESCOLLECTION = "listem-mobilehub-1135241219-Template";
const USERSCOLLECTION = "listem-mobilehub-1135241219-Users";


exports.handler = async (event) => {
	//************************** HANDLE POST *************************//
	if(event.httpMethod === 'POST')
	{
		let requestBody = event.body;
		let response = {};
		let reqInfo = JSON.parse(requestBody);
		let methodRequest;
		
		switch(reqInfo.type)
		{
			case 'GAT': //Get All Templates
				methodRequest = GetAllTemplates;
				break;
			case 'GTF': //Get Template Fields
				methodRequest = GetTemplateFields;
				break;
			case 'CNLFT': //Creaete New List From Template
				methodRequest = CreateNewListFromTemplate;
				break;
			case 'GLI': //Get List Items
				methodRequest = GetListItems;
				break;
			case 'GFUL': //Get Favorite User Lists
				methodRequest = GetFavoriteUserList;
				break;
			case 'GAUL': //Get All User Lists
				methodRequest = GetAllUserLists;
				break;
			case 'GII': //Get Item Info
				methodRequest = GetItemInfo;
				break;
			case 'ULI': //Update List Item
				methodRequest = UpdateListItem;
				break;
			case 'CLI': //Create List Item
				methodRequest = CreateListItem;
				break;
			case 'DLI': //Delete List Item
				methodRequest = DeleteListItem;
				break;
			case 'GLU': //Get List Users
				methodRequest = GetListUsers;
				break;
			case 'TUR': //Toggle User Role
				methodRequest = ToggleUserRole;
				break;
			case 'RUFL': //Remove User From List
				methodRequest = RemoveUserFromList;
				break;
			//IMPORTANT!!  don't change the order of ALTF and DLFF they have to be together and in this order!!
			case 'ALTF': //Add List To Favorites
			case 'DLFF': //Delete List From Favorites
				methodRequest = ToggleListFromFavorites;
				break;
			//Add after this.
			case 'GCTUA': //Get Contacts That Use App
				methodRequest = GetContactsThatUseApp;
				break;
			case 'AUTL': //Add User To List
				methodRequest = AddUsersToList;
				break;
			case 'ALI':
				methodRequest = AnalyzeListItems;
				break;
			default:
				response.body = JSON.stringify({message:"Incorrect post request", type:reqInfo.type});
				response.statusCode = 400;
				return response;
		}
		
		response = await methodRequest(response, reqInfo);
		return response;
	}
};

async function GetAllTemplates(response, reqInfo)
{
    let params = {
		TableName:TEMPLATESCOLLECTION,
		AttributesToGet:["Template_Name", "Template_ID"]
	};
	
	try
	{
		
		const Templates = await docClient.scan(params).promise();
		
		response.body = JSON.stringify(Templates);
		response.statusCode = 200;
		return response;
	}
	catch(e)
	{
		return returnError(response, e);
	}
}

async function GetTemplateFields(response, reqInfo)
{
    if(reqInfo.templateID == null)
	{
		return IncorrectRequestMessage(response, "{templateID}");
	}
	
	let params = {
		TableName:TEMPLATESCOLLECTION,
		KeyConditionExpression: 'Template_ID = :ID',
		 ExpressionAttributeValues: {
	    	':ID': reqInfo.templateID
	  }
	};
	
	try
	{
		const fields = await docClient.query(params).promise();
		
		response.body = JSON.stringify(fields);
		response.statusCode = 200;
		return response;
	}
	catch(e)
	{
		return returnError(response, e);
	}
}

async function CreateNewListFromTemplate(response, reqInfo)
{
	//Request Validation
	if(reqInfo.creator == null || reqInfo.listName == null || reqInfo.templateID == null)
	{
		return IncorrectRequestMessage(response, "{creator, listName, templateID}");
	}
	
	let listID = uuidv1();
	//Set up the request to create the new list in the DB.
	let params = {
		Item:{
				"List_ID":listID,
				"List_Owner": reqInfo.creator,
				"Last_Modified": Date.now(),
				"List_Name": reqInfo.listName,
				"Template_ID": reqInfo.templateID
			},
			TableName:LISTSCOLLECTION
	};
	
	//Create the entry in the DB
	try
	{
		await docClient.put(params).promise();
	}
	catch(e)
	{
		return returnError(response, e);
	}
	
	//Create Entry in participation collection
	try
	{
		await docClient.put({
			TableName:PARTICIPATIONCOLLECTION,
			Item:{
				"Username": reqInfo.creator,
				"List_ID": listID,
				"Role": "Owner",
				"List_Name": reqInfo.listName,
				"Template_ID": reqInfo.templateID
			}}).promise();
	}
	catch(e)
	{
		return returnError(response, e);
	}
	
	//Send success response.
	response = {
		statusCode: 201,
		body: JSON.stringify({
			message: 'List created successfully',
			CreatedListId:listID
		})
	};
		
	return response;
}

async function GetListItems(response, reqInfo)
{
	//Validate that the request has the correct properties.
	if(reqInfo.username == null || reqInfo.listID == null)
	{
		return IncorrectRequestMessage(response, "{username, listID}");
	}
	
	//Set up the query to the DB to get the correct list items
	let getListItemsParams = {
		TableName:LISTITEMSCOLLECTION,
		FilterExpression : 'List_ID = :List_ID',
		ExpressionAttributeValues: {
	    	':List_ID': reqInfo.listID
	    	}
	};
	
	let listItems;
	//now we will query the DB and get all the list items.
	try
	{
		listItems = await docClient.scan(getListItemsParams).promise();
	}
	catch(e)
	{
		return returnError(response, e);
	}
	
	//now we will check for the user's permissions for this list (needed in the frontend for correct page rendering)
	let listPermissions = {
		TableName:PARTICIPATIONCOLLECTION,
		KeyConditionExpression: 'List_ID = :List_ID and Username = :Username',
		ExpressionAttributeValues: {
	    	':List_ID': reqInfo.listID,
	    	':Username':reqInfo.username
	  }
	};
	
	let permissions = '';
	let participationEntry;
	try
	{
		participationEntry = await docClient.query(listPermissions).promise();
		participationEntry = participationEntry.Items[0];//get to the first (and only) item retrieved since (List_ID, Username) is a key of the participation table.
		permissions = participationEntry['Role']; //save the role of the user to send to frontend
		await updateParticipationLastUsedDate(participationEntry);
	}
	catch(e)
	{
		return returnError(response, e);
	}
	
	//determine the list template id to be used in the frontend
	let listTemplateID = 0;
	try
	{
		listTemplateID = participationEntry.Template_ID;
	}
	catch(e)
	{
		return returnError(response, "Couldn't find list info");
	}
		
	response = {
		statusCode:200,
		body:JSON.stringify({
			message:'Successfully retrieved list items',
			items:listItems,
			userPermissions:permissions,
			templateID:listTemplateID
		})
	};
	
	return response;
}

async function GetFavoriteUserList(response,reqInfo)
{
	if(reqInfo.username == null)
	{
		return IncorrectRequestMessage(response, "{username}");
	}
	
	let params = {
		TableName:FAVORITESCOLLECTION,
		KeyConditionExpression: 'userId = :USERID',
		 ExpressionAttributeValues: {
	    	':USERID': reqInfo.username
		},
	};
	
	try
	{
		const fields = await docClient.query(params).promise();
		
		response.body = JSON.stringify(fields);
		response.statusCode = 200;
		return response;
	}
	catch(e)
	{
		return returnError(response, e);
	}
}

async function GetAllUserLists(response,reqInfo)
{
	if(reqInfo.username == null)
	{
		return IncorrectRequestMessage(response, "{username}");
	}
	
	//TODO: add call to users collection to get the phone number and check participation by it as well.
	let params = {
		TableName:PARTICIPATIONCOLLECTION,
		KeyConditionExpression: 'Username = :USERNAME',
		 ExpressionAttributeValues: {
	    	':USERNAME': reqInfo.username
		},
	};
	
	//TODO: add a call to the Lists collection / add to participation collection the Last_Used parameter and then compare 
	//		(add indication in the response that list has changed)
	
	try
	{
		const fields = await docClient.query(params).promise();
		
		response.body = JSON.stringify(fields);
		response.statusCode = 200;
		return response;
	}
	catch(e)
	{
		return returnError(response, e);
	}
}

async function GetItemInfo(response, reqInfo)
{
	if(reqInfo.itemID == null)
	{
		return IncorrectRequestMessage(response, "{ItemID}");
	}
	
	let params = {
		TableName:LISTITEMSCOLLECTION,
		KeyConditionExpression: 'Item_ID = :Item_ID',
		 ExpressionAttributeValues: {
	    	':Item_ID': reqInfo.itemID
		}
	};
	
	try
	{
		const fields = await docClient.query(params).promise();
		let item = {
			Fields:fields.Items[0].Fields
		};
		
		response.body = JSON.stringify(item);
		response.statusCode = 200;
		return response;
	}
	catch(e)
	{
		return returnError(response, e);
	}
}

async function UpdateListItem(response, reqInfo)
{
	if(reqInfo.item == null || reqInfo.itemID == null)
	{
		return IncorrectRequestMessage(response, "{item, itemID}");
	}
	
	//get the fields sent in the DB format
	let Fields = {};
	
	for(let i = 0; i < reqInfo.item.length ; i++)
	{
		Fields[reqInfo.item[i].fieldName] = reqInfo.item[i].fieldValue;
	}

	//now we will query the DB to find the item to update
	let params = {
		TableName:LISTITEMSCOLLECTION,
		KeyConditionExpression: 'Item_ID = :Item_ID',
		 ExpressionAttributeValues: {
	    	':Item_ID': reqInfo.itemID
		}
	};
	
	try
	{
		let item = await docClient.query(params).promise();
		
		//now we will update the item to the current fields.
		item.Items[0].Fields = Fields;
		item.Items[0].Last_Modified = Date.now();
		item.Items[0].Item_Name = Fields['Name'];
		//now we will update the item in the DB
		await docClient.put({
			TableName:LISTITEMSCOLLECTION,
			Item:item.Items[0]
		}).promise();
			
		response.body = JSON.stringify({message:"Item Updated Successfully"});
		response.statusCode = 201;
		return response;
	}
	catch(e)
	{
		return returnError(response, e);
	}
}


async function CreateListItem(response, reqInfo)
{
	let numOfItemsProp = 'NumberOfItems';
	let numOfItems;
	//Request Validation
	if(reqInfo.item == null || reqInfo.listID == null || reqInfo.templateID == null)
	{
		return IncorrectRequestMessage(response, "{item, listID, templateID}");
	}
	
	let Fields = {};
	
	for(let i = 0; i < reqInfo.item.length ; i++)
	{
		try
		{
			Fields[reqInfo.item[i].fieldName] = getFieldValue(reqInfo.item[i]);
		}
		catch(e)
		{
			return returnError(response, "Mandatory field cannot be empty string");
		}
	}
	
	let params = {
		Item:{
				"Item_ID": uuidv1(),
				"List_ID": reqInfo.listID,
				"Last_Modified": Date.now(),
				"Item_Name": Fields.Name,
				"Fields":Fields,
				"Template_ID": reqInfo.templateID
			},
			TableName:LISTITEMSCOLLECTION
	};
	
	//Create the entry in the DB
	try
	{
		await docClient.put(params).promise();
	}
	catch(e)
	{
		return returnError(response, e);
	}
	
	//Send success response.
	response = {
		statusCode: 201,
		body: JSON.stringify({
			message: 'Item created successfully',
			CreatedItemId:numOfItems
		})
	};
		
	return response;
}

async function DeleteListItem(response, reqInfo)
{
	//Request Validation
	if(reqInfo.itemID == null || reqInfo.listID == null)
	{
		return IncorrectRequestMessage(response, "{itemID, listID}");
	}
	
	let deleteParams = {
		TableName:LISTITEMSCOLLECTION,
		Key:{
        	"Item_ID": reqInfo.itemID,
        	"List_ID": reqInfo.listID
    	}
	};
	
	try
	{
		await docClient.delete(deleteParams).promise();
	}
	catch(e)
	{
		return returnError(response, e);
	}
	
	//Send success response.
	return returnSuccessMessage(response, "Item deleted successfully", 209);
}

async function ToggleListFromFavorites(response, reqInfo)
{
		//Request Validation
	if(reqInfo.username == null || reqInfo.ListID == null || reqInfo.ListName == null)
	{
		return IncorrectRequestMessage(response, "{ListID, username, ListName}");
	}
	
	//Set up request to utility DB to get number of lists (to give the list a new unique ID)
	let userFavoritesParams = {
		TableName:FAVORITESCOLLECTION,
		KeyConditionExpression: 'userId = :userId',
		ExpressionAttributeValues: {
	    	':userId': reqInfo.username
		}
	};
	
	//Decide if we add a new favorite or delete an existing favorite.
	let favoriteMethod;
	let valueOfFavoriteToFind = 0;
	let message = '';
	if(reqInfo.type === 'ALTF')
	{
		favoriteMethod = getNewDocumentForFavoriteCollection;
		valueOfFavoriteToFind = ["0"];
		message = "Favorite added successfully";
	}
	else
	{ //type === DLFF
		favoriteMethod = deleteFavoriteFromDocumentForFavoriteCollection;
		if(typeof(reqInfo.ListID) === typeof([]))
			valueOfFavoriteToFind = reqInfo.ListID;
		else
			valueOfFavoriteToFind = [reqInfo.ListID];
		message = "Favorite removed successfully";
	}
	
	//query the Favorites collection to find the user document.
	let userFavorites;
	let availableFavorite = [];
	try
	{
		userFavorites = await docClient.query(userFavoritesParams).promise();
		userFavorites = userFavorites.Items[0];
		//create the array to handle the request (either find one property to add to or find all the properties to delete)
		availableFavorite = createAvailableFavoritesArray(reqInfo.type, userFavorites, valueOfFavoriteToFind);
		
		if(!Array.isArray(availableFavorite) || !availableFavorite.length)
		{ //User already has 4 favorites or the list is not a favorite, send error message.
			return cannotToggleFavorite(response);
		}
	}
	catch(e)
	{
		return returnError(response, e);
	}
	
	//run the method to add/remove the user favorite.
	userFavorites = favoriteMethod(userFavorites, availableFavorite, reqInfo.ListID, reqInfo.ListName);	
	
	//update the Favorites collection
	try
	{
		await docClient.put({
			TableName:FAVORITESCOLLECTION,
			Item:userFavorites
		}).promise();
	}
	catch(e)
	{
		return returnError(response, e);
	}
	
	//Send success response.
	return returnSuccessMessage(response, message, 201);
}

async function GetListUsers(response, reqInfo)
{
	if(reqInfo.ListID == null)
	{
		return IncorrectRequestMessage(response, "{ListID}");
	}
	
	//Set up the query to the DB to get the correct list items
	let getListUsersParams = {
		TableName:PARTICIPATIONCOLLECTION,
		FilterExpression : 'List_ID = :List_ID',
		ExpressionAttributeValues: {
	    	':List_ID': reqInfo.ListID
	    }
	};
	
	let listUsers = null;
	try
	{
		listUsers = await docClient.scan(getListUsersParams).promise();
	}
	catch(e)
	{
		return returnError(e);
	}
	
	response = {
		statusCode:200,
		body:JSON.stringify({
			message:'Successfully retrieved list users',
			listUsers:listUsers
		})
	};
	
	return response;
}

async function ToggleUserRole(response, reqInfo)
{
	if(reqInfo.ListID == null || reqInfo.Username == null)
	{
		return IncorrectRequestMessage(response, "{ListID, Username}");
	}
	
	let userParams = {
		TableName:PARTICIPATIONCOLLECTION,
		KeyConditionExpression: 'Username = :Username and List_ID = :List_ID',
		ExpressionAttributeValues: {
	    	':Username': reqInfo.Username,
	    	':List_ID' : reqInfo.ListID
	  }
	};
	
	try 
	{
		let user = await docClient.query(userParams).promise();
		user = user.Items[0];
		user.Role = 'Manager';
		await docClient.put({
			TableName:PARTICIPATIONCOLLECTION,
			Item:user
		}).promise();
	}
	catch(e)
	{
		return returnError(response, e);
	}
	
	return returnSuccessMessage(response, "User Became Manager" , 201);
}

async function RemoveUserFromList(response, reqInfo)
{
	//Request Validation
	if(reqInfo.Username == null || reqInfo.ListID == null)
	{
		return IncorrectRequestMessage(response, "{Username, ListID}");
	}
	
	let deleteParams = {
		TableName:PARTICIPATIONCOLLECTION,
		Key:{
        	"Username": reqInfo.Username,
        	"List_ID": reqInfo.ListID
    	}
	};
	
	try
	{
		await docClient.delete(deleteParams).promise();
	}
	catch(e)
	{
		return returnError(response, e);
	}
	
	//Send success response.
	return returnSuccessMessage(response, "User removed successfully", 209);
}

async function GetContactsThatUseApp(response, reqInfo)
{
	if(reqInfo.contacts == null)
	{
		return IncorrectRequestMessage(response, "{contacts}");
	}
	
	let getUsersParams = {
		TableName:USERSCOLLECTION
	};
	
	//get all the app users from the collection, then compare with the contacts we received from the user and flag which ones are available.
	//maybe there is a better way (indexing?) but for now that will do.
	let appUsers = [];
	try
	{
		appUsers = await docClient.scan(getUsersParams).promise();
		appUsers = appUsers.Items;
		appUsers = compareAllUsersWithContacts(appUsers, reqInfo.contacts);
	}
	catch(e)
	{
		return returnError(response, e);
	}
	
	//return the response with all the contacts that has the app.
	response = {
		statusCode:200,
		body:JSON.stringify({
			users:appUsers,
			message:"Successfully retrieved contacts"
		})
	};
	
	return response;
}

async function AddUsersToList(response, reqInfo)
{
	if(reqInfo.users == null || reqInfo.listID == null || reqInfo.listName == null || reqInfo.templateID == null)
	{
		return IncorrectRequestMessage(response, "{users, listID, listName, templateID}");
	}
	
	try
	{
		for(let i = 0; i < reqInfo.users.length; i++)
		{
			let username = await getUserName(reqInfo.users[i]);
			username = username.Items[0].username;
			let participationParams = {
				TableName:PARTICIPATIONCOLLECTION,
				Item:{
					"Username": username,
					"List_ID": reqInfo.listID,
					"Role": "Participator",
					"List_Name": reqInfo.listName,
					"Template_ID": reqInfo.templateID
				}
			};
		
			await docClient.put(participationParams).promise();
			//await addUserToList(reqInfo.users[i], reqInfo.listID, reqInfo.listName, reqInfo.templateID).promise();
		}
	}
	catch(e)
	{
		return returnError(e);
	}
	
	return returnSuccessMessage(response, "users added to the list successfully", 201);
}

async function AnalyzeListItems(response, reqInfo)
{
	if(reqInfo.listID == null || reqInfo.templateID == null)
	{
		return IncorrectRequestMessage(response, "{listID, templateID}");
	}
	
	let listAnalysisFunction = null;
	
	switch(reqInfo.templateID)
	{
		case '1':
			listAnalysisFunction = getTodoListAnalysis;
			break;
		case '2':
			listAnalysisFunction = getShoppingListAnalysis;
			break;
		case '7':
			listAnalysisFunction = getTraveledPlacesListAnalysis;
			break;
		default:
			break;
	}
	
	if(listAnalysisFunction !== null)
	{
		let listItems = await getListItems(reqInfo.listID);
		let totalItems = listItems['Count'];
		listItems = listItems['Items'];
		
		let analysis = await listAnalysisFunction(listItems, totalItems);
		return response = {
			statusCode:200,
			body:JSON.stringify({
				analysis:analysis,
				message:"Successfully analyzed list"
			})
		};
	}
	else
	{
		returnError(response, "List template is not analyzable");
	}
	
}

/********************* UTILITIES *****************************/

function str2num(str)
{
	let num = 0;
	
	for(let i = 0; i < str.length; i++)
	{
		num *= 10; //Decimal base
		
		if(str[i] > '9' || str[i] < '0')
		{
			return -1;
		}
		
		num += atoi(str[i]);
	}
	
	return num;
}

function atoi(ch)
{
	return ch - '0';
}

/****************** response functions *******************/

function returnError(response, e)
{
		console.log(e);
		response = {
			statusCode: 500,
			body: JSON.stringify({
				message: e
			})
		};
		
		return response;
}

function IncorrectRequestMessage(response, missingProperties)
{
	let errorMessage = "Incorrect request parameter. missing one of " + missingProperties;
	response.statusCode = 400;
	response.body = JSON.stringify({error:errorMessage});
		
	return response;
}

function returnSuccessMessage(response, message, statusCode)
{
	//Send success response.
	response = {
		statusCode: statusCode,
		body: JSON.stringify({
			message: message
		})
	};
		
	return response;
}

/********************** Favorite Functions **************************/

function getNewDocumentForFavoriteCollection(doc, favoriteNum, ListID, ListName)
{
	favoriteNum.forEach((item) => {
		doc[item].List_ID = ListID;
		doc[item].List_Name = ListName;
	});
	
	return doc;
}

function deleteFavoriteFromDocumentForFavoriteCollection(doc, favoriteNum, ListID, ListName)
{
	favoriteNum.forEach((item) => {
		doc[item].List_ID = "0";
		doc[item].List_Name = "null";
	});
	
	return doc;
}

function cannotToggleFavorite(response)
{
	response = {
		statusCode:409, //409 means there is a conflict, all favorites are already filled.
		body: JSON.stringify({
			message:"User already has 4 favorites configured or list is not a favorite."
		})
	};
	
	return response;
}

function createAvailableFavoritesArray(type, userFavorites, favoritesToFind)
{
	let availableFavorite =[];
	
	if(type === 'ALTF')
	{
		//find an empty space in the favorites for the user.
		if(favoritesToFind.includes(userFavorites.Favorite_One.List_ID))
		{
			availableFavorite.push("Favorite_One");
		}
		else if(favoritesToFind.includes(userFavorites.Favorite_Two.List_ID))
		{
			availableFavorite.push("Favorite_Two");
		}
		else if(favoritesToFind.includes(userFavorites.Favorite_Three.List_ID))
		{
			availableFavorite.push("Favorite_Three");
		}
		else if(favoritesToFind.includes(userFavorites.Favorite_Four.List_ID))
		{
			availableFavorite.push("Favorite_Four");
		}
	}
	else if (type === 'DLFF')
	{
		//find the lists to remove from the favorites.
		if(favoritesToFind.includes(userFavorites.Favorite_One.List_ID))
		{
			availableFavorite.push("Favorite_One");
		}
		if(favoritesToFind.includes(userFavorites.Favorite_Two.List_ID))
		{
			availableFavorite.push("Favorite_Two");
		}
		if(favoritesToFind.includes(userFavorites.Favorite_Three.List_ID))
		{
			availableFavorite.push("Favorite_Three");
		}
		if(favoritesToFind.includes(userFavorites.Favorite_Four.List_ID))
		{
			availableFavorite.push("Favorite_Four");
		}
	}
	
	return availableFavorite;
}

/**************** Get List Items Functions **************/

async function updateParticipationLastUsedDate(participationEntry)
{
	participationEntry.Last_Opened = Date.now();
	let participationUpdateParams = {
		TableName:PARTICIPATIONCOLLECTION,
		Item:participationEntry
	};
	
	await docClient.put(participationUpdateParams).promise();
}

/************** Create List Item Functions ************/

function getFieldValue(Item)
{
	//Check for missing field values since dynamoDB won't accept empty strings.
	if(Item.fieldName === "Name" && Item.fieldValue === "")
		throw new Error();
		
	if(Item.fieldValue === "")
		return " ";
	else
		return Item.fieldValue;
}

/*********** Contact List Functions *******************/

function compareAllUsersWithContacts(appUsers, contacts)
{
	let contactsInApp = [];

	//for each contact in the users device we check if we can find it in the user collection, maybe indexing will help for faster performance.
	contacts.forEach((contact) => {
		let contactFound = false;
		
		for(let i = 0; i < appUsers.length && !contactFound; i++)
		{
			let formattedPhone = getPhoneFormat(contact.phoneNumber);
			if(formattedPhone === appUsers[i].Phone)
			{	//if the user we are checking has the same phone number it means he is registered to the app and we flag him.
				contactsInApp.push(contact);
				contactFound = true;
			}
		}
	});
	
	return contactsInApp;
}

async function getUserName(userPhone)
{
	return await docClient.query({
		TableName:USERSCOLLECTION,
		KeyConditionExpression: 'Phone = :Phone',
		 ExpressionAttributeValues: {
	    	':Phone': userPhone
	  }}).promise();
}

function getPhoneFormat(phone)
{
	if(phone.match(/0\d{2}-\d{3}-\d{4}/g)) //Israel phone formatting.
		return "+972 " + phone.substr(1);
		
	return phone;
}

/********************** List Analysis Function ************************/

async function getShoppingListAnalysis(listItems, totalItems)
{
	return {
		"1)" : getTotalItemsBought(listItems, totalItems),
		"2)" : calculateTotalSpent(listItems, totalItems)
	};
}

function getTotalItemsBought(listItems, totalItems)
{
	let itemsBought = 0;
	
	for(let i = 0; i < totalItems; i++)
	{
		if(listItems[i]['Fields']['Bought'])
			itemsBought++;
	}
	
	return "Number of items bought " + itemsBought + "/" + totalItems
}

function calculateTotalSpent(listItems, totalItems)
{
	let totalSpent = 0;
	let symbolToChangeTo = getPriceSymbol(listItems[0]['Fields']['Price']);
	
	for(let i = 0; i < totalItems; i++)
	{
		let currPrice = listItems[i]['Fields']['Price'];
		
		if(listItems[i]['Fields']['Bought'])
			{
				totalSpent += getExchagneRate(getPriceNumber(currPrice), getPriceSymbol(currPrice), symbolToChangeTo);
			}
	}
	
	return "Total money spent " + totalSpent + symbolToChangeTo;
}

function getPriceNumber(priceString)
{
	if(priceString[priceString.length - 1] > '9' || priceString[priceString.length - 1] < '0')
		priceString = priceString.slice(0, -1);
	
	return parseFloat(priceString);
}

function getPriceSymbol(priceString)
{
	if(priceString[priceString.length - 1] === '$' || 
	   priceString[priceString.length - 1] === '₪' || 
	   priceString[priceString.length - 1] === '£' ||
	   priceString[priceString.length - 1] === '€')
	   return priceString[priceString.length - 1];
    else
    	return "Price type unsupported";
}

function getExchagneRate(price, firstCurrency, secondCurrency)
{
	//let toCurrencyCode = getCurrencyCode(firstCurrency);
	let currencyRates = [[1, 3.52, 0.81, 0.9], //USD
						 [0.28, 1, 0.23, 0.26], //ILS
						 [1.23, 4.32, 1, 1.11], //GBP
						 [1.1, 3.89, 0.9, 1]]; ///EUR
						 
	if(firstCurrency === "Price type unsupported" || secondCurrency === "Price type unsupported")
	{ //incase currency is not supported just return the price itself.
		return price;
	}
						 
	
	return price * currencyRates[getCurrencyIndex(firstCurrency)][getCurrencyIndex(secondCurrency)];
}

function getCurrencyCode(symbol)
{
	switch (symbol) {
		case '$':
			return 'USD';
		case '₪':
			return 'ILS';
		case '£':
			return 'GBP';
		case '€':
			return 'EUR';
		default:
			return 'USD';
	}
}

function getCurrencyIndex(symbol)
{
	switch (symbol) {
		case '$':
			return 0;
		case '₪':
			return 1;
		case '£':
			return 2;
		case '€':
			return 3;
		default:
			return 0;
	}
}

async function getTodoListAnalysis(listItems, totalItems)
{
	return {
			"1)" : calculateDoneItems(listItems, totalItems),
			"2)" : getClosestTodo(listItems, totalItems)
		};
}

function calculateDoneItems(listItems, totalItems)
{
	let doneItems = 0;
	
	for(let i = 0; i < totalItems; i++)
	{
		if(listItems[i]['Fields']['Done'])
			doneItems++;
	}
	
	return "Items done " + doneItems + "/" + totalItems;
}

function getClosestTodo(listItems, totalItems)
{
	let closestDate = new Date(listItems[0]['Fields']['Due Date']);
	let itemIndex = 0;
	
	for(let i = 0; i < totalItems; i++)
	{
		if(new Date(listItems[i]['Fields']['Due Date']) < closestDate)
		{
			closestDate = new Date(listItems[i]['Fields']['Due Date']);
			itemIndex = i;
		}
	}
	
	return "Closest Todo Item is " + listItems[itemIndex]["Item_Name"] + " and it's due to " + closestDate.toDateString();
}

async function getTraveledPlacesListAnalysis(listItems, totalItems)
{
	return {
		"1)" : "You have traveled to " + totalItems	+ " countries out of 195",
		"2)" : getClosestTravelBuddy(listItems, totalItems)
	};
}

function getClosestTravelBuddy(listItems, totalItems)
{
	let travelBuddies = new Map();
	
	for(let i = 0; i < totalItems; i++)
	{
		let buddy = listItems[i]['Fields']['With whom'];
		
		if(travelBuddies.has(buddy))
		{
			travelBuddies.set(buddy, travelBuddies.get(buddy) + 1);
		}
		else
		{
			travelBuddies.set(buddy, 1);
		}
	}
	
	let maxTraveledBuddy = 0;
	let bestBuddy = "";
	
	for(let i = 0; i < totalItems; i++)
	{
		let buddy = listItems[i]['Fields']['With whom'];
		if(travelBuddies.get(buddy) > maxTraveledBuddy)
			{
				maxTraveledBuddy = travelBuddies.get(buddy);
				bestBuddy = buddy;
			}
	}
	
	return "You have traveled the most with " + bestBuddy + " and you traveled to " + maxTraveledBuddy + " places together";
}

async function getListItems(listID)
{
	//Set up the query to the DB to get the correct list items
	let getListItemsParams = {
		TableName:LISTITEMSCOLLECTION,
		FilterExpression : 'List_ID = :List_ID',
		ExpressionAttributeValues: {
	    	':List_ID': listID
	    	}
	};
	
	let listItems;
	//now we will query the DB and get all the list items.
	try
	{
		listItems = await docClient.scan(getListItemsParams).promise();
	}
	catch(e)
	{
		return null;
	}
	
	return listItems;
}