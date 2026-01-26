USE cwa_db;

START TRANSACTION;

SET FOREIGN_KEY_CHECKS=0;
DELETE FROM Club;
DELETE FROM Person;
SET FOREIGN_KEY_CHECKS=1;

INSERT IGNORE INTO UserRole (Title) VALUES
('ADMIN'),
('PUBLIC');

INSERT INTO Person (
  PersonID, FirstName, LastName, EmailAddress,
  AddressLineOne, AddressLineTwo, City, StateProvince, ZipCode, Country,
  PrimaryPhone, SecondaryPhone,
  SystemRole, PasswordHash, Notes, LastEditedBy, LastEditedAt
) VALUES
-- Officers
('P0001','Krista','Siehndel','ksiehndel@gmail.com',NULL,NULL,NULL,'WI',NULL,'US',NULL,NULL,'ADMIN','TEMP_RESET_ME','Officer: President/Statistician','seed',NOW()),
('P0002','Julie','Poole','llpoolej@gmail.com',NULL,NULL,NULL,'TN',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','Officer: Vice President','seed',NOW()),
('P0003','Kristal','Couch','kcouch76@gmail.com',NULL,NULL,NULL,'OK',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','Officer: Secretary','seed',NOW()),
('P0004','Beth','Levine','serendipitywhippets@gmail.com',NULL,NULL,NULL,'BC',NULL,'CA',NULL,NULL,'PUBLIC','TEMP_RESET_ME','Officer: Treasurer/Website','seed',NOW()),
('P0005','Liz','Aiello','bobookitty@aol.com',NULL,NULL,NULL,'MA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','Officer: Registrar','seed',NOW()),

-- Board / Directors
('P0101','Nancy','Colson','dorae_nrc@consolidated.net',NULL,NULL,NULL,'TX',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','AAWC BoardMember1','seed',NOW()),
('P0102','Sami','Hirko','dediciwhippets@yahoo.com',NULL,NULL,NULL,'TX',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','AAWC BoardMember2','seed',NOW()),

('P0103','Janet','Siehndel','noralor100@yahoo.com',NULL,NULL,NULL,'WI',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','BWA BoardMember1','seed',NOW()),
('P0104','Peggy','Berg','shineberg@gmail.com',NULL,NULL,NULL,'WI',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','BWA BoardMember2','seed',NOW()),

('P0105','Phoebe','Booth','shamasan@aol.com',NULL,NULL,NULL,'MA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','CMANYWHIPS BoardMember2','seed',NOW()),

('P0106','Mary Beth','Arthur','marialwhippets@gmail.com',NULL,NULL,NULL,'WI',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','DWC BoardMember1','seed',NOW()),
('P0107','Tom','Moran','lmoranthomas@gmail.com',NULL,NULL,NULL,'WI',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','DWC BoardMember2','seed',NOW()),

('P0108','Chris','Durance-Watkins','georgiaragracing@gmail.com',NULL,NULL,NULL,'GA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','GRR BoardMember1','seed',NOW()),
('P0109','Jennifer','Kempey','skylinewhippets@gmail.com',NULL,NULL,NULL,'GA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','GRR BoardMember2','seed',NOW()),

('P0110','Annie','Andrews','andrewsmysticrun@gmail.com',NULL,NULL,NULL,'NJ',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','MAWRA BoardMember1','seed',NOW()),
('P0111','Kristen','Fredericks','cofeature@gmail.com',NULL,NULL,NULL,'VA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','MAWRA BoardMember2','seed',NOW()),

('P0112','Barb','Hearley','bhearley@yahoo.com',NULL,NULL,NULL,'MN',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','NSR BoardMember1','seed',NOW()),
('P0113','Fran','Hearley','fhearley@yahoo.com',NULL,NULL,NULL,'MN',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','NSR BoardMember2','seed',NOW()),

('P0114','Bonnie','Moore','bonnie.moore@gmail.com',NULL,NULL,NULL,'CA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','NCWFA BoardMember1','seed',NOW()),
('P0115','Jenifer','Haas','whippetmom@me.com',NULL,NULL,NULL,'CA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','NCWFA BoardMember2','seed',NOW()),

('P0116','Lisa','Costello','mtncow100@gmail.com',NULL,NULL,NULL,'OK',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','ORCA BoardMember2','seed',NOW()),

('P0117','Kristy','Thomas','messyparrot@yahoo.com',NULL,NULL,NULL,'WI',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','PDQWC BoardMember2','seed',NOW()),

('P0118','Lorna','Leinbach','leinbach@shaw.ca',NULL,NULL,NULL,'BC',NULL,'CA',NULL,NULL,'PUBLIC','TEMP_RESET_ME','RFF BoardMember2','seed',NOW()),

('P0119','Charlotte','Fielder','charlottefielder@me.com',NULL,NULL,NULL,'CA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','RCRA BoardMember1','seed',NOW()),
('P0120','Diane','Johnson','diane.r.johnson@sbcglobal.net',NULL,NULL,NULL,'CA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','RCRA BoardMember2','seed',NOW()),

('P0121','Carl','Morgan','cmorgan215@att.net',NULL,NULL,NULL,'OH',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','RNRWA BoardMember1','seed',NOW()),
('P0122','Brooklyn','Canfield','samorakennel@gmail.com',NULL,NULL,NULL,'OH',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','RNRWA BoardMember2','seed',NOW()),

('P0123','Phyllis','Brown','smartwhippet@gmail.com',NULL,NULL,NULL,'TN',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','SMART BoardMember2','seed',NOW()),

('P0124','Elizabeth','Rockwell','elizabeth.rockwell@gmail.com',NULL,NULL,NULL,'MA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','WINE BoardMember1','seed',NOW()),
('P0125','Donna','Miner','dominodogs@charter.net',NULL,NULL,NULL,'MA',NULL,'US',NULL,NULL,'PUBLIC','TEMP_RESET_ME','WINE BoardMember2','seed',NOW());

-- -----------------------
-- 2) Clubs
-- This inserts all clubs with board members filled as strings.
-- Adjust ClubStatus/BeginDate/EndDate as needed.
-- -----------------------
INSERT INTO Club (
  ClubAbbreviation, ClubName, ClubStatus, BeginDate, EndDate,
  BoardMember1, BoardMember2, DefaultRaceSecretary, Notes,
  LastEditedBy, LastEditedAt
) VALUES
('AAWC', 'Alamo Area Whippet Club (AAWC)', 'Active', NULL, NULL, 'P0101', 'P0102', NULL, NULL, 'seed', NOW()),
('BWA', 'Badgerland Whippet Association (BWA)', 'Active', NULL, NULL, 'P0103', 'P0104', NULL, NULL, 'seed', NOW()),
('CMANYWHIPS', 'CT/MA/NY Whippet Society (CMANYWHIPS)', 'Active', NULL, NULL, 'P0005', 'P0105', NULL, NULL, 'seed', NOW()),
('DWC', 'Dairyland Whippet Club (DWC)', 'Active', NULL, NULL, 'P0106', 'P0107', NULL, NULL, 'seed', NOW()),
('GRR', 'Georgia Rag Racing (GRR)', 'Active', NULL, NULL, 'P0108', 'P0109', NULL, NULL, 'seed', NOW()),
('MAWRA', 'Mid-Atlantic Whippet Racing Association (MAWRA)', 'Active', NULL, NULL, 'P0110', 'P0111', NULL, NULL, 'seed', NOW()),
('NSR', 'North Star Racing (NSR)', 'Active', NULL, NULL, 'P0112', 'P0113', NULL, NULL, 'seed', NOW()),
('NCWFA', 'Northern California Whippet Fanciers Association (NCWFA)', 'Active', NULL, NULL, 'P0114', 'P0115', NULL, NULL, 'seed', NOW()),
('ORCA', 'Oklahoma Racing and Coursing Association (ORCA)', 'Active', NULL, NULL, 'P0003', 'P0116', NULL, NULL, 'seed', NOW()),
('PDQWC', 'Pretty Darn Quick Whippet Club (PDQWC)', 'Active', NULL, NULL, 'P0001', 'P0117', NULL, NULL, 'seed', NOW()),
('RFF', 'Racing For Fun (RFF)', 'Active', NULL, NULL, 'P0004', 'P0118', NULL, NULL, 'seed', NOW()),
('RCRA', 'River City Racing Association (RCRA)', 'Active', NULL, NULL, 'P0119', 'P0120', NULL, NULL, 'seed', NOW()),
('RNRWA', 'Rock and Roll Whippet Association (RNRWA)', 'Active', NULL, NULL, 'P0121', 'P0122', NULL, NULL, 'seed', NOW()),
('SMART', 'Smokey Mountain Area Racing Tennessee (SMART)', 'Active', NULL, NULL, 'P0002', 'P0123', NULL, NULL, 'seed', NOW()),
('WINE', 'Whippets in New England (WINE)', 'Active', NULL, NULL, 'P0124', 'P0125', NULL, NULL, 'seed', NOW());

COMMIT;