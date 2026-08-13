from unittest.mock import patch
from classes.dog_title import DogTitle
import datetime
'''
=====================
/api/dog_title/add
=====================
'''
def test_add_dog_title_ok(admin_session, dog_factory):
    dog = dog_factory()
    with patch("controller.dog_title.send_titles_email", return_value=True):
        with patch("controller.dog_title.generate_title_pdf", return_value=True):
            response = admin_session.post("/api/dog_title/add", json={
                "cwaNumber": dog.cwa_number,
                "title": "DPC",
                "titleNumber":"1",
                "titleDate": "10-11-2020",
                "namePrefix":"P",
                "nameSuffix":"S",
            })
            assert response.status_code == 201
            assert response.json["ok"]
            titles = DogTitle.list_for_dog(dog.cwa_number)
            assert len(titles) == 1
            assert titles[0].cwa_number == dog.cwa_number
            assert titles[0].title == "DPC"
            assert titles[0].title_date == datetime.date(2020,11,10)
            assert titles[0].name_prefix== "P"
            assert titles[0].name_suffix== "S"


def test_add_dog_title_not_signed_in(client, dog_factory):
    dog = dog_factory()
    with patch("controller.dog_title.send_titles_email", return_value=True):
        with patch("controller.dog_title.generate_title_pdf", return_value=True):
            response = client.post("/api/dog_title/add", json={
                "cwaNumber": dog.cwa_number,
                "title": "DPC",
                "titleNumber":"1",
                "titleDate": "10-10-2020",
                "namePrefix":"P",
                "nameSuffix":"S",
            })
            assert response.status_code == 401
            assert not response.json["ok"]
            assert response.json["error"] == "Not signed in"

def test_add_dog_title_no_permission(public_user_session, dog_factory):
    dog = dog_factory()
    with patch("controller.dog_title.send_titles_email", return_value=True):
        with patch("controller.dog_title.generate_title_pdf", return_value=True):
            response = public_user_session.post("/api/dog_title/add", json={
                "cwaNumber": dog.cwa_number,
                "title": "DPC",
                "titleNumber":"1",
                "titleDate": "10-10-2020",
                "namePrefix":"P",
                "nameSuffix":"S",
            })
            assert response.status_code == 403
            assert not response.json["ok"]
            assert response.json["error"] == "Not allowed to add dog titles"

def test_add_dog_title_only_self_permission(privileged_client_factory, dog_factory):
    client = privileged_client_factory(1,2,2)
    dog = dog_factory()
    with patch("controller.dog_title.send_titles_email", return_value=True):
        with patch("controller.dog_title.generate_title_pdf", return_value=True):
            response = client.post("/api/dog_title/add", json={
                "cwaNumber": dog.cwa_number,
                "title": "DPC",
                "titleNumber":"1",
                "titleDate": "10-10-2020",
                "namePrefix":"P",
                "nameSuffix":"S",
            })
            assert response.status_code == 403
            assert not response.json["ok"]
            assert response.json["error"] == "You can only add titles to dogs you own"

def test_add_dog_title_no_dog(admin_session, dog_factory):
    with patch("controller.dog_title.send_titles_email", return_value=True):
        with patch("controller.dog_title.generate_title_pdf", return_value=True):
            response = admin_session.post("/api/dog_title/add", json={
                "cwaNumber": "8675309",
                "title": "DPC",
                "titleNumber":"1",
                "titleDate": "10-10-2020",
                "namePrefix":"P",
                "nameSuffix":"S",
            })
            assert response.status_code == 404
            assert not response.json["ok"]
            assert response.json["error"] == "Dog does not exist"

def test_add_dog_title_no_title(admin_session, dog_factory):
    dog = dog_factory()
    with patch("controller.dog_title.send_titles_email", return_value=True):
        with patch("controller.dog_title.generate_title_pdf", return_value=True):
            response = admin_session.post("/api/dog_title/add", json={
                "cwaNumber": dog.cwa_number,
                "title": "ABC",
                "titleNumber":"1",
                "titleDate": "10-10-2020",
                "namePrefix":"P",
                "nameSuffix":"S",
            })
            assert response.status_code == 404
            assert not response.json["ok"]
            assert response.json["error"] == "Title type does not exist"

