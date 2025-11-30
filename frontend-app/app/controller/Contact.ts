import { API_ROUTES } from "../../config/api";
import { getAuthData } from "../helpers/storage";
import { apiClient, ApiError } from "../helpers/api-client";

export interface Contact {
  username: string;
  addedAt: string;
  exists: boolean;
}

export async function getContacts(): Promise<Contact[]> {
  try {
    const authData = getAuthData();
    if (!authData?.username) {
      throw new Error('Not authenticated');
    }
    const data = await apiClient.get(
      API_ROUTES.GET_CONTACTS.replace(':username', authData.username)
    );

    if (!data.success) {
      throw new Error(data.message || 'Failed to get contacts');
    }

    return data.contacts || [];
  } catch (error) {
    console.error('Get contacts error:', error);
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function addContact(contactUsername: string): Promise<Contact> {
  try {
    const authData = getAuthData();
    if (!authData?.username) {
      throw new Error('Not authenticated');
    }

    const data = await apiClient.post(API_ROUTES.ADD_CONTACT, {
      username: authData.username,
      contactUsername
    });

    if (!data.success) {
      throw new Error(data.message || 'Failed to add contact');
    }

    return data.contact;
  } catch (error) {
    console.error('Add contact error:', error);
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function removeContact(contactUsername: string): Promise<void> {
  try {
    const authData = getAuthData();
    if (!authData?.username) {
      throw new Error('Not authenticated');
    }

    const data = await apiClient.delete(API_ROUTES.REMOVE_CONTACT, {
      username: authData.username,
      contactUsername
    });

    if (!data.success) {
      throw new Error(data.message || 'Failed to remove contact');
    }
  } catch (error) {
    console.error('Remove contact error:', error);
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
}