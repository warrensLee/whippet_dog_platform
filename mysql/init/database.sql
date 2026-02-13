USE cwa_db;

-- =========================
-- TABLES
-- =========================

CREATE TABLE `Dog` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `CWANumber` VARCHAR(10) NOT NULL UNIQUE,
    `AKCNumber` VARCHAR(10),
    `CKCNumber` VARCHAR(10),
    `ForeignNumber` VARCHAR(50),
    `ForeignType` VARCHAR(50),
    `CallName` VARCHAR(50),
    `RegisteredName` VARCHAR(100) NOT NULL,
    `Birthdate` DATE NOT NULL,
    `PedigreeLink` VARCHAR(500),
    `Status` VARCHAR(10) NOT NULL,
    `Average` DECIMAL(5,2),
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
    `LastEditedAt` TIMESTAMP
);

CREATE TABLE `TitleType` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `Title` VARCHAR(10) NOT NULL UNIQUE,
    `TitleDescription` VARCHAR(200) NOT NULL,
    `LastEditedBy` VARCHAR(20),
    `LastEditedAt` TIMESTAMP
);

CREATE TABLE `UserRole` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `Title` VARCHAR(20) NOT NULL UNIQUE,
    `EditDogScope` TINYINT NOT NULL DEFAULT 0,
    `EditPersonScope` TINYINT NOT NULL DEFAULT 0,
    `EditDogOwnerScope` TINYINT NOT NULL DEFAULT 0,
    `EditOfficerRoleScope` TINYINT NOT NULL DEFAULT 0,
    `EditUserRoleScope` TINYINT NOT NULL DEFAULT 0,
    `EditClubScope` TINYINT NOT NULL DEFAULT 0,
    `EditMeetScope` TINYINT NOT NULL DEFAULT 0,
    `EditMeetResultsScope` TINYINT NOT NULL DEFAULT 0,
    `EditRaceResultsScope` TINYINT NOT NULL DEFAULT 0,
    `EditDogTitlesScope` TINYINT NOT NULL DEFAULT 0,
    `EditTitleTypeScope` TINYINT NOT NULL DEFAULT 0,
    `EditNewsScope` TINYINT NOT NULL DEFAULT 0,
    `EditDatabaseScope` TINYINT NOT NULL DEFAULT 0,
    `LastEditedBy` VARCHAR(20),
    `LastEditedAt` TIMESTAMP
);

CREATE TABLE `NewsletterSubscription` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `EmailAddress` VARCHAR(50) NOT NULL UNIQUE,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `SubscribedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UnsubscribedAt` TIMESTAMP NULL,
    `LastEditedBy` VARCHAR(20),
    `LastEditedAt` TIMESTAMP
);

CREATE TABLE `Person` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `PersonID` VARCHAR(20) NOT NULL UNIQUE,
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
    `LastEditedAt` TIMESTAMP
);

CREATE TABLE `News` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `Title` VARCHAR(100) NOT NULL,
    `Content` TEXT NOT NULL,
    `CreatedAt` TIMESTAMP NOT NULL,
    `UpdatedAt` TIMESTAMP,
    `AuthorID` VARCHAR(20),
    `LastEditedBy` VARCHAR(20),
    `LastEditedAt` TIMESTAMP
);

CREATE TABLE `DogTitles` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `CWANumber` VARCHAR(10) NOT NULL,
    `Title` VARCHAR(10) NOT NULL,
    `TitleNumber` VARCHAR(10) NOT NULL,
    `TitleDate` DATE,
    `NamePrefix` CHAR(1) NOT NULL,
    `NameSuffix` CHAR(1) NOT NULL,
    `LastEditedBy` VARCHAR(20),
    `LastEditedAt` TIMESTAMP,
    UNIQUE (`CWANumber`, `Title`)
);

CREATE TABLE `OfficerRole` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `RoleName` VARCHAR(50) UNIQUE NOT NULL,
    `PersonID` VARCHAR(20) NOT NULL,
    `DisplayOrder` INT NOT NULL,
    `Active` BOOLEAN DEFAULT TRUE,
    `LastEditedBy` VARCHAR(20),
    `LastEditedAt` TIMESTAMP
);

CREATE TABLE `DogOwner` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `CWAID` VARCHAR(10) NOT NULL,
    `PersonID` VARCHAR(20) NOT NULL,
    `LastEditedBy` VARCHAR(20),
    `LastEditedAt` TIMESTAMP,
    UNIQUE (`CWAID`, `PersonID`)
);

