use cwa_db;

CREATE TABLE `Dog` (
  `DogID` INT AUTO_INCREMENT,
  `CWANumber` VARCHAR(10) UNIQUE NOT NULL,
  `AKCNumber` VARCHAR(10),
  `CKCNumber` VARCHAR(10),
  `ForeignNumber` VARCHAR(50),
  `ForeignType` VARCHAR(50),
  `CallName` VARCHAR(50),
  `RegisteredName` VARCHAR(100) NOT NULL,
  `Birthdate` DATE NOT NULL,
  `PedigreeLink` VARCHAR(500),
  `Status` VARCHAR(10) NOT NULL,
  `Average` CHAR(3),
  `CurrentGrade` VARCHAR(3) NOT NULL,
  `MeetPoints` DECIMAL(5,2),
  `ARXPoints` DECIMAL(5,2),
  `NARXPoints` DECIMAL(5,2),
  `ShowPoints` SMALLINT,
  `DPCLegs` SMALLINT,
  `MeetWins` DECIMAL(5,2),
  `MeetAppearences` DECIMAL(5,2),
  `HighCombinedWins` DECIMAL(5,2),
  `Notes` VARCHAR(250),
  `LastEditedBy` VARCHAR(20),
  `LastEditedAt` TIMESTAMP,
  PRIMARY KEY (`DogID`),
  KEY `idx_Dog_CWANumber` (`CWANumber`)
);

CREATE TABLE `TitleType` (
  `TitleTypeID` INT AUTO_INCREMENT,
  `Title` VARCHAR(10) UNIQUE NOT NULL,
  `TitleDescription` VARCHAR(200) NOT NULL,
  `LastEditedBy` VARCHAR(20),
  `LastEditedAt` TIMESTAMP,
  PRIMARY KEY (`TitleTypeID`),
  KEY `idx_TitleType_Title` (`Title`)
);

CREATE TABLE `UserRole` (
  `RoleID` INT AUTO_INCREMENT PRIMARY KEY,
  `Title` VARCHAR(20) NOT NULL UNIQUE,
  `CanEditDog`           TINYINT(1) NOT NULL DEFAULT 0,
  `CanEditPerson`        TINYINT(1) NOT NULL DEFAULT 0,
  `CanEditDogOwner`      TINYINT(1) NOT NULL DEFAULT 0,
  `CanEditOfficerRole`   TINYINT(1) NOT NULL DEFAULT 0,
  `CanEditUserRole`      TINYINT(1) NOT NULL DEFAULT 0,
  `CanEditClub`          TINYINT(1) NOT NULL DEFAULT 0,
  `CanEditMeet`          TINYINT(1) NOT NULL DEFAULT 0,
  `CanEditMeetResults`   TINYINT(1) NOT NULL DEFAULT 0,
  `CanEditRaceResults`   TINYINT(1) NOT NULL DEFAULT 0,
  `CanEditDogTitles`     TINYINT(1) NOT NULL DEFAULT 0,
  `CanEditNews`          TINYINT(1) NOT NULL DEFAULT 0,
  `LastEditedBy` VARCHAR(20),
  `LastEditedAt` TIMESTAMP,
  KEY `idx_UserRole_Title` (`Title`)
);

