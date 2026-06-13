ALTER TABLE MeetResults
    ADD COLUMN EntryType VARCHAR(5) NOT NULL DEFAULT '';

UPDATE MeetResults mr
JOIN RaceResults rr
    ON mr.MeetNumber = rr.MeetNumber
    AND mr.CWANumber = rr.CWANumber
    AND rr.ID = (
        SELECT r2.ID
        FROM RaceResults r2
        WHERE r2.MeetNumber = rr.MeetNumber
          AND r2.CWANumber = rr.CWANumber
        ORDER BY r2.RaceNumber ASC
        LIMIT 1
    )
SET mr.EntryType = rr.EntryType;

ALTER TABLE RaceResults
    DROP COLUMN EntryType;
