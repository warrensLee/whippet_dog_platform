'''
Docstring for dog

TODO:
Need a way to dynamically add and remove titles and check them
Finish check_trp_title
    Add meet_appearences attribute?
Finish check_dpc_title
    Add akc_championships attribute?
    Add ckc_championships attribute?
Add physical attributes and check qualifications method?
'''

class Dog:

    # Age thresholds in months 
    PUPPY_AGE_MONTHS = 8
    ADULT_AGE_MONTHS = 14
    VETERAN_AGE_MONTHS = 84

    # STATUSES = {"Active", "Inactive"}
    # GRADES = {"FTE", "D", "C", "B", "A"}

    def __init__(self, cwa_number, akc_number, ckc_number, foreign_number, foreign_type, call_name,
                 registered_name, birthdate, pedigree_link, status, average, current_grade, meet_points, arx_points,
                 narx_points, show_points, dpc_legs, meet_wins, notes, last_edited_by, last_edited_at):
        self.cwa_number = cwa_number
        self.akc_number = akc_number
        self.ckc_number = ckc_number
        self.foreign_number = foreign_number
        self.foreign_type = foreign_type
        self.call_name = call_name
        self.registered_name = registered_name
        self.birthdate = birthdate
        self.pedigree_link = pedigree_link
        self.status = status
        self.average = average
        self.current_grade = current_grade
        self.meet_points = meet_points
        self.arx_points = arx_points
        self.narx_points = narx_points
        self.show_points = show_points
        self.dpc_legs = dpc_legs
        self.meet_wins = meet_wins
        self.notes = notes
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at
    
    # check grade of dog based on point average and status
    def check_grade(self):
        pass
        # if is_puppy() or number of meets == 0:
            # return "FTE"
        # average = get point average
        # if average >= 15.0:
            # if self.status == "Inactive":
                # return "B"
            # return "A"
        # if average >= 10.0:
            # if self.status == "Inactive":
                # return "C"
            # return "B"
        # if average >= 5.0:
            # if self.status == "Inactive":
                # return "D"
            # return "C"
        # return "D"

    # get point average from last three meets
    def get_point_average(selfs):
        pass
        # get last three meet points
        # return average points from last three meets
    
    # check eligibility for all titles and return a list of earned titles
    def check_titles(self):
        titles = []
        arx_title = self.check_arx_title()
        if arx_title:
            titles.append(arx_title)
        trp_title = self.check_trp_title()
        if trp_title:
            titles.append(trp_title)
        pr_title = self.check_pr_title()
        if pr_title:
            titles.append(pr_title)
        narx_title = self.check_narx_title()
        if narx_title:
            titles.append(narx_title)
        dpc_title = self.check_dpc_title()
        if dpc_title:
            titles.append(dpc_title)
        hc_title = self.check_hc_title()
        if hc_title:
            titles.append(hc_title)
        return titles

    # check eligibility for CWA Award of Racing Excellence (ARX) title
    def check_arx_title(self):
        if self.arx_points >= 15:
            return "ARX"
        return None
    
    # check eligibility for Title of Racing Proficiency
    def check_trp_title(self):
        pass
        # if race meets >= 10:
            # return "TRP"
        # return none

    # check eligibility for Performance (PR) titles
    def check_pr_title(self):
        if self.meet_points >= 450:
            return "PRX"
        if self.meet_points >= 350:
            return "PR4"
        if self.meet_points >= 250:
            return "PR3"
        if self.meet_points >= 150:
            return "PR2"
        if self.meet_points >= 50:
            return "PR"
        return None

    # check eligibility for National Racing Excellence (NRX)
    # and Superior Racing Award (SRA) titles
    def check_narx_title(self):
        if self.narx_points >= 300:
            return "SRA4"
        if self.narx_points >= 225:
            return "SRA3"
        if self.narx_points >= 150:
            return "SRA2"
        if self.narx_points >= 75:
            return "SRA"
        if self.narx_points >= 60:
            return "NARX4"
        if self.narx_points >= 45:
            return "NARX3"
        if self.narx_points >= 30:
            return "NARX2"
        if self.narx_points >= 15:
            return "NARX"
        return None
    
    # check eligibility for CWA Dual Purpose Championship titles
    def check_dpc_title(self):
        pass
        # if self.check_trp_title() == "TRP" and 
        # ((has AKC or CKC championship) or (self.dpc_legs >= 5)):
            # if self.check_arx_title() == "ARX":
                # return "DPCX"
            # return "DPC"
        # return None
    
    # check eligibility for High Combined (HC) titles
    def check_hc_title(self):
        pass
        # if is_adult():
            # if high combined wins >= 10:
                # return "HCX"
            # if high combined wins >= 5:
                # return "HC"
        # return None
    
    def is_puppy(self):
        from datetime import datetime
        if not self.birthdate:
            return False
        birth_date = datetime.strptime(self.birthdate, "%Y-%m-%d")
        today = datetime.today()
        age_in_months = ((today.year - birth_date.year) * 12) + (today.month - birth_date.month)
        
        return age_in_months < self.PUPPY_AGE_MONTHS
    
    def is_adult(self):
        from datetime import datetime
        if not self.birthdate:
            return False
        birth_date = datetime.strptime(self.birthdate, "%Y-%m-%d")
        today = datetime.today()
        age_in_months = ((today.year - birth_date.year) * 12) + (today.month - birth_date.month)
        
        return age_in_months >= self.ADULT_AGE_MONTHS
    
    def is_veteran(self):
        from datetime import datetime
        if not self.birthdate:
            return False
        birth_date = datetime.strptime(self.birthdate, "%Y-%m-%d")
        today = datetime.today()
        age_in_months = ((today.year - birth_date.year) * 12) + (today.month - birth_date.month)
        
        return age_in_months >= self.VETERAN_AGE_MONTHS