CREATE TABLE `Club` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
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
    `LastEditedAt` TIMESTAMP
);

CREATE TABLE `Meet` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `MeetNumber` VARCHAR(20) UNIQUE NOT NULL,
    `ClubAbbreviation` VARCHAR(20) NOT NULL,
    `MeetDate` DATE NOT NULL,
    `RaceSecretary` VARCHAR(20),
    `Judge` VARCHAR(20),
    `Location` VARCHAR(20) NOT NULL,
    `Yards` INT NOT NULL,
    `LastEditedBy` VARCHAR(20),
    `LastEditedAt` TIMESTAMP
);

CREATE TABLE `RaceResults` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
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
    UNIQUE (`MeetNumber`, `CWANumber`, `Program`, `RaceNumber`)
);

CREATE TABLE `MeetResults` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `MeetNumber` VARCHAR(20) NOT NULL,
    `CWANumber` VARCHAR(10) NOT NULL,
    `Average` DECIMAL(5,2) NOT NULL,
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
    UNIQUE (`MeetNumber`, `CWANumber`)
);

CREATE TABLE `ChangeLog` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `ChangedTable` VARCHAR(50) NOT NULL,
    `RecordPK` VARCHAR(50) NOT NULL,
    `Operation` VARCHAR(10) NOT NULL,
    `ChangedBy` VARCHAR(20),
    `ChangedAt` TIMESTAMP NOT NULL,
    `Source` VARCHAR(32),
    `BeforeData` TEXT,
    `AfterData` TEXT
);

-- =========================
-- FOREIGN KEYS
-- =========================

ALTER TABLE `DogTitles`
    ADD CONSTRAINT `fk_DogTitles_Dog`
        FOREIGN KEY (`CWANumber`) REFERENCES `Dog` (`CWANumber`);

ALTER TABLE `DogTitles`
    ADD CONSTRAINT `fk_DogTitles_TitleType`
        FOREIGN KEY (`Title`) REFERENCES `TitleType` (`Title`);

ALTER TABLE `DogOwner`
    ADD CONSTRAINT `fk_DogOwner_Dog`
        FOREIGN KEY (`CWAID`) REFERENCES `Dog` (`CWANumber`);

