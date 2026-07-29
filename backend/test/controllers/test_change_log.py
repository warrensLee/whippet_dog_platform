from classes.change_log import ChangeLog
import pytest
import datetime
@pytest.fixture
def change_log_object():
    for log in ChangeLog.list_all():
        ChangeLog.delete(log.id)

    new_log = ChangeLog(None,"CHANGEDTABLE","PK", "EDIT", 1, datetime.datetime.now(),"SOURCE","TEST1","TEST2");
    new_log.save() 
    yield new_log
    new_log.delete(new_log.id)

def test_list_all_change_logs_not_admin(all_privileges_session):
    response = all_privileges_session.get("/api/change_log/get")
    assert response.json["ok"] == False
    assert response.json["error"] == "Not authorized"
    assert response.status_code == 403


def test_get_change_log_not_admin(all_privileges_session):
    response = all_privileges_session.get("/api/change_log/get/0")
    assert response.json["ok"] == False
    assert response.json["error"] == "Not authorized"
    assert response.status_code == 403

def test_list_all_change_logs(admin_session, change_log_object):
    response = admin_session.get("/api/change_log/get")
    assert response.json["ok"]
    assert len(response.json["data"]) 
    assert response.json["data"][0]["id"] == change_log_object.id
    assert response.json["data"][0]["changedTable"] == "CHANGEDTABLE"
    assert response.json["data"][0]["recordPk"] == "PK"
    assert response.json["data"][0]["operation"] == "EDIT"
    assert response.json["data"][0]["changedBy"] == "root admin"
    assert response.json["data"][0]["source"] == "SOURCE"
    assert response.json["data"][0]["beforeData"] == "TEST1"
    assert response.json["data"][0]["afterData"] == "TEST2"

def test_get_change_log_invalid_id(admin_session):
    response = admin_session.get("/api/change_log/get/999999")
    assert response.json["ok"] == False
    assert response.json["error"] == "Change log does not exist"

def test_get_change_log(admin_session, change_log_object):
    response = admin_session.get("/api/change_log/get/" + str(change_log_object.id))
    assert response.json["ok"]
    assert response.json["data"]["id"] == change_log_object.id
    assert response.json["data"]["changedTable"] == "CHANGEDTABLE"
    assert response.json["data"]["recordPk"] == "PK"
    assert response.json["data"]["operation"] == "EDIT"
    assert response.json["data"]["changedBy"] == 1
    assert response.json["data"]["source"] == "SOURCE"
    assert response.json["data"]["beforeData"] == "TEST1"
    assert response.json["data"]["afterData"] == "TEST2"