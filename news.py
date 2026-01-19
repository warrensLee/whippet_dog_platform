'''
Docstring for news

TODO:
'''

class News:

    def __init__(self, news_id, title, content, created_at, updated_at, author_id, last_edited_by, last_edited_at):
        self.news_id = news_id
        self.title = title
        self.content = content
        self.created_at = created_at
        self.updated_at = updated_at
        self.author_id = author_id
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at