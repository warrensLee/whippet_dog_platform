USE cwa_db;

CREATE TABLE `Dog` (
  `CWANumber` varchar(10) PRIMARY KEY NOT NULL,
  `AKCNumber` varchar(10),
  `CKCNumber` varchar(10),
  `ForeignNumber` varchar(50),
  `ForeignType` varchar(50),
  `CallName` varchar(50),
  `RegisteredName` varchar(100) NOT NULL,
  `Birthdate` date NOT NULL,
  `PedigreeLink` varchar(500),
  `Status` varchar(10) NOT NULL,
  `Average` char(3),
  `CurrentGrade` varchar(3) NOT NULL,
  `MeetPoints` decimal(5,2),
  `ARXPoints` decimal(5,2),
  `NARXPoints` decimal(5,2),
  `ShowPoints` smallint,
  `DPCLegs` smallint,
  `MeetWins` decimal(5,2),
  `Notes` varchar(250)
);

CREATE TABLE `DogTitles` (
  `CWANumber` varchar(10) NOT NULL,
  `Title` varchar(10) NOT NULL,
  `TitleNumber` varchar(10) NOT NULL,
  `TitleDate` date,
  `NamePrefix` char(1) NOT NULL,
  `NameSuffix` char(1) NOT NULL,
  PRIMARY KEY (`CWANumber`, `Title`)
);

CREATE TABLE `TitleType` (
  `Title` varchar(10) PRIMARY KEY NOT NULL,
  `TitleDescription` varchar(200) NOT NULL
);

CREATE TABLE `DogOwner` (
  `CWAID` varchar(10) NOT NULL,
  `PersonID` varchar(20) NOT NULL,
  PRIMARY KEY (`CWAID`, `PersonID`)
);

CREATE TABLE `Person` (
  `PersonID` varchar(20) PRIMARY KEY NOT NULL,
  `FirstName` varchar(50) NOT NULL,
  `LastName` varchar(50) NOT NULL,
  `EmailAddress` varchar(50),
  `AddressLineOne` varchar(50),
  `AddressLineTwo` varchar(50),
  `City` varchar(50),
  `StateProvince` varchar(50),
  `ZipCode` varchar(10),
  `Country` varchar(6),
  `PrimaryPhone` varchar(10),
  `SecondaryPhone` varchar(10),
  `SystemRole` varchar(10) NOT NULL,
  `Notes` varchar(250)
);

CREATE TABLE `Club` (
  `ClubAbbreviation` varchar(20) PRIMARY KEY NOT NULL,
  `ClubName` varchar(50) NOT NULL,
  `ClubStatus` varchar(8) NOT NULL,
  `BeginDate` date,
  `EndDate` date,
  `BoardMember1` varchar(20),
  `BoardMember2` varchar(20),
  `DefaultRaceSecretary` varchar(20),
  `Notes` varchar(250)
);

CREATE TABLE `Meet` (
  `MeetNumber` varchar(20) NOT NULL,
  `ClubAbbreviation` varchar(10) NOT NULL,
  `MeetDate` date NOT NULL,
  `RaceSecretary` varchar(20),
  `Judge` varchar(20),
  `Location` varchar(20) NOT NULL,
  `Yards` int(3) NOT NULL,
  PRIMARY KEY (`MeetNumber`, `ClubAbbreviation`)
);

CREATE TABLE `RaceResults` (
  `MeetNumber` varchar(20) NOT NULL,
  `CWANumber` varchar(10) NOT NULL,
  `Program` varchar(1) NOT NULL,
  `RaceNumber` varchar(10) NOT NULL,
  `EntryType` varchar(5),
  `Box` int(1) NOT NULL,
  `Placement` int(1) NOT NULL,
  `MeetPoints` decimal(3,2) NOT NULL,
  `Incident` varchar(5),
  PRIMARY KEY (`MeetNumber`, `CWANumber`, `Program`, `RaceNumber`)
);

CREATE TABLE `MeetResults` (
  `MeetNumber` varchar(20) NOT NULL,
  `CWANumber` varchar(10) NOT NULL,
  `Average` decimal(3,2) NOT NULL,
  `Grade` varchar(3) NOT NULL,
  `MeetPlacement` int(2) NOT NULL,
  `MeetPoints` decimal(5,2) NOT NULL,
  `ARXEarned` decimal(5,2) NOT NULL,
  `NARXEarned` decimal(5,2) NOT NULL,
  `Shown` char(1) NOT NULL,
  `ShowPlacement` int(2),
  `ShowPoints` int(1),
  `DPCLeg` char(1),
  `HCScore` int(3),
  `HCLegEarned` char(1),
  PRIMARY KEY (`MeetNumber`, `CWANumber`)
);

ALTER TABLE `DogTitles` ADD FOREIGN KEY (`CWANumber`) REFERENCES `Dog` (`CWANumber`);

ALTER TABLE `DogTitles` ADD FOREIGN KEY (`Title`) REFERENCES `TitleType` (`Title`);

ALTER TABLE `DogOwner` ADD FOREIGN KEY (`CWAID`) REFERENCES `Dog` (`CWANumber`);

ALTER TABLE `DogOwner` ADD FOREIGN KEY (`PersonID`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Club` ADD FOREIGN KEY (`BoardMember1`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Club` ADD FOREIGN KEY (`BoardMember2`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Club` ADD FOREIGN KEY (`DefaultRaceSecretary`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Meet` ADD FOREIGN KEY (`ClubAbbreviation`) REFERENCES `Club` (`ClubAbbreviation`);

ALTER TABLE `Meet` ADD FOREIGN KEY (`RaceSecretary`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Meet` ADD FOREIGN KEY (`Judge`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `RaceResults` ADD FOREIGN KEY (`MeetNumber`) REFERENCES `Meet` (`MeetNumber`);

ALTER TABLE `RaceResults` ADD FOREIGN KEY (`CWANumber`) REFERENCES `Dog` (`CWANumber`);

ALTER TABLE `MeetResults` ADD FOREIGN KEY (`MeetNumber`) REFERENCES `Meet` (`MeetNumber`);

ALTER TABLE `MeetResults` ADD FOREIGN KEY (`CWANumber`) REFERENCES `Dog` (`CWANumber`);
