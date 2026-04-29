ALTER TABLE `Dog`
    ADD COLUMN `DPCPoints` DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER `AOMEarned`,
    ADD COLUMN `ManualMeetPointsAdjustment` DECIMAL(6,2) NOT NULL DEFAULT 0 AFTER `DPCPoints`,
    ADD COLUMN `ManualARXPointsAdjustment` DECIMAL(6,2) NOT NULL DEFAULT 0 AFTER `ManualMeetPointsAdjustment`,
    ADD COLUMN `ManualNARXPointsAdjustment` DECIMAL(6,2) NOT NULL DEFAULT 0 AFTER `ManualARXPointsAdjustment`,
    ADD COLUMN `ManualShowPointsAdjustment` DECIMAL(6,2) NOT NULL DEFAULT 0 AFTER `ManualNARXPointsAdjustment`,
    ADD COLUMN `ManualDPCPointsAdjustment` DECIMAL(6,2) NOT NULL DEFAULT 0 AFTER `ManualShowPointsAdjustment`;

ALTER TABLE `Meet`
    ADD COLUMN `Completed` TINYINT(1) NOT NULL DEFAULT 0 AFTER `Yards`;

UPDATE `Dog` d
LEFT JOIN (
    SELECT
        CWANumber,
        COALESCE(SUM(DPCPoints), 0) AS TotalDPCPoints
    FROM `MeetResults`
    GROUP BY CWANumber
) mr
    ON mr.CWANumber = d.CWANumber
SET d.DPCPoints = COALESCE(mr.TotalDPCPoints, 0);

UPDATE `Meet` m
JOIN (
    SELECT
        ClubAbbreviation,
        MeetDate,
        Location,
        COUNT(*) AS EventMeetCount
    FROM `Meet`
    GROUP BY ClubAbbreviation, MeetDate, Location
) grouped
    ON grouped.ClubAbbreviation = m.ClubAbbreviation
   AND grouped.MeetDate = m.MeetDate
   AND grouped.Location = m.Location
SET m.Completed = CASE WHEN grouped.EventMeetCount >= 3 THEN 1 ELSE 0 END;
