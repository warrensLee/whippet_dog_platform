from classes.dog_owner import DogOwner

def test_owners_non_existant_dog(client):
    resp = client.get("/api/dog_owner/owners/12345678765")
    assert resp.json["ok"]
    assert resp.json["data"] == []
    assert resp.status_code == 200

def test_owners_no_owner_dog(client, dog_factory):
    dog = dog_factory()
    resp = client.get("/api/dog_owner/owners/" + str(dog.cwa_number))
    assert resp.json["ok"]
    assert resp.json["data"] == []
    assert resp.status_code == 200

def test_owners_has_dog(client, dog_factory, create_dummy_account):
    dog = dog_factory()
    owner = create_dummy_account("234@234.com")
    link = DogOwner(dog.cwa_number, owner.id) 
    link.save()
    resp = client.get("/api/dog_owner/owners/" + str(dog.cwa_number))
    DogOwner.delete_all_for_dog(dog.cwa_number)
    assert resp.json["ok"]
    assert len(resp.json["data"]) == 1
    assert resp.json["data"][0]["CWAID"] == dog.cwa_number
    assert resp.json["data"][0]["PersonID"] == owner.id
    assert resp.json["data"][0]["FirstName"] == owner.first_name
    assert resp.json["data"][0]["userID"] == owner.person_id
    assert resp.json["data"][0]["LastName"] == owner.last_name
    assert resp.status_code == 200


def test_get_no_person(client):
    resp = client.get("/api/dog_owner/get") 
    assert resp.status_code == 200
    assert not resp.json["ok"]
    assert resp.json["error"] == "invalid Person"

def test_get_invalid_person(client):
    resp = client.get("/api/dog_owner/get?personID=1234567") 
    assert resp.status_code == 200
    assert not resp.json["ok"]
    assert resp.json["error"] == "invalid Person"

def test_get_ok(client, dog_factory, create_dummy_account):
    dog = dog_factory()
    owner = create_dummy_account("234@234.com")
    link = DogOwner(dog.cwa_number, owner.id) 
    link.save()
    resp = client.get("/api/dog_owner/get?personID=" + str(owner.id))
    DogOwner.delete_all_for_dog(dog.cwa_number)
    assert resp.status_code == 200 
    assert resp.json["ok"]
    assert len(resp.json["data"]) == 1
    assert resp.json["data"][0]["cwaId"] == dog.cwa_number
    assert resp.json["data"][0]["personId"] == owner.id


def test_add_no_account(client):
    resp = client.post("/api/dog_owner/add")
    assert resp.status_code == 401
    assert not resp.json["ok"]
    assert resp.json["error"] == "Not signed in"


def test_add_no_permissions(privileged_client_factory):
    client = privileged_client_factory(0,2,2)
    print(client)
    resp = client.post("/api/dog_owner/add")
    print(resp.json)
    assert resp.status_code == 403
    assert not resp.json["ok"]
    assert resp.json["error"] == "Not allowed to add dog owners"

def test_add_no_cwaID(admin_session):
    resp = admin_session.post("/api/dog_owner/add", json={"personId":"123"})
    assert resp.json["error"] ==  "cwaId and personId are required"
    assert resp.status_code == 400
    assert not resp.json["ok"]

def test_add_no_personID(admin_session):
    resp = admin_session.post("/api/dog_owner/add", json={"cwaId":"123"})
    assert resp.json["error"] ==  "cwaId and personId are required"
    assert resp.status_code == 400
    assert not resp.json["ok"]

def test_add_invalid_cwaID(admin_session, create_dummy_account):
    owner = create_dummy_account("234@234.com")
    resp = admin_session.post("/api/dog_owner/add", json={"personId":owner.id, "cwaId":"123"})
    assert resp.json["error"] ==  "Dog does not exist"
    assert resp.status_code == 404
    assert not resp.json["ok"]

def test_add_no_personID(admin_session, dog_factory):
    dog = dog_factory()
    resp = admin_session.post("/api/dog_owner/add", json={"cwaId":dog.cwa_number, "personId":"1234"})
    assert resp.json["error"] ==  "Person does not exist"
    assert resp.status_code == 404
    assert not resp.json["ok"]
