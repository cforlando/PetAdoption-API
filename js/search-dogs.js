var max_to_show = 60;
var breed_info;
var breed_aliases;
var pet_info;
var search_is_dirty = true;  // the rendered list doesn't match the search parameters; if in mid-render, stop processing and start over.

var pets = new Array();  // DOM elements in order of pet_info;
var search_result_indexes;  // Indexes into `pets`, ordered by relevance to search results.
var shapes = new Array();
var colors = new Array();

function display_breed_filler() {
	if (! breed_info) { return false; }

	var breed_names = Object.keys(breed_info);

	var random_choice = Math.floor(Math.random() * breed_names.length);
	var breed_name = breed_names[random_choice];

	alert("search bar not implemented. Just picking " + breed_name);
	populate_search(breed_name);
}

function populate_search(breed) {
	// TODO  update search from selection
	var canonical_breed = breed_aliases[breed];
	if (! canonical_breed) {
		canonical_breed = breed;
	}

	var input_list = document.getElementsByTagName("input");
	
	for (var i = 0; i < input_list.length; i++) {
		var input = input_list[i];
		if (input.form.id != "search") { continue; }
		if (input.type == "checkbox") { input.checked = false; continue; }
	}

	var breed = breed_info[canonical_breed];

	for (var family in breed.family) {
		var input = document.getElementById("shape" + breed.family[family].replace(" ", ""));
		input.checked = true;
	}

	var input = document.getElementById("weight");
	input.value = breed.weight;

	input = document.getElementById("energy");
	input.value = breed.activity;

	change();
	return false;
}

function change(frm) {
	if (! breed_info) return false;
	if (! pet_info) return false;

	search_is_dirty = true;

	needle = new Array();
	needle["testing"] = "fine";
	needle["sexf"] = document.getElementById("sexf").checked;
	needle["sexm"] = document.getElementById("sexm").checked;
	needle["weight"] = document.getElementById("weight").value;
	needle["energy"] = document.getElementById("energy").value;
	for (goodwith in {"kids":1, "dogs":1, "cats":1}) {
		needle["goodwith"+goodwith] = document.getElementById("goodwith"+goodwith).checked;
	}
	var colors_checked = 0;
	for (color in colors) {
		needle["color"+color] = document.getElementById("color"+color).checked;
		colors_checked += needle["color"+color] ? 1 : 0;
	}
	for (shape in shapes) {
		needle["shape"+shape.replace(" ", "")] = document.getElementById("shape"+shape.replace(" ", "")).checked;
	}
	
	scores_for_index = new Array(pet_info.length);
	for (var i = 0; i < pet_info.length; i++) {
		// closeness to searcher's desires. Getting weight right is hard.
		score = 0;
		
		if (needle["sex" + pet_info[i].sex]) { score += 50 }  // sex weights 50
		score += 164 / Math.pow((Math.max(7, Math.abs(needle["weight"] - pet_info[i]["adult_size_lbs"]))/7), 1.5);
		score += 7 / Math.max(0.1, Math.abs(needle["energy"] - pet_info[i]["temperament_active_level"]));
		for (goodwith in {"kids":1, "dogs":1, "cats":1}) {
			if (needle["goodwith"+goodwith] && pet_info[i].known_good_with.indexOf(goodwith)>=0) { score += 20; }
		}
		for (color in colors) {
			if (needle["color" + color]) {
				if (pet_info[i].colors.indexOf(color) >= 0) {
					score += 30;
				}
			}
		}

		for (shape in shapes) {
			if (needle["shape" + shape.replace(" ", "")]) {
				// searcher wants this shape
				if (pet_info[i].shape == shape) {
					// add to score for pets that match it
					score += 60;
				}
			}
		}

		score += (i / 100.0);
		scores_for_index[i] = [10000 - score, i];
	}
	
	scores_for_index.sort();

	for (var i = 0; i < max_to_show; i++) {
		search_result_indexes[i] = scores_for_index[i][1];
	}

	render();
	return false;
}

function render() {
	search_is_dirty = false;

	var ul = document.getElementById("petlist");
	while (ul.firstChild) {
		ul.removeChild(ul.firstChild);
	}

	for (var i = 0; i < max_to_show; i++) {
		if (search_is_dirty) { return false; }
		ul.appendChild(pets[search_result_indexes[i]]);
	}

	return ! search_is_dirty;
}