CREATE TABLE `NewsletterSubscription` (
  `SubscriptionID` INT AUTO_INCREMENT PRIMARY KEY,
  `EmailAddress` VARCHAR(50) NOT NULL,
  `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
  `SubscribedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UnsubscribedAt` TIMESTAMP NULL,
  `LastEditedBy` VARCHAR(20),
  `LastEditedAt` TIMESTAMP,
  UNIQUE KEY `uq_NewsletterSubscription_EmailAddress` (`EmailAddress`)
);

CREATE TABLE `News` (
  `NewsID` INT PRIMARY KEY AUTO_INCREMENT,
  `Title` VARCHAR(100) NOT NULL,
  `Content` TEXT NOT NULL,
  `CreatedAt` TIMESTAMP NOT NULL,
  `UpdatedAt` TIMESTAMP,
  `AuthorID` VARCHAR(20),
  `LastEditedBy` VARCHAR(20),
  `LastEditedAt` TIMESTAMP
);

CREATE TABLE `DogTitles` (
  `DogTitleID` INT AUTO_INCREMENT,
  `CWANumber` VARCHAR(10) NOT NULL,
  `Title` VARCHAR(10) NOT NULL,
  `TitleNumber` VARCHAR(10) NOT NULL,
  `TitleDate` DATE,
  `NamePrefix` CHAR(1) NOT NULL,
  `NameSuffix` CHAR(1) NOT NULL,
  `LastEditedBy` VARCHAR(20),
  `LastEditedAt` TIMESTAMP,
  PRIMARY KEY (`DogTitleID`),
  UNIQUE KEY `uq_DogTitles_CWANumber_Title` (`CWANumber`, `Title`)
);

CREATE TABLE `Person` (
  `PersonID` INT AUTO_INCREMENT,
  `UserName` VARCHAR(20) UNIQUE NOT NULL,
  `FirstName` VARCHAR(50) NOT NULL,
  `LastName` VARCHAR(50) NOT NULL,
  `EmailAddress` VARCHAR(50),
  `AddressLineOne` VARCHAR(50),
  `AddressLineTwo` VARCHAR(50),
  `City` VARCHAR(50),
  `StateProvince` VARCHAR(50),
  `ZipCode` VARCHAR(10),
  `Country` VARCHAR(6),
  `PrimaryPhone` VARCHAR(10),
  `SecondaryPhone` VARCHAR(10),
  `SystemRole` VARCHAR(20) NOT NULL,   
  `PasswordHash` VARCHAR(255) NOT NULL,
  `Notes` VARCHAR(250),
  `LastEditedBy` VARCHAR(20),
  `LastEditedAt` TIMESTAMP,
  PRIMARY KEY (`PersonAutoID`),
  KEY `idx_Person_PersonID` (`PersonID`)
);

CREATE TABLE `OfficerRole` (
  `OfficerRoleID` INT AUTO_INCREMENT,
  `RoleName` VARCHAR(50) UNIQUE NOT NULL,
  `PersonID` VARCHAR(20) NOT NULL,
  `DisplayOrder` INT NOT NULL,
  `Active` BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (`OfficerRoleID`),
  KEY `idx_OfficerRole_RoleName` (`RoleName`)
);

CREATE TABLE `DogOwner` (
  `DogOwnerID` INT AUTO_INCREMENT,
  `CWAID` VARCHAR(10) NOT NULL,
  `PersonID` VARCHAR(20) NOT NULL,
  `LastEditedBy` VARCHAR(20),
  `LastEditedAt` TIMESTAMP,
  PRIMARY KEY (`DogOwnerID`),
  UNIQUE KEY `uq_DogOwner_CWAID_PersonID` (`CWAID`, `PersonID`)
);

CREATE TABLE `Club` (
  `ClubID` INT AUTO_INCREMENT,
  `ClubAbbreviation` VARCHAR(20) UNIQUE NOT NULL,
  `ClubName` VARCHAR(100) NOT NULL,
  `ClubStatus` VARCHAR(8) NOT NULL,
  `BeginDate` DATE,
  `EndDate` DATE,
  `BoardMember1` VARCHAR(20),
  `BoardMember2` VARCHAR(20),
  `DefaultRaceSecretary` VARCHAR(20),
  `Notes` VARCHAR(250),
  `LastEditedBy` VARCHAR(20),
  `LastEditedAt` TIMESTAMP,
  PRIMARY KEY (`ClubID`),
  KEY `idx_Club_ClubAbbreviation` (`ClubAbbreviation`)
);

CREATE TABLE `Meet` (
  `MeetAutoID` INT AUTO_INCREMENT,
  `MeetNumber` VARCHAR(20) UNIQUE NOT NULL,
  `ClubAbbreviation` VARCHAR(10) NOT NULL,
  `MeetDate` DATE NOT NULL,
  `RaceSecretary` VARCHAR(20),
  `Judge` VARCHAR(20),
  `Location` VARCHAR(20) NOT NULL,
  `Yards` INT NOT NULL,
  `LastEditedBy` VARCHAR(20),
  `LastEditedAt` TIMESTAMP,
  PRIMARY KEY (`MeetAutoID`),
  KEY `idx_Meet_MeetNumber` (`MeetNumber`),
  KEY `idx_Meet_MeetNumber_ClubAbbreviation` (`MeetNumber`, `ClubAbbreviation`)
);

CREATE TABLE `RaceResults` (
  `RaceResultID` INT AUTO_INCREMENT,
  `MeetNumber` VARCHAR(20) NOT NULL,
  `CWANumber` VARCHAR(10) NOT NULL,
  `Program` VARCHAR(1) NOT NULL,
  `RaceNumber` VARCHAR(10) NOT NULL,
  `EntryType` VARCHAR(5),
  `Box` INT NOT NULL,
  `Placement` INT NOT NULL,
  `MeetPoints` DECIMAL(3,2) NOT NULL,
  `Incident` VARCHAR(5),
  `LastEditedBy` VARCHAR(20),
  `LastEditedAt` TIMESTAMP,
  PRIMARY KEY (`RaceResultID`),
  UNIQUE KEY `uq_RaceResults_MeetNumber_CWANumber_Program_RaceNumber` (`MeetNumber`, `CWANumber`, `Program`, `RaceNumber`)
);

CREATE TABLE `MeetResults` (
  `MeetResultID` INT AUTO_INCREMENT,
  `MeetNumber` VARCHAR(20) NOT NULL,
  `CWANumber` VARCHAR(10) NOT NULL,
  `Average` DECIMAL(3,2) NOT NULL,
  `Grade` VARCHAR(3) NOT NULL,
  `MeetPlacement` INT NOT NULL,
  `MeetPoints` DECIMAL(5,2) NOT NULL,
  `ARXEarned` DECIMAL(5,2) NOT NULL,
  `NARXEarned` DECIMAL(5,2) NOT NULL,
  `Shown` CHAR(1) NOT NULL,
  `ShowPlacement` INT,
  `ShowPoints` INT,
  `DPCLeg` CHAR(1),
  `HCScore` INT,
  `HCLegEarned` CHAR(1),
  `LastEditedBy` VARCHAR(20),
  `LastEditedAt` TIMESTAMP,
  PRIMARY KEY (`MeetResultID`),
  UNIQUE KEY `uq_MeetResults_MeetNumber_CWANumber` (`MeetNumber`, `CWANumber`)
);

CREATE TABLE `ChangeLog` (
  `LogID` INT PRIMARY KEY AUTO_INCREMENT,
  `ChangedTable` VARCHAR(50) NOT NULL,
  `RecordPK` VARCHAR(50) NOT NULL,
  `Operation` VARCHAR(10) NOT NULL,
  `ChangedBy` VARCHAR(20),
  `ChangedAt` TIMESTAMP NOT NULL,
  `Source` VARCHAR(32),
  `BeforeData` TEXT,
  `AfterData` TEXT
);

CREATE TABLE `SchemaMigrations` (
  `MigrationID` INT AUTO_INCREMENT,
  `Version` VARCHAR(50) UNIQUE NOT NULL,
  `AppliedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MigrationID`),
  KEY `idx_SchemaMigrations_Version` (`Version`)
);

-- Foreign Keys
ALTER TABLE `DogTitles` 
  ADD CONSTRAINT fk_DogTitles_Dog
  FOREIGN KEY (`CWANumber`) REFERENCES `Dog` (`CWANumber`);

ALTER TABLE `DogTitles`
  ADD CONSTRAINT fk_DogTitles_TitleType
  FOREIGN KEY (`Title`) REFERENCES `TitleType` (`Title`);

ALTER TABLE `DogOwner`
  ADD CONSTRAINT fk_DogOwner_Dog
  FOREIGN KEY (`CWAID`) REFERENCES `Dog` (`CWANumber`);

ALTER TABLE `DogOwner`
  ADD CONSTRAINT fk_DogOwner_Person
  FOREIGN KEY (`PersonID`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Club`
  ADD CONSTRAINT fk_Club_BoardMember1
  FOREIGN KEY (`BoardMember1`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Club`
  ADD CONSTRAINT fk_Club_BoardMember2
  FOREIGN KEY (`BoardMember2`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Club`
  ADD CONSTRAINT fk_Club_DefaultRaceSecretary
  FOREIGN KEY (`DefaultRaceSecretary`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Meet`
  ADD CONSTRAINT fk_Meet_Club
  FOREIGN KEY (`ClubAbbreviation`) REFERENCES `Club` (`ClubAbbreviation`);

ALTER TABLE `Meet`
  ADD CONSTRAINT fk_Meet_RaceSecretary
  FOREIGN KEY (`RaceSecretary`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Meet`
  ADD CONSTRAINT fk_Meet_Judge
  FOREIGN KEY (`Judge`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `RaceResults`
  ADD CONSTRAINT fk_RaceResults_Meet
  FOREIGN KEY (`MeetNumber`) REFERENCES `Meet` (`MeetNumber`);

ALTER TABLE `RaceResults`
  ADD CONSTRAINT fk_RaceResults_Dog
  FOREIGN KEY (`CWANumber`) REFERENCES `Dog` (`CWANumber`);

ALTER TABLE `MeetResults`
  ADD CONSTRAINT fk_MeetResults_Meet
  FOREIGN KEY (`MeetNumber`) REFERENCES `Meet` (`MeetNumber`);

ALTER TABLE `MeetResults`
  ADD CONSTRAINT fk_MeetResults_Dog
  FOREIGN KEY (`CWANumber`) REFERENCES `Dog` (`CWANumber`);

ALTER TABLE `News`
  ADD CONSTRAINT fk_News_Author
  FOREIGN KEY (`AuthorID`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Person`
  ADD CONSTRAINT fk_Person_SystemRole
  FOREIGN KEY (`SystemRole`) REFERENCES `UserRole` (`Title`);

ALTER TABLE `ChangeLog`
  ADD CONSTRAINT fk_ChangeLog_ChangedBy
  FOREIGN KEY (`ChangedBy`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `OfficerRole`
  ADD CONSTRAINT fk_OfficerRole_Person
  FOREIGN KEY (`PersonID`) REFERENCES `Person` (`PersonID`);