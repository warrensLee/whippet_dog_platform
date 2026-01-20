'''
Docstring for club

TODO:
'''

class Club:
    def __init__(self, club_abbreviation, club_name, club_status, begin_date, end_date,
                 board_member1, board_member2, default_race_secretary, last_edited_by, last_edited_at):
        self.club_abbreviation = club_abbreviation
        self.club_name = club_name
        self.club_status = club_status
        self.begin_date = begin_date
        self.end_date = end_date
        self.board_member1 = board_member1
        self.board_member2 = board_member2
        self.default_race_secretary = default_race_secretary
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at
        