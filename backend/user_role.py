'''
Docstring for user_role

TODO:
'''

class UserRole:

    SYSTEM_ROLES = {"Admin", "Editor", "Viewer"}
    
    def __init__(self, role_id, title, last_edited_by, last_edited_at):
        self.role_id = role_id
        self.title = title
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at