import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

// Storage keys
export const STORAGE_KEY = "flashcards_data";
export const STUDY_SESSIONS_KEY = "studySessions";

// Initial data
export const initialDecks = [];

// Clear all data from storage
export const clearStorage = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(STUDY_SESSIONS_KEY);
  } catch (error) {
    console.error("Error clearing storage:", error);
  }
};

// Save data to storage
export const saveData = async (data, key = STORAGE_KEY) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving data:", error);
    Alert.alert("Error", "Failed to save your data");
  }
};

// Load data from storage
export const loadData = async (key = STORAGE_KEY) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null
      ? JSON.parse(jsonValue)
      : key === STORAGE_KEY
      ? initialDecks
      : {};
  } catch (error) {
    console.error("Error loading data:", error);
    Alert.alert("Error", "Failed to load your data");
    return key === STORAGE_KEY ? initialDecks : {};
  }
};
