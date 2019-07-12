// Initialize your app
var drugMonitor = new Framework7({
	init: false, // Disable automatic initialization to allow for initial callback
	fastClicksDistanceThreshold: 50
});

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = drugMonitor.addView('.view-main', {
	// Because we use fixed-through navbar we can enable dynamic navbar
	dynamicNavbar: true,
 
      // Hide and show indicator during ajax requests
      onAjaxStart: function (xhr) {
          drugMonitor.showIndicator();
      },
      onAjaxComplete: function (xhr) {
          drugMonitor.hideIndicator();
      }
});

if (!window.navigator.standalone) {
	$$(".top-tip").show();
}

var formFields = [ "incident-date", 
			 "incident-time", 
			 "incident-number", 
			 "incident-name",
			 "methoxyflurane-dose",
			 "morphine-dose",
			 "morphine-discard",
			 "fentanyl-dose",
			 "fentanyl-discard",
			 "midazolam-dose",
			 "midazolam-discard",
			 "ketamine-dose",
			 "ketamine-discard",
			 "propofol-dose",
			 "propofol-discard" ]

var drugs = [ "methoxyflurane",
		  "morphine",
		  "fentanyl",
 		  "midazolam",
		  "ketamine",
		  "propofol" ]

var numberOfIncidents = 0;
var incidentPrefix = "appulance.drugMonitor.";
var currentIncident;

drugMonitor.onPageInit('home', function (page) {
	$$(".incidents").hide();
	
	loadIncidents();
	refreshClickEvents();
	
	$$('#delete-all').on('click', function(){
		for (var key in localStorage) {
			if (key.indexOf(incidentPrefix) != -1) {
				localStorage.removeItem(key);
				numberOfIncidents--;
			}
		}
		
		incidentList.deleteAllItems();
		
		if (!numberOfIncidents) {
			$$(".incidents").hide();
			$$(".getting-started").show();
		}
		
		for (var v in drugs) {
			// v = iterator
			// e = current entity
			var e = drugs[v];
			var d = e + "-final";
		
			$$("." + d).children().remove();
		}
		
		refreshClickEvents();
	}); 
	
	$$('#do-finalise').on('click', function(){
		prepareToFinalise();
		drugMonitor.popup('.finalise');
	}); 

	$$('#new-incident').on('click', function () {
		drugMonitor.popup('.create-incident');
        
        $$(".dose-input").each(
            function(event) { 
                drugMonitor.keypad({ 
                    input: this,
                    value: "",
                });
            }
        );
	});
	
	$$('#reload-app').on('click', function () {
		location.reload(true);
	});
	
	$$('#delete-incident').on('click', function () {
		localStorage.removeItem(currentIncident);
		$$("li[data-incident-number=\"" + currentIncident + "\"]").remove();
		drugMonitor.closeModal();
		numberOfIncidents--;
		refreshClickEvents();
	});
	
	$$('#save-incident').on('click', function () {
		var formData = drugMonitor.formToJSON('#incident-details');
		var encondedFormData = JSON.stringify(formData);
		var incidentNumber = formData["incident-number"];
		
		addJSONToList(incidentList, encondedFormData);
		localStorage.setItem(incidentPrefix + incidentNumber, encondedFormData);
		drugMonitor.closeModal();
		document.getElementById("incident-details").reset();
		refreshClickEvents();
	});                  
});


var incidentList = drugMonitor.virtualList('#incident-list', {
	items: [

	],
	template: 
		'<li class="item-content incident" data-incident-number="' + incidentPrefix + '{{incident}}">' +
			'<div class="item-inner">' +
				'<div class="item-title-row">' +
					'<div class="item-title">{{name}}</div>' +
					'<div class="item-after">{{incident}}</div>' +
				'</div>' +
				'<div class="item-subtitle">{{date}} @ {{time}}</div>' +
			'</div>' +
		'</li>'
}); 

function refreshClickEvents() {
	$$('.swipeout').on('deleted', function () {
		var thisIncident = $$(this).attr("data-incident-number");
		localStorage.removeItem(thisIncident);
		
		numberOfIncidents--;
		if (!numberOfIncidents) {
			console.log("no more incidents...");
			$$(".incidents").hide();
			$$(".getting-started").show();
		}
	});
	
	$$('.incident').on('click', function () {
		var thisIncident = $$(this).attr("data-incident-number");
		currentIncident = thisIncident;
		prepareIncidentDetails(thisIncident);
		drugMonitor.popup('.incident-detail');
	});
	
	if (numberOfIncidents) {
		$$(".incidents").show();
		$$(".getting-started").hide();
	} else {
		$$(".incidents").hide();
		$$(".getting-started").show();
	}
}

function addJSONToList(list, obj) {
	j = JSON.parse(obj);
	
	list.appendItem({
		incident: j["incident-number"],
		name: j["incident-name"],
		date: j["incident-date"],
		time: j["incident-time"]
	});
	
	numberOfIncidents++;
}

function loadIncidents() {
	for (var key in localStorage) {
		if (key.indexOf(incidentPrefix) != -1) {
			var incidentJSON = localStorage.getItem(key);
			addJSONToList(incidentList, incidentJSON);
		}
	}
}

////////////////////////////////////////////////
// functions for loading incident details
////////////////////////////////////////////////

function isValueZero(json, col) {
	var val = json[col];
	
	if (!val) {
		return true;
	} else if (val == 0) {
		return true;
	} else if (val == "nil") {
		return true;
	} else if (val == null) {
		return true;
	} else {
		return false;
	}
}


function prepareIncidentDetails(i) {
	encodedJSON = localStorage.getItem(i);
	j = JSON.parse(encodedJSON); // turn json string into object
	
	for (var v in formFields) {
		// v = iterator
		// e = current entity
		var e = formFields[v];
		$$("#" + e).val(j[e]);
	}
	
	for (var v in drugs) {
		// v = iterator
		// e = current entity
		var e = drugs[v];
		var d = e + "-dose";
		
		$$("." + e).show();
		
		if (isValueZero(j, d)) {
			$$("." + e).hide()
		}
	}
}

var finalisedList = [];

var finaliseListBefore = '<div class="content-block-inner"><code>';
var finaliseListSep = ' &nbsp;&nbsp;&nbsp; '
var finaliseListAfter = '</code></div>';

function prepareToFinalise() {	
	for (var v in drugs) {
		// v = iterator
		// e = current entity
		var e = drugs[v];
		var d = e + "-final";
	
		$$("." + d).children().remove();
	}
	
	for (var key in localStorage) {
		if (key.indexOf(incidentPrefix) != -1) {
			var incidentJSON = localStorage.getItem(key);
			finaliseIncident(incidentJSON);
		}
	}
}

function finaliseIncident(i) {
	j = JSON.parse(i); // turn json string into object
	
	for (var v in drugs) {
		// v = iterator
		// e = current entity
		var e = drugs[v];
		var d = e + "-dose";
		var f = e + "-discard";
		
		if (j[f] == undefined) j[f] = 0;
		
		if (!isValueZero(j, d)) {
			$$("." + e + "-final").show();
			string = j["incident-date"] + finaliseListSep + j["incident-time"] + finaliseListSep + j["incident-name"] + finaliseListSep + j["incident-number"] + finaliseListSep + j[d] + finaliseListSep + j[f];
			pushToFinalise(e, string);
		}
	}
}

function pushToFinalise(drug, string) {
	$$("#" + drug + "-finalised").append(finaliseListBefore + string + finaliseListAfter);
}

drugMonitor.init();
drugMonitor.initPlugins();