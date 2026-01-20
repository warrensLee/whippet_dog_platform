'''
Docstring for person

TODO:
'''

class Person:

    def __init__(self, person_id, first_name, last_name, email_address, address_line_one,
                 address_line_two, city, state_province, zip_code, country,
                 primary_phone, secondary_phone, system_role, password_hash, notes, last_edited_by, last_edited_at):
        self.person_id = person_id
        self.first_name = first_name
        self.last_name = last_name
        self.email = email_address
        self.address_line_one = address_line_one
        self.address_line_two = address_line_two
        self.city = city
        self.state_province = state_province
        self.zip_code = zip_code
        self.country = country
        self.primary_phone = primary_phone
        self.secondary_phone = secondary_phone
        self.system_role = system_role
        self.password_hash = password_hash
        self.notes = notes
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at