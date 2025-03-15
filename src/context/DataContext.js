import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { loadData, saveData } from "../utils/storage";

export const DataContext = React.createContext();

export const DataProvider = ({ children }) => {
  const [decks, setDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on app start
  useEffect(() => {
    const fetchData = async () => {
      const data = await loadData();
      setDecks(data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Save data whenever decks change
  const updateDecks = (newDecks) => {
    setDecks(newDecks);
    saveData(newDecks);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#1a1a1a", padding: 20 }}>
        <Text style={{ color: "#fff" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <DataContext.Provider value={{ decks, updateDecks }}>
      {children}
    </DataContext.Provider>
  );
};
