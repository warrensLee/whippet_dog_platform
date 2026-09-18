-- Cascade delete on RaceResults and MeetResults FKs.
-- When a referenced Meet or Dog is deleted, all associated
-- RaceResults and MeetResults rows are automatically removed.

ALTER TABLE `RaceResults`
    DROP FOREIGN KEY `fk_RaceResults_Meet`;
ALTER TABLE `RaceResults`
    ADD CONSTRAINT `fk_RaceResults_Meet`
        FOREIGN KEY (`MeetNumber`) REFERENCES `Meet` (`MeetNumber`)
        ON DELETE CASCADE;

ALTER TABLE `MeetResults`
    DROP FOREIGN KEY `fk_MeetResults_Meet`;
ALTER TABLE `MeetResults`
    ADD CONSTRAINT `fk_MeetResults_Meet`
        FOREIGN KEY (`MeetNumber`) REFERENCES `Meet` (`MeetNumber`)
        ON DELETE CASCADE;
