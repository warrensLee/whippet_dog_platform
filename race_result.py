'''
Docstring for race_result

TODO:
'''

class RaceResult:
    
    def __init__(self, meet_number, CWA_number, program, entry_type, box,
                 placement, meet_points, incident, last_edited_by, last_edited_at):
        self.meet_number = meet_number
        self.CWA_number = CWA_number
        self.program = program
        self.entry_type = entry_type
        self.box = box
        self.placement = placement
        self.meet_points = meet_points
        self.incident = incident
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at