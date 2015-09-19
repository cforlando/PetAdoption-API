-- Michael duPont - Code for Orlando
-- Pet Adoption Database - animalDBBuilder.sql
-- Builds the database, tables, and links for the animal database
-- Designed for MSSQL

CREATE DATABASE PetAdoptionAnimals;
CREATE TABLE Animals
(
	id int IDENTITY(1,1) PRIMARY KEY,
	personality varchar(511),
	med_needs varchar(511),
	name varchar(255),
	species varchar(255),
	breed varchar(255),
	color varchar(255),
	found_zip varchar(64),
	found_lat varchar(64),
	found_lon varchar(64),
	sex char(1), -- M/F/U
	age int, -- Can split out into human and dog
	activity_lvl int, -- 1 - 10 scale
	max_lb float,
	fixed bit, -- bit can be 1, 0, or null effectively making it a boolean
	housebroken bit,
	declawed bit,
	microchip bit,
	can_adopt bit,
	goodwith_kids bit,
	goodwith_dogs bit,
	goodwith_cats bit,
	goodwith_other bit,
	lost smalldatetime,
	intake smalldatetime,
	adoptable smalldatetime
);

CREATE TABLE Photos
(
	id int IDENTITY(1,1) PRIMARY KEY,
	photo_link varchar(255),
	caption varchar(511)
);
ALTER TABLE Photos ADD CONSTRAINT fk_animal_id FOREIGN KEY (animal_id) references Animals(id);


CREATE TABLE Contacts
(
	id int IDENTITY(1,1) PRIMARY KEY,
	name varchar(255),
	phone varchar(255),
	email varchar(255)
);
ALTER TABLE Contacts ADD CONSTRAINT fk_animal_id FOREIGN KEY (animal_id) references Animals(id);


CREATE TABLE Links
(
	id int IDENTITY(1,1) PRIMARY KEY,
	source_name varchar(255),
	url varchar(255)
);
ALTER TABLE Links ADD CONSTRAINT fk_animal_id FOREIGN KEY (animal_id) references Animals(id);