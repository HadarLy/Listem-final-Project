module.exports = {
	contactsList: [],
	parseContacts: parseContacts,
	markUsersWhoUseApp: markUsersWhoUseApp,
	loaded:false
};

function parseContacts(contacts)
{
	let parsedContacts = [];

	for(let i = 0; i < contacts.length; i++)
	{
		if(contacts[i].phoneNumbers[0] !== undefined) {
			let contact = new Contact();
			contact.name = contacts[i].familyName ?
				contacts[i].givenName + " " + contacts[i].familyName
				: contacts[i].givenName;
			contact.phoneNumber = contacts[i].phoneNumbers[0].number;
			contact.usesApp = false;
			parsedContacts.push(contact);
		}
	}

	return parsedContacts;
}

function markUsersWhoUseApp(contactList, userWhoUseApp)
{
	let contacts = [];

	for(let i = 0; i < userWhoUseApp.users.length; i++)
	{
		let contactFound = false;
		for(let j = 0; j < contactList.length && !contactFound; j++)
		{
			if(contactList[j].phoneNumber === userWhoUseApp.users[i].phoneNumber)
			{
				contactList[j].usesApp = true;
				contactFound = true;
				contacts.push(contactList[j]);
			}
		}
	}

	return contacts;
}

function Contact(firstName, lastName, phoneNumber, usesApp, name)
{
	/*this.firstName = firstName;
	this.lastName = lastName;*/
	this.name = name;
	this.phoneNumber = phoneNumber;
	this.usesApp = usesApp;
}