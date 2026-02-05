USE cwa_db;

START TRANSACTION;

INSERT IGNORE INTO UserRole
(
  Title,

  ViewDogScope, EditDogScope,
  ViewPersonScope, EditPersonScope,
  ViewDogOwnerScope, EditDogOwnerScope,
  ViewOfficerRoleScope, EditOfficerRoleScope,
  ViewUserRoleScope, EditUserRoleScope,
  ViewClubScope, EditClubScope,
  ViewMeetScope, EditMeetScope,
  ViewMeetResultsScope, EditMeetResultsScope,
  ViewRaceResultsScope, EditRaceResultsScope,
  ViewDogTitlesScope, EditDogTitlesScope,
  ViewNewsScope, EditNewsScope
)
VALUES
(
  'ADMIN',
  2,2,  -- Dog
  2,2,  -- Person
  2,2,  -- DogOwner
  2,2,  -- OfficerRole
  2,2,  -- UserRole
  2,2,  -- Club
  2,2,  -- Meet
  2,2,  -- MeetResults
  2,2,  -- RaceResults
  2,2,  -- DogTitles
  2,2   -- News
),
(
  'PUBLIC',
  2,1,  -- Dog: view all, edit self (or change to 2,0 if you want no edits)
  1,1,  -- Person: typically self/self (adjust as you want)
  1,1,  -- DogOwner
  0,0,  -- OfficerRole
  0,0,  -- UserRole
  2,1,  -- Club: view all, edit self (board member check in controller)
  2,1,  -- Meet: view all, edit self (race secretary / judge check)
  2,1,  -- MeetResults
  2,1,  -- RaceResults
  2,1,  -- DogTitles
  2,1   -- News: view all, edit self (author)
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


INSERT INTO Person (
  PersonID, FirstName, LastName, EmailAddress,
  AddressLineOne, AddressLineTwo, City, StateProvince, ZipCode, Country,
  PrimaryPhone, SecondaryPhone,
  SystemRole, PasswordHash, Notes,
  LastEditedBy, LastEditedAt
) VALUES

-- Officers
('P0001','Krista','Siehndel','ksiehndel@gmail.com',NULL,NULL,NULL,'WI',NULL,'US',NULL,NULL,'ADMIN','TEMP_RESET_ME','', 'SYSTEM', CURRENT_TIMESTAMP),
('P0002','Julie','Poole','llpoolej@gmail.com',NULL,NULL,NULL,'TN',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','', 'SYSTEM', CURRENT_TIMESTAMP),
('P0003','Kristal','Couch','kcouch76@gmail.com',NULL,NULL,NULL,'OK',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','', 'SYSTEM', CURRENT_TIMESTAMP),
('P0004','Beth','Levine','serendipitywhippets@gmail.com',NULL,NULL,NULL,'BC',NULL,'CA',NULL,NULL,'PUBLIC','TEMP_RESET_ME','', 'SYSTEM', CURRENT_TIMESTAMP),
('P0005','Liz','Aiello','bobookitty@aol.com',NULL,NULL,NULL,'MA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','', 'SYSTEM', CURRENT_TIMESTAMP),

-- Board / Directors
('P0101','Nancy','Colson','dorae_nrc@consolidated.net',NULL,NULL,NULL,'TX',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','AAWC BoardMember1', 'SYSTEM', CURRENT_TIMESTAMP),
('P0102','Sami','Hirko','dediciwhippets@yahoo.com',NULL,NULL,NULL,'TX',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','AAWC BoardMember2', 'SYSTEM', CURRENT_TIMESTAMP),
('P0103','Janet','Siehndel','noralor100@yahoo.com',NULL,NULL,NULL,'WI',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','BWA BoardMember1', 'SYSTEM', CURRENT_TIMESTAMP),
('P0104','Peggy','Berg','shineberg@gmail.com',NULL,NULL,NULL,'WI',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','BWA BoardMember2', 'SYSTEM', CURRENT_TIMESTAMP),
('P0105','Phoebe','Booth','shamasan@aol.com',NULL,NULL,NULL,'MA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','CMANYWHIPS BoardMember2', 'SYSTEM', CURRENT_TIMESTAMP),
('P0106','Mary Beth','Arthur','marialwhippets@gmail.com',NULL,NULL,NULL,'WI',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','DWC BoardMember1', 'SYSTEM', CURRENT_TIMESTAMP),
('P0107','Tom','Moran','lmoranthomas@gmail.com',NULL,NULL,NULL,'WI',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','DWC BoardMember2', 'SYSTEM', CURRENT_TIMESTAMP),
('P0108','Chris','Durance-Watkins','georgiaragracing@gmail.com',NULL,NULL,NULL,'GA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','GRR BoardMember1', 'SYSTEM', CURRENT_TIMESTAMP),
('P0109','Jennifer','Kempey','skylinewhippets@gmail.com',NULL,NULL,NULL,'GA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','GRR BoardMember2', 'SYSTEM', CURRENT_TIMESTAMP),
('P0110','Annie','Andrews','andrewsmysticrun@gmail.com',NULL,NULL,NULL,'NJ',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','MAWRA BoardMember1', 'SYSTEM', CURRENT_TIMESTAMP),
('P0111','Kristen','Fredericks','cofeature@gmail.com',NULL,NULL,NULL,'VA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','MAWRA BoardMember2', 'SYSTEM', CURRENT_TIMESTAMP),
('P0112','Barb','Hearley','bhearley@yahoo.com',NULL,NULL,NULL,'MN',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','NSR BoardMember1', 'SYSTEM', CURRENT_TIMESTAMP),
('P0113','Fran','Hearley','fhearley@yahoo.com',NULL,NULL,NULL,'MN',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','NSR BoardMember2', 'SYSTEM', CURRENT_TIMESTAMP),
('P0114','Bonnie','Moore','bonnie.moore@gmail.com',NULL,NULL,NULL,'CA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','NCWFA BoardMember1', 'SYSTEM', CURRENT_TIMESTAMP),
('P0115','Jenifer','Haas','whippetmom@me.com',NULL,NULL,NULL,'CA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','NCWFA BoardMember2', 'SYSTEM', CURRENT_TIMESTAMP),
('P0116','Lisa','Costello','mtncow100@gmail.com',NULL,NULL,NULL,'OK',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','ORCA BoardMember2', 'SYSTEM', CURRENT_TIMESTAMP),
('P0117','Kristy','Thomas','messyparrot@yahoo.com',NULL,NULL,NULL,'WI',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','PDQWC BoardMember2', 'SYSTEM', CURRENT_TIMESTAMP),
('P0118','Lorna','Leinbach','leinbach@shaw.ca',NULL,NULL,NULL,'BC',NULL,'CA',NULL,NULL,'PUBLIC','TEMP_RESET_ME','RFF BoardMember2', 'SYSTEM', CURRENT_TIMESTAMP),
('P0119','Charlotte','Fielder','charlottefielder@me.com',NULL,NULL,NULL,'CA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','RCRA BoardMember1', 'SYSTEM', CURRENT_TIMESTAMP),
('P0120','Diane','Johnson','diane.r.johnson@sbcglobal.net',NULL,NULL,NULL,'CA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','RCRA BoardMember2', 'SYSTEM', CURRENT_TIMESTAMP),
('P0121','Carl','Morgan','cmorgan215@att.net',NULL,NULL,NULL,'OH',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','RNRWA BoardMember1', 'SYSTEM', CURRENT_TIMESTAMP),
('P0122','Brooklyn','Canfield','samorakennel@gmail.com',NULL,NULL,NULL,'OH',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','RNRWA BoardMember2', 'SYSTEM', CURRENT_TIMESTAMP),
('P0123','Phyllis','Brown','smartwhippet@gmail.com',NULL,NULL,NULL,'TN',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','SMART BoardMember2', 'SYSTEM', CURRENT_TIMESTAMP),
('P0124','Elizabeth','Rockwell','elizabeth.rockwell@gmail.com',NULL,NULL,NULL,'MA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','WINE BoardMember1', 'SYSTEM', CURRENT_TIMESTAMP),
('P0125','Donna','Miner','dominodogs@charter.net',NULL,NULL,NULL,'MA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','WINE BoardMember2', 'SYSTEM', CURRENT_TIMESTAMP);


INSERT INTO OfficerRole (RoleName, PersonID, DisplayOrder, Active) VALUES
('President', 'P0001', 1, TRUE),
('Vice President', 'P0002', 2, TRUE),
('Secretary', 'P0003', 3, TRUE),
('Treasurer', 'P0004', 4, TRUE),
('Registrar', 'P0005', 5, TRUE),
('Statistician', 'P0001', 6, TRUE),
('Website', 'P0004', 7, TRUE);

INSERT INTO Club (
  ClubAbbreviation, ClubName, ClubStatus, BeginDate, EndDate,
  BoardMember1, BoardMember2, DefaultRaceSecretary, Notes,
  LastEditedBy, LastEditedAt
) VALUES
('AAWC', 'Alamo Area Whippet Club (AAWC)', 'Active', NULL, NULL, 'P0101', 'P0102', NULL, NULL, 'SYSTEM', NOW()),
('BWA', 'Badgerland Whippet Association (BWA)', 'Active', NULL, NULL, 'P0103', 'P0104', NULL, NULL, 'SYSTEM', NOW()),
('CMANYWHIPS', 'CT/MA/NY Whippet Society (CMANYWHIPS)', 'Active', NULL, NULL, 'P0005', 'P0105', NULL, NULL, 'SYSTEM', NOW()),
('DWC', 'Dairyland Whippet Club (DWC)', 'Active', NULL, NULL, 'P0106', 'P0107', NULL, NULL, 'SYSTEM', NOW()),
('GRR', 'Georgia Rag Racing (GRR)', 'Active', NULL, NULL, 'P0108', 'P0109', NULL, NULL, 'SYSTEM', NOW()),
('MAWRA', 'Mid-Atlantic Whippet Racing Association (MAWRA)', 'Active', NULL, NULL, 'P0110', 'P0111', NULL, NULL, 'SYSTEM', NOW()),
('NSR', 'North Star Racing (NSR)', 'Active', NULL, NULL, 'P0112', 'P0113', NULL, NULL, 'SYSTEM', NOW()),
('NCWFA', 'Northern California Whippet Fanciers Association (NCWFA)', 'Active', NULL, NULL, 'P0114', 'P0115', NULL, NULL, 'SYSTEM', NOW()),
('ORCA', 'Oklahoma Racing and Coursing Association (ORCA)', 'Active', NULL, NULL, 'P0003', 'P0116', NULL, NULL, 'SYSTEM', NOW()),
('PDQWC', 'Pretty Darn Quick Whippet Club (PDQWC)', 'Active', NULL, NULL, 'P0001', 'P0117', NULL, NULL, 'SYSTEM', NOW()),
('RFF', 'Racing For Fun (RFF)', 'Active', NULL, NULL, 'P0004', 'P0118', NULL, NULL, 'SYSTEM', NOW()),
('RCRA', 'River City Racing Association (RCRA)', 'Active', NULL, NULL, 'P0119', 'P0120', NULL, NULL, 'SYSTEM', NOW()),
('RNRWA', 'Rock and Roll Whippet Association (RNRWA)', 'Active', NULL, NULL, 'P0121', 'P0122', NULL, NULL, 'SYSTEM', NOW()),
('SMART', 'Smokey Mountain Area Racing Tennessee (SMART)', 'Active', NULL, NULL, 'P0002', 'P0123', NULL, NULL, 'SYSTEM', NOW()),
('WINE', 'Whippets in New England (WINE)', 'Active', NULL, NULL, 'P0124', 'P0125', NULL, NULL, 'SYSTEM', NOW());

COMMIT