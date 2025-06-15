import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

// Storage keys
export const STORAGE_KEY = "flashcards_data";
export const STUDY_SESSIONS_KEY = "studySessions";

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
    // Always return empty array/object if no data exists
    if (!jsonValue) {
      return key === STORAGE_KEY ? [] : {};
    }
    return JSON.parse(jsonValue);
  } catch (error) {
    console.error("Error loading data:", error);
    Alert.alert("Error", "Failed to load your data");
    return key === STORAGE_KEY ? [] : {};
  }
};

// Clear all data from storage
export const clearStorage = async () => {
  try {
    // Clear specific keys first
    await AsyncStorage.multiRemove([STORAGE_KEY, STUDY_SESSIONS_KEY]);
    // Clear everything else just to be safe
    await AsyncStorage.clear();
  } catch (error) {
    console.error("Error clearing storage:", error);
  }
};