def test_add_dog_title_already_has_title(admin_session, dog_factory):
    dog = dog_factory()
    title = DogTitle(dog.cwa_number,"DPC","1",datetime.datetime.now(),"P","S")
    title.save() 
    with patch("controller.dog_title.send_titles_email", return_value=True):
        with patch("controller.dog_title.generate_title_pdf", return_value=True):
            response = admin_session.post("/api/dog_title/add", json={
                "cwaNumber": dog.cwa_number,
                "title": "DPC",
                "titleNumber":"1",
                "titleDate": "10-10-2020",
                "namePrefix":"P",
                "nameSuffix":"S",
            })
            assert response.status_code == 409
            assert not response.json["ok"]
            assert response.json["error"] == "Dog already has this title"


'''
=======================
/api/dog_title/delete
=======================
'''

def test_delete_dog_title_ok(dog_factory, admin_session):
    dog = dog_factory()
    title = DogTitle(dog.cwa_number,"ARX","1",datetime.datetime.now(),"P","S")
    title.save() 
    assert len(DogTitle.list_for_dog(dog.cwa_number)) == 1
    resp = admin_session.post("/api/dog_title/delete", json={
        "cwaNumber": dog.cwa_number,
        "title": "ARX",
        "confirm": True
    }) 
    assert resp.status_code == 200
    assert resp.json["ok"]
    assert resp.json["data"]["cwaNumber"] == dog.cwa_number
    assert resp.json["data"]["title"] == "ARX"
    assert len(DogTitle.list_for_dog(dog.cwa_number)) == 0


def test_delete_dog_title_not_signed_in(dog_factory, client):
    dog = dog_factory()
    title = DogTitle(dog.cwa_number,"ARX","1",datetime.datetime.now(),"P","S")
    title.save() 
    resp = client.post("/api/dog_title/delete", json={
        "cwaNumber": dog.cwa_number,
        "title": "ARX",
        "confirm": True
    }) 
    assert resp.status_code == 401
    assert not resp.json["ok"]
    assert resp.json["error"] == "Not signed in"


def test_delete_dog_title_no_permissions(dog_factory, public_user_session):
    dog = dog_factory()
    title = DogTitle(dog.cwa_number,"ARX","1",datetime.datetime.now(),"P","S")
    title.save() 
    resp = public_user_session.post("/api/dog_title/delete", json={
        "cwaNumber": dog.cwa_number,
        "title": "ARX",
        "confirm": True
    }) 
    assert resp.status_code == 403
    assert not resp.json["ok"]
    assert resp.json["error"] == "Not allowed to delete dog titles"

def test_delete_dog_title_no_confirmation(dog_factory, admin_session):
    dog = dog_factory()
    title = DogTitle(dog.cwa_number,"ARX","1",datetime.datetime.now(),"P","S")
    title.save() 
    resp = admin_session.post("/api/dog_title/delete", json={
        "cwaNumber": dog.cwa_number,
        "title": "ARX",
    }) 
    assert resp.status_code == 400
    assert not resp.json["ok"]
    assert resp.json["error"] == "Confirmation required"

def test_delete_dog_title_no_cwa_number(dog_factory, admin_session):
    dog = dog_factory()
    title = DogTitle(dog.cwa_number,"ARX","1",datetime.datetime.now(),"P","S")
    title.save() 
    resp = admin_session.post("/api/dog_title/delete", json={
        "title": "ARX",
        "confirm": True
    }) 
    assert resp.status_code == 400
    assert not resp.json["ok"]
    assert resp.json["error"] == "cwaNumber is required"