def test_add_not_self(privileged_client_factory):
    client = privileged_client_factory(1,2,2)
    resp = client.post("/api/dog_owner/add", json={"cwaId": "123", "personId": "21234"})
    assert resp.status_code == 403
    assert not resp.json["ok"]
    assert resp.json["error"] == "You may only add yourself as an owner"

def test_add_existing_link(privileged_client_factory, dog_factory, create_dummy_account):
    client = privileged_client_factory(3,2,2)
    dog = dog_factory()
    owner = create_dummy_account("234@234.com")
    link = DogOwner(dog.cwa_number, owner.id) 
    link.save()
    resp = client.post("/api/dog_owner/add", json={"cwaId": dog.cwa_number, "personId": owner.id})
    DogOwner.delete_all_for_dog(dog.cwa_number)
    assert resp.status_code == 409
    assert not resp.json["ok"]
    assert resp.json["error"] == "Owner link already exists"

def test_add_ok(privileged_client_factory, dog_factory, create_dummy_account):
    client = privileged_client_factory(3,2,2)
    dog = dog_factory()
    owner = create_dummy_account("234@234.com")
    resp = client.post("/api/dog_owner/add", json={"cwaId": dog.cwa_number, "personId": owner.id})
    DogOwner.delete_all_for_dog(dog.cwa_number)
    assert resp.status_code == 201
    assert resp.json["ok"]
    assert resp.json["data"]["cwaId"] == str(dog.cwa_number)
    assert resp.json["data"]["personId"] == str(owner.id)



def test_delete_no_account(client):
    resp = client.post("/api/dog_owner/delete")
    assert resp.status_code == 401
    assert not resp.json["ok"]
    assert resp.json["error"] == "Not signed in"


def test_delete_no_permissions(privileged_client_factory):
    client = privileged_client_factory(0,2,2)
    print(client)
    resp = client.post("/api/dog_owner/delete")
    print(resp.json)
    assert resp.status_code == 403
    assert not resp.json["ok"]
    assert resp.json["error"] == "Not allowed to delete dog owners"

def test_delete_no_cwaID(admin_session):
    resp = admin_session.post("/api/dog_owner/delete", json={"personId":"123"})
    assert resp.json["error"] ==  "cwaId and personId are required"
    assert resp.status_code == 400
    assert not resp.json["ok"]

def test_delete_no_personID(admin_session):
    resp = admin_session.post("/api/dog_owner/delete", json={"cwaId":"123"})
    assert resp.json["error"] ==  "cwaId and personId are required"
    assert resp.status_code == 400
    assert not resp.json["ok"]

def test_delete_not_self(privileged_client_factory):
    client = privileged_client_factory(1,2,2)
    resp = client.post("/api/dog_owner/delete", json={"cwaId": "123", "personId": "21234"})
    assert resp.status_code == 403
    assert not resp.json["ok"]
    assert resp.json["error"] == "You may only remove yourself as an owner"

def test_delete_ok(privileged_client_factory, dog_factory, create_dummy_account):
    client = privileged_client_factory(3,2,2)
    dog = dog_factory()
    owner = create_dummy_account("234@234.com")
    link = DogOwner(dog.cwa_number, owner.id) 
    link.save()
    resp = client.post("/api/dog_owner/delete", json={"cwaId": dog.cwa_number, "personId": owner.id})
    DogOwner.delete_all_for_dog(dog.cwa_number)
    assert resp.status_code == 200
    assert resp.json["ok"]
    assert resp.json["data"]["cwaId"] == str(dog.cwa_number)
    assert resp.json["data"]["personId"] == str(owner.id)

def test_delete_no_existing_link(privileged_client_factory, dog_factory, create_dummy_account):
    client = privileged_client_factory(3,2,2)
    dog = dog_factory()
    owner = create_dummy_account("234@234.com")
    resp = client.post("/api/dog_owner/delete", json={"cwaId": dog.cwa_number, "personId": owner.id})
    DogOwner.delete_all_for_dog(dog.cwa_number)
    assert resp.status_code == 404
    assert not resp.json["ok"]
    assert resp.json["error"] == "Owner link does not exist"