ALTER TABLE `DogOwner`
    ADD CONSTRAINT `fk_DogOwner_Person`
        FOREIGN KEY (`PersonID`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Club`
    ADD CONSTRAINT `fk_Club_BoardMember1`
        FOREIGN KEY (`BoardMember1`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Club`
    ADD CONSTRAINT `fk_Club_BoardMember2`
        FOREIGN KEY (`BoardMember2`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Club`
    ADD CONSTRAINT `fk_Club_DefaultRaceSecretary`
        FOREIGN KEY (`DefaultRaceSecretary`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Meet`
    ADD CONSTRAINT `fk_Meet_Club`
        FOREIGN KEY (`ClubAbbreviation`) REFERENCES `Club` (`ClubAbbreviation`);

ALTER TABLE `Meet`
    ADD CONSTRAINT `fk_Meet_RaceSecretary`
        FOREIGN KEY (`RaceSecretary`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Meet`
    ADD CONSTRAINT `fk_Meet_Judge`
        FOREIGN KEY (`Judge`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `RaceResults`
    ADD CONSTRAINT `fk_RaceResults_Meet`
        FOREIGN KEY (`MeetNumber`) REFERENCES `Meet` (`MeetNumber`);

ALTER TABLE `RaceResults`
    ADD CONSTRAINT `fk_RaceResults_Dog`
        FOREIGN KEY (`CWANumber`) REFERENCES `Dog` (`CWANumber`);

ALTER TABLE `MeetResults`
    ADD CONSTRAINT `fk_MeetResults_Meet`
        FOREIGN KEY (`MeetNumber`) REFERENCES `Meet` (`MeetNumber`);

ALTER TABLE `MeetResults`
    ADD CONSTRAINT `fk_MeetResults_Dog`
        FOREIGN KEY (`CWANumber`) REFERENCES `Dog` (`CWANumber`);

ALTER TABLE `News`
    ADD CONSTRAINT `fk_News_Author`
        FOREIGN KEY (`AuthorID`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Person`
    ADD CONSTRAINT `fk_Person_SystemRole`
        FOREIGN KEY (`SystemRole`) REFERENCES `UserRole` (`Title`);

ALTER TABLE `ChangeLog`
    ADD CONSTRAINT `fk_ChangeLog_ChangedBy`
        FOREIGN KEY (`ChangedBy`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `OfficerRole`
    ADD CONSTRAINT `fk_OfficerRole_Person`
        FOREIGN KEY (`PersonID`) REFERENCES `Person` (`PersonID`);

ALTER TABLE `Dog`
    ADD CONSTRAINT `fk_Dog_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`PersonID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `TitleType`
    ADD CONSTRAINT `fk_TitleType_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`PersonID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `UserRole`
    ADD CONSTRAINT `fk_UserRole_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`PersonID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `NewsletterSubscription`
    ADD CONSTRAINT `fk_NewsletterSubscription_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`PersonID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Person`
    ADD CONSTRAINT `fk_Person_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`PersonID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `News`
    ADD CONSTRAINT `fk_News_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`PersonID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `DogTitles`
    ADD CONSTRAINT `fk_DogTitles_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`PersonID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `OfficerRole`
    ADD CONSTRAINT `fk_OfficerRole_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`PersonID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `DogOwner`
    ADD CONSTRAINT `fk_DogOwner_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`PersonID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Club`
    ADD CONSTRAINT `fk_Club_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`PersonID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Meet`
    ADD CONSTRAINT `fk_Meet_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`PersonID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `RaceResults`
    ADD CONSTRAINT `fk_RaceResults_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`PersonID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `MeetResults`
    ADD CONSTRAINT `fk_MeetResults_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`PersonID`)
        ON DELETE SET NULL ON UPDATE CASCADE;


INSERT IGNORE INTO UserRole
(
  Title,
  EditDogScope,
  EditPersonScope,
  EditDogOwnerScope,
  EditOfficerRoleScope,
  EditUserRoleScope,
  EditClubScope,
  EditMeetScope,
  EditMeetResultsScope,
  EditRaceResultsScope,
  EditDogTitlesScope,
  EditTitleTypeScope,
  EditNewsScope,
  EditDatabaseScope,
  LastEditedBy,
  LastEditedAt
)
VALUES
(
  'ADMIN',
  2,  -- Dog
  2,  -- Person
  2,  -- DogOwner
  2,  -- OfficerRole
  2,  -- UserRole
  2,  -- Club
  2,  -- Meet
  2,  -- MeetResults
  2,  -- RaceResults
  2,  -- DogTitles
  2,  -- TitleType
  2,  -- News
  2,  -- Database
  NULL,
  NULL
),
(
  'PUBLIC',
  1,  -- Dog (self)
  1,  -- Person (self)
  1,  -- DogOwner (self)
  0,  -- OfficerRole
  0,  -- UserRole
  1,  -- Club (self/view-style access)
  1,  -- Meet
  1,  -- MeetResults
  1,  -- RaceResults
  1,  -- DogTitles
  1,  -- TitleType
  1,  -- News
  0,  -- Database
  NULL,
  NULL
);


INSERT INTO Person (
  PersonID,
  FirstName,
  LastName,
  EmailAddress,
  AddressLineOne,
  AddressLineTwo,
  City,
  StateProvince,
  ZipCode,
  Country,
  PrimaryPhone,
  SecondaryPhone,
  SystemRole,
  PasswordHash,
  Notes,
  LastEditedBy,
  LastEditedAt
) VALUES (
  'SYSTEM',
  'System',
  'Account',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'US',
  NULL,
  NULL,
  'ADMIN',
  'SYSTEM_ACCOUNT_NO_LOGIN',
  'Internal system account used for migrations, seed data, and automated edits.',
  NULL,
  CURRENT_TIMESTAMP
);

INSERT INTO TitleType (Title, TitleDescription)
VALUES
  ('ARX',  'Title of Racing Excellence'),
  ('TRP',  'Title of Racing Proficiency'),
  ('PR',   'Performance'),
  ('PR2',  'Performance 2'),
  ('PR3',  'Performance 3'),
  ('PR4',  'Performance 4'),
  ('NARX', 'National Racing Excellence'),
  ('NARX2','National Racing Excellence 2'),
  ('NARX3','National Racing Excellence 3'),
  ('NARX4','National Racing Excellence 4'),
  ('SRA',  'Superior Racing Award'),
  ('SRA2', 'Superior Racing Award 2'),
  ('SRA3', 'Superior Racing Award 3'),
  ('SRA4', 'Superior Racing Award 4'),
  ('DPC',  'Dual Purpose Championship'),
  ('DPCX', 'Dual Purpose Championship Excellent'),
  ('HC',   'High Combined'),
  ('HCX',  'High Combined Excellent');