def test_delete_dog_title_no_title(dog_factory, admin_session):
    dog = dog_factory()
    title = DogTitle(dog.cwa_number,"ARX","1",datetime.datetime.now(),"P","S")
    title.save() 
    resp = admin_session.post("/api/dog_title/delete", json={
        "cwaNumber": dog.cwa_number,
        "confirm": True
    }) 
    assert resp.status_code == 400
    assert not resp.json["ok"]
    assert resp.json["error"] == "title is required"

def test_delete_dog_title_only_self(dog_factory, privileged_client_factory):
    session = privileged_client_factory(1,2,2)
    dog = dog_factory()
    title = DogTitle(dog.cwa_number,"ARX","1",datetime.datetime.now(),"P","S")
    title.save() 
    resp = session.post("/api/dog_title/delete", json={
        "cwaNumber": dog.cwa_number,
        "confirm": True,
        "title":"ARX"
    }) 
    assert resp.status_code == 403
    assert not resp.json["ok"]
    assert resp.json["error"] == "You can only delete titles on dogs you own"


def test_delete_dog_title_non_existiant_title(dog_factory, admin_session):
    dog = dog_factory()
    title = DogTitle(dog.cwa_number,"ARX","1",datetime.datetime.now(),"P","S")
    title.save() 
    resp = admin_session.post("/api/dog_title/delete", json={
        "cwaNumber": dog.cwa_number,
        "confirm": True,
        "title":"DPC"
    }) 
    assert resp.status_code == 404
    assert not resp.json["ok"]
    assert resp.json["error"] == "Dog title does not exist"

def test_get_title(dog_factory, public_user_session):
    dog = dog_factory()
    title1 = DogTitle(dog.cwa_number,"TRP","2",datetime.datetime.now(),"A","B")
    title1.save()
    title2 = DogTitle(dog.cwa_number,"NARX","1",datetime.datetime.now(),"C","D")
    title2.save()

    resp = public_user_session.get("/api/dog_title/get/" + dog.cwa_number)
    assert resp.json["ok"]
    assert len(resp.json["data"]) == 2
    title1_target = {
        "cwaNumber":dog.cwa_number,
        "title":"TRP",
        "titleNumber":"2",
        "namePrefix":"A",
        "nameSuffix":"B",
    }
    assert any(
    all(item in i.items() for item in title1_target.items())
    for i in resp.json["data"])
    title2_target = {
        "cwaNumber":dog.cwa_number,
        "title":"NARX",
        "titleNumber":"1",
        "namePrefix":"C",
        "nameSuffix":"D",
    }
    assert any(
    all(item in i.items() for item in title2_target.items())
    for i in resp.json["data"])

def test_get_earned_titles_ok(client, dog_factory):
    dog = dog_factory()
    title1 = DogTitle(dog.cwa_number,"TRP","2",datetime.datetime(2020,9,15),"A","B")
    title1.save()
    title2 = DogTitle(dog.cwa_number,"NARX","1",datetime.datetime(2020,10,15),"C","D")
    title2.save()
    resp = client.get("/api/dog_title/earned?start=2020-09-15&end=2020-10-15")
    assert resp.status_code == 200
    assert len(resp.json["data"]) == 2


def test_get_earned_titles_no_start(client, dog_factory):
    dog = dog_factory()
    title1 = DogTitle(dog.cwa_number,"TRP","2",datetime.datetime(2020,9,15),"A","B")
    title1.save()
    title2 = DogTitle(dog.cwa_number,"NARX","1",datetime.datetime(2020,10,15),"C","D")
    title2.save()
    resp = client.get("/api/dog_title/earned?end=2020-10-15")
    assert resp.status_code == 400
    assert resp.json["error"] == "start and end are required"

def test_get_earned_titles_no_end(client, dog_factory):
    dog = dog_factory()
    title1 = DogTitle(dog.cwa_number,"TRP","2",datetime.datetime(2020,9,15),"A","B")
    title1.save()
    title2 = DogTitle(dog.cwa_number,"NARX","1",datetime.datetime(2020,10,15),"C","D")
    title2.save()
    resp = client.get("/api/dog_title/earned?start=2020-10-15")
    assert resp.status_code == 400
    assert resp.json["error"] == "start and end are required"