function post_loading_activate() {
	if (! breed_info) return false;
	if (! pet_info) return false;

	var max_weight;
	var min_weight;

	var pet_display_cells = new Array();
	search_result_indexes = new Array(pet_info.length);

	for (pet in pet_info) {
		if (! max_weight || pet_info[pet]["adult_size_lbs"] > max_weight) { max_weight = pet_info[pet]["adult_size_lbs"]; }
		if (! min_weight || pet_info[pet]["adult_size_lbs"] < min_weight) { min_weight = pet_info[pet]["adult_size_lbs"]; }

		if (pet_info[pet]["shape"]) { shapes[pet_info[pet]["shape"]] = 1; }

		for (color in pet_info[pet]["colors"]) { colors[pet_info[pet]["colors"][color]] = 1; }

		var li = document.createElement("li");
		var name = document.createElement("h3")
		var link = document.createElement("a")
		link.setAttribute("href", pet_info[pet].agency[2]);
		link.setAttribute("title", "Find out about adopting " + pet_info[pet]["name"]);
		link.appendChild(document.createTextNode(pet_info[pet]["name"]));
		name.appendChild(link)
		li.setAttribute("style", "background: url("+pet_info[pet].images_urls[0].url+") no-repeat 50% 50%");
		li.appendChild(name);

		var div = document.createElement("div");
		li.appendChild(div);
		var para;

		para = document.createElement("p");
		var link = document.createElement("a")
		link.setAttribute("href", pet_info[pet].agency[2]);
		link.setAttribute("title", "Find out about adopting " + pet_info[pet]["name"]);
		link.appendChild(document.createTextNode(pet_info[pet]["colors"].join("/") + " " + pet_info[pet]["shape"]));
		para.appendChild(link);
		div.appendChild(para);

		para = document.createElement("p");
		para.appendChild(document.createTextNode("Activity: " + (pet_info[pet]["temperament_active_level"]*10) + "/10"));
		div.appendChild(para);


		para = document.createElement("p");
		if (pet_info[pet]["current_age_years"] < 0.3) {
			para.appendChild(document.createTextNode("Age: " + Math.round(pet_info[pet]["current_age_years"]*52) + " weeks"));
		} else if (pet_info[pet]["current_age_years"] < 2) {
			para.appendChild(document.createTextNode("Age: " + Math.round(pet_info[pet]["current_age_years"]*12) + " months"));
		} else {
			para.appendChild(document.createTextNode("Age: " + Math.round(pet_info[pet]["current_age_years"]) + " years"));
		}
		div.appendChild(para);


		para = document.createElement("p");
		if (pet_info[pet]["current_age_years"] < 2) {
			para.appendChild(document.createTextNode("Expected adult weight: " + Math.round(pet_info[pet]["adult_size_lbs"]) + "lbs"));
		} else {
			para.appendChild(document.createTextNode("Weight: " + Math.round(pet_info[pet]["adult_size_lbs"]) + " lbs"));
		}
		div.appendChild(para);

		if (pet_info[pet]["known_good_with"].length > 0) {
			var p = document.createElement("p");
			p.appendChild(document.createTextNode("Known good with "));
			for (i in pet_info[pet]["known_good_with"]) {
				p.appendChild(document.createTextNode(pet_info[pet]["known_good_with"][i]));

				if (i < pet_info[pet]["known_good_with"].length-2) {
					p.appendChild(document.createTextNode(", "));
				} else if (i == pet_info[pet]["known_good_with"].length-2) {
					if (pet_info[pet]["known_good_with"].length != 2) {
						p.appendChild(document.createTextNode(","));
					}
					p.appendChild(document.createTextNode(" & "));
				}
			}
			div.appendChild(p);
		}

		pets.push(li);
		search_result_indexes[pet] = pet; // int index

	}

	var weightlabel = document.getElementById("weightfield");

	var weightslider = document.createElement("input");
	weightslider.setAttribute("id", "weight");
	weightslider.setAttribute("type", "range");
	weightslider.setAttribute("step", "5");
	weightslider.setAttribute("style", "width: auto;");
	weightslider.setAttribute("defaultValue", 0); //Math.round((min_weight+max_weight)/10)*5);
	weightslider.setAttribute("min", min_weight);
	weightslider.setAttribute("max", max_weight);

	//var weightsliderindicator = document.createElement("span");
	//weightsliderindicator.setAttribute("id", "weightsliderindicator");
	//weightsliderindicator.setAttribute("class", "valueindicator");
	//weightsliderindicator.appendChild(document.createTextNode("(any)"));

	//weightlabel.appendChild(weightsliderindicator);
	weightlabel.appendChild(weightslider);

	//weightslider.addEventListener("onchange", (function() { weightsliderindicator.contents = this.value; return true; })());

	var shapesfields = document.getElementById("shapesfields");
	shapes.sort();
	for (shape in shapes) {
		var shapelabel = document.createElement("label");
		var shapecheckbox = document.createElement("input");
		shapecheckbox.setAttribute("id", "shape"+shape.replace(" ", ""));
		shapecheckbox.setAttribute("type", "checkbox");
		shapelabel.appendChild(shapecheckbox);
		shapelabel.appendChild(document.createTextNode(shape));
		shapesfields.appendChild(shapelabel);
		shapesfields.appendChild(document.createTextNode(" "));
	}

	var colorsfields = document.getElementById("colorsfields");
	colors.sort();
	for (color in colors) {
		var colorlabel = document.createElement("label");
		var colorcheckbox = document.createElement("input");
		colorcheckbox.setAttribute("id", "color"+color.replace(" ", ""));
		colorcheckbox.setAttribute("type", "checkbox");
		colorlabel.appendChild(colorcheckbox);
		colorlabel.appendChild(document.createTextNode(color));
		colorsfields.appendChild(colorlabel);
		colorsfields.appendChild(document.createTextNode(" "));
	}

	change();
}

function load_breeds() {
	var b = JSON.parse(breedsxmlhr.responseText);
	breed_info = b["breed_shorthands"];
	breed_aliases = b["breed_aliases"];
	return post_loading_activate();
}

function load_petinfo() {
	var p = JSON.parse(petinfoxmlhr.responseText);
	pet_info = p["animals"];
	return post_loading_activate();
}

var breedsxmlhr = new XMLHttpRequest();
breedsxmlhr.onload = load_breeds;
breedsxmlhr.open("get", "dog_breed_data.json", true);
breedsxmlhr.send();

var petinfoxmlhr = new XMLHttpRequest();
petinfoxmlhr.onload = load_petinfo;
petinfoxmlhr.open("get", "ephemoral_test_data.json", true);
petinfoxmlhr.send();
