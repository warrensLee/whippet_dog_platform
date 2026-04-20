USE cwa_db;

-- =========================
-- TABLES
-- =========================

CREATE TABLE `Dog` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `CWANumber` VARCHAR(10) NOT NULL UNIQUE,
    `RegisteredNumber` VARCHAR(50),
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
    `AOMEarned` DECIMAL(5,2),
    `PublicNotes` TEXT,
    `PrivateNotes` TEXT,
    `DNA` VARCHAR(50),
    `SireDNA` VARCHAR(50),
    `DamDNA` VARCHAR(50),
    `KennelClubChampion` TINYINT(1) NOT NULL DEFAULT 0,
    `LastEditedBy` INT,
    `LastEditedAt` TIMESTAMP
);

CREATE TABLE `TitleType` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `Title` VARCHAR(10) NOT NULL UNIQUE,
    `TitleDescription` VARCHAR(200) NOT NULL,
    `LastEditedBy` INT,
    `LastEditedAt` TIMESTAMP
);

CREATE TABLE `UserRole` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `Title` VARCHAR(20) NOT NULL UNIQUE,
    `EditDogScope` TINYINT NOT NULL DEFAULT 0,
    `EditPersonScope` TINYINT NOT NULL DEFAULT 0,
    `EditDogOwnerScope` TINYINT NOT NULL DEFAULT 0,
    `EditUserRoleScope` TINYINT NOT NULL DEFAULT 0,
    `EditMeetScope` TINYINT NOT NULL DEFAULT 0,
    `EditMeetResultsScope` TINYINT NOT NULL DEFAULT 0,
    `EditRaceResultsScope` TINYINT NOT NULL DEFAULT 0,
    `EditDogTitlesScope` TINYINT NOT NULL DEFAULT 0,
    `EditTitleTypeScope` TINYINT NOT NULL DEFAULT 0,
    `EditDatabaseScope` TINYINT NOT NULL DEFAULT 0,
    `LastEditedBy` INT,
    `LastEditedAt` TIMESTAMP
);

CREATE TABLE `Person` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `PersonID` VARCHAR(20) UNIQUE NULL,
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
    `PasswordHash` VARCHAR(255),
    `Notes` TEXT,
    `PublicNotes` TEXT,
    `Locked` TINYINT(1) NOT NULL DEFAULT 0,
    `LastEditedBy` INT,
    `LastEditedAt` TIMESTAMP
);

CREATE TABLE `DogTitles` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `CWANumber` VARCHAR(10) NOT NULL,
    `Title` VARCHAR(10) NOT NULL,
    `TitleNumber` VARCHAR(10) NOT NULL,
    `TitleDate` DATE,
    `NamePrefix` CHAR(1),
    `NameSuffix` CHAR(1),
    `LastEditedBy` INT,
    `LastEditedAt` TIMESTAMP,
    UNIQUE (`CWANumber`, `Title`)
);

CREATE TABLE `DogOwner` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `CWAID` VARCHAR(10) NOT NULL,
    `PersonID` INT NOT NULL,
    `LastEditedBy` INT,
    `LastEditedAt` TIMESTAMP,
    UNIQUE (`CWAID`, `PersonID`)
);

CREATE TABLE `Meet` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `MeetNumber` VARCHAR(20) UNIQUE NOT NULL,
    `ClubAbbreviation` VARCHAR(20) NOT NULL,
    `MeetDate` DATE NOT NULL,
    `RaceSecretary` INT,
    `Judge` INT,
    `Location` VARCHAR(20) NOT NULL,
    `Yards` INT NOT NULL,
    `PublicNotes` TEXT,
    `PrivateNotes` TEXT,
    `LastEditedBy` INT,
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
    `AOMEarned` DECIMAL(3,2) NOT NULL,
    `DPCPoints` DECIMAL(3,2) NOT NULL,
    `Incident` VARCHAR(5),
    `LastEditedBy` INT,
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
    `ConformationPlacement` INT,
    `MatchPoints` DECIMAL(5,2),
    `MeetPoints` DECIMAL(5,2) NOT NULL,
    `ARXEarned` DECIMAL(5,2) NOT NULL,
    `NARXEarned` DECIMAL(5,2) NOT NULL,
    `Shown` CHAR(1) NOT NULL,
    `ShowPlacement` INT,
    `ShowPoints` INT,
    `DPCLeg` CHAR(1),
    `HCScore` INT,
    `HCLegEarned` CHAR(1),
    `AOMEarned` DECIMAL(5,2) NOT NULL,
    `DPCPoints` DECIMAL(5,2) NOT NULL,
    `LastEditedBy` INT,
    `LastEditedAt` TIMESTAMP,
    UNIQUE (`MeetNumber`, `CWANumber`)
);

