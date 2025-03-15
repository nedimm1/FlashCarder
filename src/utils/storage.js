import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

// Storage keys
export const STORAGE_KEY = "flashcards_data";

// Initial data
export const initialDecks = [];

// Clear all data from storage
export const clearStorage = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing storage:", error);
  }
};

// Save data to storage
export const saveData = async (data) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving data:", error);
    Alert.alert("Error", "Failed to save your data");
  }
};

// Load data from storage
export const loadData = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : initialDecks;
  } catch (error) {
    console.error("Error loading data:", error);
    Alert.alert("Error", "Failed to load your data");
    return initialDecks;
  }
};
