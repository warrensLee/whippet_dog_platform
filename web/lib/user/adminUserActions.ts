import axios from 'axios';
import { EditForm, Person } from '@/app/admin/users/types';

export async function saveUserEditRequest(form: EditForm) {
  return axios.post('/api/person/edit',
    {
      id: form.id,
      personId: form.personId,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      addressLineOne: form.addressLineOne,
      addressLineTwo: form.addressLineTwo,
      city: form.city,
      stateProvince: form.stateProvince,
      zipCode: form.zipCode,
      country: form.country,
      primaryPhone: form.primaryPhone,
      secondaryPhone: form.secondaryPhone,
      systemRole: form.systemRole,
      locked: form.locked,
      notes: form.notes,
      publicNotes: form.publicNotes
    });
}

export async function toggleUserLockRequest(user: Person, nextLocked: boolean) {
  return axios.post('/api/person/edit',
    {
      id: user.id,
      personId: user.personId,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      addressLineOne: user.addressLineOne ?? '',
      addressLineTwo: user.addressLineTwo ?? '',
      city: user.city ?? '',
      stateProvince: user.stateProvince ?? '',
      zipCode: user.zipCode ?? '',
      country: user.country ?? '',
      primaryPhone: user.primaryPhone ?? '',
      secondaryPhone: user.secondaryPhone ?? '',
      systemRole: user.systemRole ?? 'PUBLIC',
      locked: nextLocked,
      notes: user.notes ?? '',
      publicNotes: user.publicNotes ?? ''
    });
}

export async function deleteUserRequest(user: Person) {
  return axios.post('/api/person/delete',
    {
      id: user.id,
      confirmId: user.id,
    });
}