CREATE TABLE `ChangeLog` (
    `ID` INT PRIMARY KEY AUTO_INCREMENT,
    `ChangedTable` VARCHAR(50) NOT NULL,
    `RecordPK` VARCHAR(50) NOT NULL,
    `Operation` VARCHAR(10) NOT NULL,
    `ChangedBy` INT,
    `ChangedAt` TIMESTAMP NOT NULL,
    `Source` VARCHAR(32),
    `BeforeData` TEXT,
    `AfterData` TEXT
);

CREATE TABLE PasswordResetToken (
    TokenID INT AUTO_INCREMENT PRIMARY KEY,
    PersonID INT NOT NULL,
    Token CHAR(64) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    Used TINYINT(1) DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PersonID) REFERENCES Person(ID) ON DELETE CASCADE
);

CREATE TABLE RegistrationInvite (
    InviteID INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(255) NOT NULL,
    Token VARCHAR(255) NOT NULL UNIQUE,
    ExpiresAt DATETIME NOT NULL,
    Used TINYINT(1) NOT NULL DEFAULT 0,
    PersonID INT NULL,
    CreatedBy INT NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UsedAt DATETIME NULL,
    FOREIGN KEY (CreatedBy) REFERENCES Person(ID) ON DELETE CASCADE
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
        FOREIGN KEY (`PersonID`) REFERENCES `Person` (`ID`);

ALTER TABLE `Meet`
    ADD CONSTRAINT `fk_Meet_RaceSecretary`
        FOREIGN KEY (`RaceSecretary`) REFERENCES `Person` (`ID`);

ALTER TABLE `Meet`
    ADD CONSTRAINT `fk_Meet_Judge`
        FOREIGN KEY (`Judge`) REFERENCES `Person` (`ID`);

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

ALTER TABLE `Person`
    ADD CONSTRAINT `fk_Person_SystemRole`
        FOREIGN KEY (`SystemRole`) REFERENCES `UserRole` (`Title`);

ALTER TABLE `ChangeLog`
    ADD CONSTRAINT `fk_ChangeLog_ChangedBy`
        FOREIGN KEY (`ChangedBy`) REFERENCES `Person` (`ID`);

ALTER TABLE `Dog`
    ADD CONSTRAINT `fk_Dog_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`ID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `TitleType`
    ADD CONSTRAINT `fk_TitleType_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`ID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `UserRole`
    ADD CONSTRAINT `fk_UserRole_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`ID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Person`
    ADD CONSTRAINT `fk_Person_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`ID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `DogTitles`
    ADD CONSTRAINT `fk_DogTitles_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`ID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `DogOwner`
    ADD CONSTRAINT `fk_DogOwner_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`ID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Meet`
    ADD CONSTRAINT `fk_Meet_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`ID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `RaceResults`
    ADD CONSTRAINT `fk_RaceResults_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`ID`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `MeetResults`
    ADD CONSTRAINT `fk_MeetResults_LastEditedBy`
        FOREIGN KEY (`LastEditedBy`) REFERENCES `Person` (`ID`)
        ON DELETE SET NULL ON UPDATE CASCADE;


INSERT INTO UserRole
(
  Title,
  EditDogScope,
  EditPersonScope,
  EditDogOwnerScope,
  EditUserRoleScope,
  EditMeetScope,
  EditMeetResultsScope,
  EditRaceResultsScope,
  EditDogTitlesScope,
  EditTitleTypeScope,
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
  2,  -- UserRole
  2,  -- Meet
  2,  -- MeetResults
  2,  -- RaceResults
  2,  -- DogTitles
  2,  -- TitleType
  2,  -- Database
  NULL,
  NULL
),
(
  'PUBLIC',
  0,  -- Dog 
  0,  -- Person 
  0,  -- DogOwner 
  0,  -- UserRole
  0,  -- Meet
  0,  -- MeetResults
  0,  -- RaceResults
  0,  -- DogTitles
  0,  -- TitleType
  0,  -- Database
  NULL,
  NULL
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
